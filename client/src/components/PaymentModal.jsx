import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatAmount, buildUpiLink, isMobile } from '../lib/helpers';
import api from '../lib/api';

export default function PaymentModal({ tab, shop, onClose, onConfirmed }) {
  const [amount, setAmount] = useState(tab?.balanceDue || 0);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const amountRupees = (amount / 100).toFixed(2);
  const upiLink = shop?.upiId ? buildUpiLink(shop.upiId, amount, shop.name) : null;
  const mobile = isMobile();

  const handlePay = async () => {
    if (mobile && upiLink) {
      window.location.href = upiLink;
    }
    // Record payment as pending
    setLoading(true);
    try {
      await api.post('/payments', { tabId: tab._id, amount, method: 'upi' });
      setPaid(true);
      setTimeout(() => { onClose(); onConfirmed?.(); }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ marginBottom: '1.25rem' }}>Pay Dues</h2>

        {paid ? (
          <div className="empty-state">
            <span style={{ fontSize: '3rem' }}>✅</span>
            <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>Payment recorded! Waiting for vendor confirmation.</p>
          </div>
        ) : (
          <>
            {/* Amount selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="input-label">Amount</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Total due: {formatAmount(tab?.balanceDue)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', background: 'var(--color-surface2)', borderRadius: '10px 0 0 10px', border: '1px solid var(--color-border)', borderRight: 'none', color: 'var(--color-primary)', fontWeight: 700 }}>₹</span>
                <input
                  className="input"
                  style={{ borderRadius: '0 10px 10px 0' }}
                  type="number"
                  value={amountRupees}
                  onChange={(e) => setAmount(Math.round(parseFloat(e.target.value || 0) * 100))}
                  min="1"
                  max={tab?.balanceDue / 100}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setAmount(Math.round(tab.balanceDue * 0.5))}>50%</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAmount(tab.balanceDue)}>Full</button>
              </div>
            </div>

            {/* UPI QR for desktop */}
            {!mobile && upiLink && (
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block' }}>
                  <QRCodeSVG value={upiLink} size={180} />
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Scan with any UPI app</p>
              </div>
            )}

            {!shop?.upiId && (
              <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--color-warning)' }}>
                <p style={{ color: 'var(--color-warning)', fontSize: '0.85rem' }}>⚠️ Vendor hasn't set up UPI yet. Pay cash and ask them to confirm.</p>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={handlePay}
              disabled={loading || amount <= 0}
            >
              {loading ? '...' : mobile ? `Pay ₹${amountRupees} via UPI` : 'Record Payment'}
            </button>
            <button className="btn btn-ghost btn-lg" style={{ marginTop: '0.5rem' }} onClick={onClose}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
