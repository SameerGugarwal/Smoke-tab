import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VendorUPI() {
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const res = await api.get('/shops/mine');
      if (res.data.shop?.upiId) {
        setUpiId(res.data.shop.upiId);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (upiId && !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }

    setSaving(true);
    try {
      await api.put('/shops/mine', { upiId: upiId.trim() });
      setMessage('UPI ID updated successfully! Customers can now pay you directly.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update UPI ID');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page">
      <div className="page-header">
        <div className="list-item-icon">🏦</div>
        <h3>Payment Setup</h3>
      </div>

      <div className="card">
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Enter your UPI ID to allow customers to pay their dues directly via UPI apps (PhonePe, GPay, Paytm).
        </p>

        {error && <div className="toast" style={{ background: 'var(--color-danger)' }}>{error}</div>}
        {message && <div className="toast" style={{ background: 'var(--color-success)' }}>{message}</div>}

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="input-label">Your UPI ID</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 9876543210@ybl"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save UPI ID'}
          </button>
        </form>
      </div>
    </div>
  );
}
