import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { formatAmount } from '../../lib/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import useSocket from '../../hooks/useSocket';
import { connectSocket } from '../../lib/socket';

export default function BuyerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTabs();
    const s = connectSocket();
    s.emit('join:user', { userId: user?._id });
  }, []);

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
        <button onClick={signOut} className="btn btn-ghost btn-sm">Sign out</button>
      </div>

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
            <span className="empty-icon">📷</span>
            <p>No active tabs. Scan a shop's QR code to get started.</p>
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
