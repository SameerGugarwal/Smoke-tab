import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VendorQR() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shops/mine').then((res) => setShop(res.data.shop)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/vendor')}>←</button>
        <h2>My QR Code</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
        {shop ? (
          <>
            <QRCodeDisplay token={shop.qrToken} shopName={shop.name} />
            <div className="card" style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem' }}>
                Customers scan this QR code to connect to your tab. Once linked, you can add items directly to their balance.
              </p>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <p>Set up your shop first</p>
          </div>
        )}
      </div>
    </div>
  );
}
