import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatAmount } from '../../lib/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';

const ICONS = ['🚬', '☕', '🍬', '🧃', '🍫', '💊', '🧈', '🥤', '🍵', '🌿'];
const CATEGORIES = ['cigarette', 'chai', 'gum', 'other'];

export default function InventoryManager() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '🚬', price: '', category: 'cigarette' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const res = await api.get('/shops/mine/inventory');
      setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const res = await api.post('/shops/mine/inventory', {
        ...form,
        price: Math.round(parseFloat(form.price) * 100),
      });
      setItems((prev) => [...prev, res.data.item]);
      setForm({ name: '', icon: '🚬', price: '', category: 'cigarette' });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id) => {
    await api.delete(`/shops/mine/inventory/${id}`);
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const syncCatalog = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await api.post('/shops/mine/sync-catalog');
      setSyncMsg(res.data.message);
      if (res.data.added > 0) loadItems();
      setTimeout(() => setSyncMsg(''), 3000);
    } catch (err) {
      setSyncMsg('Error syncing catalog');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/vendor')}>←</button>
        <h2>Inventory</h2>
      </div>

      {syncMsg && (
        <div style={{
          padding: '0.625rem 1rem',
          background: 'var(--color-primary-dim)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-primary)',
          fontSize: '0.85rem',
          textAlign: 'center',
          marginBottom: '0.75rem',
        }}>
          {syncMsg}
        </div>
      )}

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item) => (
          <div
            key={item._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.category}</div>
            </div>
            <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{formatAmount(item.price)}</div>
            <button
              onClick={() => removeItem(item._id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '1.1rem' }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="card">
          <form onSubmit={saveItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3>Add Item</h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="input-group" style={{ flex: 2 }}>
                <label className="input-label">Name</label>
                <input className="input" placeholder="Classic Milds" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Price (₹)</label>
                <input className="input" type="number" placeholder="15" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} min="0.5" step="0.5" required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Icon</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {ICONS.map((ic) => (
                  <button
                    key={ic} type="button"
                    onClick={() => setForm({ ...form, icon: ic })}
                    style={{
                      width: 40, height: 40,
                      background: form.icon === ic ? 'var(--color-primary-dim)' : 'var(--color-surface2)',
                      border: `2px solid ${form.icon === ic ? 'var(--color-primary)' : 'transparent'}`,
                      borderRadius: '8px',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                    }}
                  >{ic}</button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? '...' : 'Add Item'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => setShowForm(true)} style={{ flex: 1 }}>
            + Add Item
          </button>
          <button
            className="btn btn-lg"
            onClick={syncCatalog}
            disabled={syncing}
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              cursor: 'pointer',
            }}
          >
            {syncing ? 'Syncing...' : '🔄 Sync Catalog'}
          </button>
        </div>
      )}
    </div>
  );
}

