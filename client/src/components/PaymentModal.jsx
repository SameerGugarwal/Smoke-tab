import { useState, useEffect } from 'react';
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
  const [showBetaAlert, setShowBetaAlert] = useState(false);
  const [showUpiDropdown, setShowUpiDropdown] = useState(false);
  const [qrImageDataUrl, setQrImageDataUrl] = useState('');

  const amountRupees = (amount / 100).toFixed(2);
  const upiLink = shop?.upiId ? buildUpiLink(shop.upiId, amount, shop.name) : null;
  const mobile = isMobile();

  // Background QR code PNG generation (essential for synchronous, unblocked iOS downloads)
  useEffect(() => {
    if (!upiLink) return;

    const generateQrPng = () => {
      try {
        const svg = document.querySelector('.hidden-qr-generator svg');
        if (!svg) {
          // If the DOM hasn't rendered the hidden generator yet, retry in a moment
          setTimeout(generateQrPng, 100);
          return;
        }

        const svgString = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const context = canvas.getContext('2d');
          
          // Solid white background for scanning reliability
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, 300, 300);
          context.drawImage(image, 25, 25, 250, 250);
          
          const pngURL = canvas.toDataURL('image/png');
          setQrImageDataUrl(pngURL);
          URL.revokeObjectURL(blobURL);
        };
        image.src = blobURL;
      } catch (err) {
        console.error('Failed to pre-generate QR png', err);
      }
    };

    // Reset old PNG while generating the new one (e.g. if amount changes)
    setQrImageDataUrl('');
    generateQrPng();
  }, [upiLink]);

  const recordPending = async (methodType = 'upi') => {
    // If called directly by onClick event handler, methodType gets the React Event object.
    // We protect against this by checking if it's a string, and default to 'upi'.
    const finalMethod = (typeof methodType === 'string') ? methodType : 'upi';

    setLoading(true);
    try {
      await api.post('/payments', { tabId: tab._id, amount, method: finalMethod });
      setPaid(true);
      setTimeout(() => { onClose(); onConfirmed?.(); }, 2000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message || 'Failed to record payment. Please try again.');
      setLoading(false);
    }
  };

  const downloadQrCode = () => {
    if (!qrImageDataUrl) {
      alert('Generating QR image, please try again in a second or take a screenshot.');
      return;
    }
    try {
      // Synchronous click execution (will never be blocked by mobile browser popup blockers)
      const downloadLink = document.createElement('a');
      downloadLink.href = qrImageDataUrl;
      downloadLink.download = `smoketab_pay_${shop?.name || 'shop'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Failed to download QR code', err);
      alert('Automatic save failed. Please long-press (hold) the QR code image to save it.');
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0 }}>Pay Dues</h2>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255, 193, 7, 0.15)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>BETA v0.9.1</span>
        </div>

        {showBetaAlert && (
          <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--color-warning)', background: 'rgba(255, 193, 7, 0.05)', padding: '1rem', borderRadius: '10px', position: 'relative' }}>
            <button 
              style={{ position: 'absolute', top: '8px', right: '12px', background: 'none', border: 'none', color: 'var(--color-warning)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
              onClick={() => setShowBetaAlert(false)}
            >
              ✕
            </button>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ color: 'var(--color-warning)', margin: '0 0 4px 0', fontSize: '0.9rem' }}>Beta Version Notice</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', margin: 0, lineHeight: '1.4' }}>
                  Direct app redirection is currently disabled in the **Beta version**. Please use the **"Show QR Code"** option or select **"Pay in Cash"** below.
                </p>
              </div>
            </div>
          </div>
        )}

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
                <div className="payment-qr-container" style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block' }}>
                    {qrImageDataUrl ? (
                      <img 
                        src={qrImageDataUrl} 
                        alt="UPI QR Code" 
                        style={{ width: '160px', height: '160px', display: 'block', margin: '0 auto', userSelect: 'auto', WebkitUserSelect: 'auto' }} 
                      />
                    ) : (
                      <QRCodeSVG value={upiLink} size={150} />
                    )}
                  </div>
                </div>

                {mobile && (
                  <div style={{ marginTop: '1rem', textAlign: 'center', background: 'var(--color-surface2)', padding: '0.75rem', borderRadius: '10px', border: '1px dashed var(--color-border)' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ border: '1px solid var(--color-border)', width: '100%', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--color-surface1)' }}
                      onClick={downloadQrCode}
                      disabled={!qrImageDataUrl}
                    >
                      📥 Save QR to Gallery
                    </button>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
                      <strong>Steps:</strong> Once saved, open <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong>. Tap the scanner icon, click <strong>"Upload from Gallery"</strong>, choose this image, and complete your payment!
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', lineHeight: '1.4', margin: 0, marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                      💡 <strong>Tip for iPhone:</strong> If saving fails, just <strong>press and hold (long-press)</strong> the QR image above and tap <strong>"Add to Photos"</strong>!
                    </p>
                  </div>
                )}

                {showQr && (
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ marginTop: '0.85rem', width: '100%' }}
                    onClick={() => recordPending('upi')}
                    disabled={loading}
                  >
                    {loading ? '...' : 'I have sent the payment'}
                  </button>
                )}
              </div>
            )}

            {mobile && upiLink && shop?.upiId && amount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Select Payment Method:</p>
                
                {/* 1. UPI App Dropdown Button */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ border: '1px solid var(--color-border)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 16px', background: 'var(--color-surface2)' }} 
                    onClick={() => {
                      setShowUpiDropdown(!showUpiDropdown);
                      setShowQr(false); // Close QR when looking at UPI dropdown
                    }}
                    disabled={loading}
                  >
                    <span style={{ fontWeight: 600 }}>📱 Use UPI App</span>
                    <span style={{ fontSize: '0.8rem', transform: showUpiDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </button>
                  
                  {/* Dropdown Options */}
                  {showUpiDropdown && (
                    <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '4px', padding: '0.5rem', background: 'var(--color-surface2)', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}
                        onClick={() => { setShowBetaAlert(true); setShowUpiDropdown(false); }}
                      >
                        <span>Google Pay</span>
                        <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>(Beta)</span>
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}
                        onClick={() => { setShowBetaAlert(true); setShowUpiDropdown(false); }}
                      >
                        <span>PhonePe</span>
                        <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>(Beta)</span>
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}
                        onClick={() => { setShowBetaAlert(true); setShowUpiDropdown(false); }}
                      >
                        <span>Paytm</span>
                        <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>(Beta)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Show QR Code Button */}
                <button 
                  className="btn btn-ghost" 
                  style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', background: showQr ? 'var(--color-surface3)' : 'transparent', fontWeight: 600 }} 
                  onClick={() => {
                    setShowQr(!showQr);
                    setShowUpiDropdown(false); // Close UPI dropdown when showing QR
                  }} 
                  disabled={loading}
                >
                  {showQr ? '🙈 Hide QR Code' : '📸 Show QR Code (Recommended)'}
                </button>

                {/* 3. Pay in Cash Button */}
                <button 
                  className="btn btn-ghost" 
                  style={{ border: '1px solid var(--color-success)', color: 'var(--color-success)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', fontWeight: 600 }} 
                  onClick={() => {
                    if (window.confirm(`Request cash payment of ₹${amountRupees} to the vendor?`)) {
                      recordPending('cash');
                    }
                  }} 
                  disabled={loading}
                >
                  💵 Pay in Cash
                </button>
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

        {/* Hidden QR Generator for synchronous PNG conversions */}
        {upiLink && (
          <div style={{ display: 'none' }} className="hidden-qr-generator">
            <QRCodeSVG value={upiLink} size={250} />
          </div>
        )}
      </div>
    </div>
  );
}
