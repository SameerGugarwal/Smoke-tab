import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { formatAmount } from '../../lib/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Camera } from 'lucide-react';
import useSocket from '../../hooks/useSocket';
import { connectSocket } from '../../lib/socket';

export default function BuyerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpiEdit, setShowUpiEdit] = useState(false);
  const [newUpi, setNewUpi] = useState(user?.upiId || '');
  const [savingUpi, setSavingUpi] = useState(false);

  useEffect(() => {
    loadTabs();
    const s = connectSocket();
    s.emit('join:user', { userId: user?._id });
  }, [user?._id]);

  useSocket('tab:item-added', ({ tab }) => {
    setTabs((prev) => prev.map((t) => t._id === tab._id ? { ...t, balanceDue: tab.balanceDue } : t));
  });

  useSocket('tab:payment-received', ({ tab }) => {
    setTabs((prev) => prev.map((t) => t._id === tab._id ? { ...t, balanceDue: tab.balanceDue } : t));
  });

  const loadTabs = async () => {
    try {
      const res = await api.get('/tabs/buyer');
      setTabs(res.data.tabs);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUpi = async () => {
    if (!newUpi.trim()) return;
    setSavingUpi(true);
    try {
      await api.put('/auth/upi', { upiId: newUpi.trim() });
      setShowUpiEdit(false);
      // Optional: show a toast, but alert is fine for now
      alert('UPI ID updated successfully!');
      // Force reload to update context if needed, or rely on next session
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    } finally {
      setSavingUpi(false);
    }
  };

  const totalDue = tabs.reduce((s, t) => s + (t.balanceDue || 0), 0);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Hi,</div>
          <h2>{user?.name}</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => { setShowUpiEdit(!showUpiEdit); setNewUpi(user?.upiId || ''); }} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>UPI ID</button>
          <button onClick={signOut} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>Sign out</button>
        </div>
      </div>

      {/* Edit UPI Panel */}
      {showUpiEdit && (
        <div className="card" style={{ marginBottom: '1rem', border: '1px solid var(--color-primary)', animation: 'fadeIn 0.2s ease' }}>
           <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Update UPI ID</h4>
           <div style={{ display: 'flex', gap: '0.5rem' }}>
             <input 
               className="input" 
               style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
               value={newUpi} 
               onChange={e => setNewUpi(e.target.value.toLowerCase())} 
               placeholder="e.g. name@bank" 
             />
             <button className="btn btn-primary btn-sm" onClick={handleUpdateUpi} disabled={savingUpi || !newUpi}>
               {savingUpi ? '...' : 'Save'}
             </button>
           </div>
        </div>
      )}

      {/* Total due */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        borderColor: totalDue > 0 ? 'var(--color-danger)' : 'var(--color-primary)',
        borderWidth: 2,
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Total Dues</div>
        <div className={`amount ${totalDue > 0 ? 'amount-danger' : ''}`}>{formatAmount(totalDue)}</div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          across {tabs.length} shop{tabs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Shops / Tabs */}
      <div>
        <div className="section-title">Your Tabs</div>
        {tabs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Camera size={48} />
            </div>
            <p>No active shop tabs.<br/>Scan a tapri's QR to open a tab!</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/scan')}>
              Scan QR Code
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tabs.map((tab) => {
              const shop = tab.shopId;
              return (
                <div
                  key={tab._id}
                  className="list-item"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => navigate(`/buyer/tab/${tab._id}`)}
                >
                  <div className="list-item-icon">🏪</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{shop?.name || 'Unknown Shop'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {tab.balanceDue > 0 ? 'Click to pay' : 'All clear ✓'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 700,
                      color: tab.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                    }}>
                      {formatAmount(tab.balanceDue)}
                    </div>
                    {tab.balanceDue > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>due</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
