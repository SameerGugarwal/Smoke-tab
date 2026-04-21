import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { formatAmount, getInitials } from '../../lib/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VendorDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [shopName, setShopName] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shopRes, tabsRes] = await Promise.all([
        api.get('/shops/mine').catch(() => null),
        api.get('/tabs/vendor').catch(() => ({ data: { tabs: [] } })),
      ]);
      setShop(shopRes?.data?.shop || null);
      setTabs(tabsRes.data.tabs || []);
    } finally {
      setLoading(false);
    }
  };

  const createShop = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/shops', { name: shopName.trim(), upiId: upiId.trim() });
      setShop(res.data.shop);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const totalDue = tabs.reduce((s, t) => s + (t.balanceDue || 0), 0);

  if (loading) return <LoadingSpinner fullPage />;

  // Shop setup screen
  if (!shop) {
    return (
      <div style={{ padding: '2rem 1.5rem', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>🏪</div>
          <h2 style={{ marginTop: '0.5rem' }}>Set up your shop</h2>
          <p>Create your shop profile to start managing tabs</p>
        </div>
        <form onSubmit={createShop} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Shop Name</label>
            <input className="input" placeholder="Ramesh Tapri" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">UPI ID (optional)</label>
            <input className="input" placeholder="shopname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={creating}>
            {creating ? '...' : 'Create Shop'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Welcome back,</div>
          <h2>{user?.name}</h2>
        </div>
        <button onClick={signOut} className="btn btn-ghost btn-sm">Sign out</button>
      </div>

      {/* Shop info + total exposure */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderColor: 'var(--color-primary)', borderWidth: 2 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
          {shop.name} · Total Outstanding
        </div>
        <div className="amount">{formatAmount(totalDue)}</div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {tabs.length} active customer{tabs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Customer list */}
      <div>
        <div className="section-title">Customers</div>
        {tabs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p>No customers yet. Share your QR code to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tabs.map((tab) => (
              <div
                key={tab._id}
                className="list-item"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                onClick={() => navigate(`/vendor/customer/${tab._id}`)}
              >
                <div className="avatar">
                  {getInitials(tab.buyerId?.name || '?')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{tab.buyerId?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {tab.buyerId?.phone}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: 700,
                    color: tab.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                  }}>
                    {formatAmount(tab.balanceDue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>due</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
