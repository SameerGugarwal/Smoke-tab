import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function LimitsPage() {
  const navigate = useNavigate();
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ limitType: 'daily_count', limitValue: '', itemCategory: 'cigarette' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.get('/limits').then((res) => setLimits(res.data.limits)).finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const saveLimit = async (e) => {
    e.preventDefault();
    if (!form.limitValue) return;
    setSaving(true);
    try {
      let value = parseFloat(form.limitValue);
      if (form.limitType === 'daily_amount') value = Math.round(value * 100); // convert to paise

      const res = await api.post('/limits', { ...form, limitValue: value });
      setLimits((prev) => {
        const filtered = prev.filter((l) => !(l.limitType === form.limitType && l.itemCategory === form.itemCategory));
        return [...filtered, res.data.limit];
      });
      setForm({ limitType: 'daily_count', limitValue: '', itemCategory: 'cigarette' });
      showToast('Limit saved ✅');
    } catch (err) {
      showToast('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const removeLimit = async (id) => {
    await api.delete(`/limits/${id}`);
    setLimits((prev) => prev.filter((l) => l._id !== id));
    showToast('Limit removed');
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/buyer')}>←</button>
        <h2>Set Limits 🎯</h2>
      </div>

      <div className="card">
        <p style={{ fontSize: '0.9rem' }}>
          Set daily limits to help control your smoking habits. Your vendor will be warned if they try to add more.
        </p>
      </div>

      {/* Active limits */}
      {limits.length > 0 && (
        <div>
          <div className="section-title">Active Limits</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {limits.map((limit) => (
              <div
                key={limit._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🎯</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    Max {limit.limitType === 'daily_count'
                      ? `${limit.limitValue} cigarettes`
                      : `₹${limit.limitValue / 100}`} per day
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {limit.itemCategory} · {limit.limitType}
                  </div>
                </div>
                <button
                  onClick={() => removeLimit(limit._id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '1.1rem' }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set new limit */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Set New Limit</h3>
        <form onSubmit={saveLimit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="input-group">
            <label className="input-label">Limit Type</label>
            <select className="input" value={form.limitType} onChange={(e) => setForm({ ...form, limitType: e.target.value })}>
              <option value="daily_count">Daily Count (cigarettes)</option>
              <option value="daily_amount">Daily Spend (₹)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">
              {form.limitType === 'daily_count' ? 'Max cigarettes/day' : 'Max spend/day (₹)'}
            </label>
            <input
              className="input"
              type="number"
              placeholder={form.limitType === 'daily_count' ? '5' : '100'}
              value={form.limitValue}
              onChange={(e) => setForm({ ...form, limitValue: e.target.value })}
              min="1"
              required
            />
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
            {saving ? '...' : '🎯 Set Limit'}
          </button>
        </form>
      </div>
    </div>
  );
}
