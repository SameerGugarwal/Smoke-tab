import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import QRCodeScanner from '../../components/QRCodeScanner';

export default function ScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [manualToken, setManualToken] = useState('');

  // Auto-process token from URL (from QR code scan)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) linkShop(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linkShop = async (token) => {
    if (loading || success) return;
    setLoading(true);
    try {
      const res = await api.post('/tabs/link', { qrToken: token });
      setSuccess(`Connected to ${res.data.tab?.shopId?.name || 'shop'}! Redirecting...`);
      setTimeout(() => navigate('/buyer'), 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid QR code');
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>📷</div>
        <h2>Scan Shop QR</h2>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', marginTop: '1rem', marginBottom: '1.5rem' }}>
          <p>Ask the vendor to show you their Tab QR code</p>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p>Connecting...</p>
        </div>
      )}

      {success && (
        <div className="card" style={{ borderColor: 'var(--color-success)', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>{success}</p>
        </div>
      )}



      {!loading && !success && (
        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: '2rem' }}>
            <QRCodeScanner onScan={(token) => linkShop(token)} />
          </div>

          <div className="divider" style={{ margin: '1.5rem 0' }} />
          <div className="section-title">Or enter token manually</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              className="input"
              placeholder="Shop QR token"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => linkShop(manualToken)}
              disabled={!manualToken.trim()}
            >Link</button>
          </div>
        </div>
      )}

      <button className="btn btn-ghost" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/buyer')}>
        ← Back
      </button>
    </div>
  );
}
