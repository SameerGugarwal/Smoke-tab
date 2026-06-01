import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatAmount, buildUpiLink, isMobile } from '../lib/helpers';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentModal({ tab, shop, onClose, onConfirmed }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(tab?.balanceDue || 0);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [showUpiError, setShowUpiError] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const amountRupees = (amount / 100).toFixed(2);
  const upiLink = shop?.upiId ? buildUpiLink(shop.upiId, amount, shop.name) : null;
  const mobile = isMobile();

  const recordPending = async () => {
    setLoading(true);
    try {
      await api.post('/payments', { tabId: tab._id, amount, method: 'upi' });
      setPaid(true);
      setTimeout(() => { onClose(); onConfirmed?.(); }, 2000);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSpecificPay = async (app) => {
    if (!user?.upiId) {
      alert("Missing UPI ID! Please update your profile.");
      return;
    }

    if (!mobile || !upiLink) {
      // Desktop or no vendor upi -> just record pending
      recordPending();
      return;
    }

    let intentUrl = upiLink; // generic upi://pay
    if (app === 'gpay') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      intentUrl = upiLink.replace('upi://pay', isIOS ? 'gpay://upi/pay' : 'tez://upi/pay');
    }
    if (app === 'phonepe') intentUrl = upiLink.replace('upi://pay', 'phonepe://pay');
    if (app === 'paytm') intentUrl = upiLink.replace('upi://pay', 'paytmmp://pay');

    if (app === 'generic') {
      // Ban the generic link trigger on mobile to prevent iOS defaulting to WhatsApp.
      // Instead, we show the QR code directly.
      setShowQr(true);
      return;
    }

    // Trigger Deep Link with Fallback
    let intentFired = false;
    const timeout = setTimeout(() => {
      if (!intentFired) {
        setShowUpiError(true);
      }
    }, 2000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        intentFired = true;
        clearTimeout(timeout);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });
    
    const a = document.createElement('a');
    a.href = intentUrl;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    recordPending();
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

            {(showUpiError || showQr) && (
              <div className="card" style={{ marginBottom: '1rem', borderColor: showUpiError ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                <p style={{ color: showUpiError ? 'var(--color-danger)' : 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                  {showUpiError ? "Could not launch UPI app. Please scan the QR code:" : "Scan this QR code with any UPI app to pay:"}
                </p>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block' }}>
                    <QRCodeSVG value={upiLink} size={150} />
                  </div>
                </div>
                {showQr && (
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ marginTop: '0.85rem', width: '100%' }}
                    onClick={recordPending}
                    disabled={loading}
                  >
                    {loading ? '...' : 'I have sent the payment'}
                  </button>
                )}
              </div>
            )}

            {mobile && upiLink && shop?.upiId && amount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Select your UPI App to Pay ₹{amountRupees}:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={() => handleSpecificPay('gpay')} disabled={loading}>Google Pay</button>
                  <button className="btn btn-primary" onClick={() => handleSpecificPay('phonepe')} disabled={loading}>PhonePe</button>
                  <button className="btn btn-primary" onClick={() => handleSpecificPay('paytm')} disabled={loading}>Paytm</button>
                  <button className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }} onClick={() => setShowQr(!showQr)} disabled={loading}>
                    {showQr ? 'Hide QR Code' : 'Show QR Code'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => handleSpecificPay('generic')}
                disabled={loading || amount <= 0}
              >
                {loading ? '...' : 'Record Payment'}
              </button>
            )}
            <button className="btn btn-ghost btn-lg" style={{ marginTop: '0.5rem' }} onClick={onClose}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
