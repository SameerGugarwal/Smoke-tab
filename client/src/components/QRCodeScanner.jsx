import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRCodeScanner({ onScan, onError }) {

  useEffect(() => {
    let html5QrcodeScanner = null;

    // Use a short timeout to bypass React 18 Strict Mode's synchronous double-mount.
    const initTimer = setTimeout(() => {
      const container = document.getElementById("qr-reader");
      if (container && container.innerHTML) {
        container.innerHTML = ""; // Force clear any ghost UI
      }

    // Create instance of the scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        // Stop scanning on success (optional, but good UX so it doesn't double-scan)
        html5QrcodeScanner.clear().catch(err => console.error("Failed to clear scanner", err));
        
        // Extract token if it's a URL
        try {
          // If the scanned text is a full URL like http://.../scan?token=abc
          if (decodedText.includes('http')) {
            const url = new URL(decodedText);
            const token = url.searchParams.get('token');
            if (token) {
              onScan(token);
              return;
            }
          }
          // If it's just the raw token string
          onScan(decodedText);
        } catch {
          onScan(decodedText);
        }
      },
      (error) => {
        // Ignored. html5-qrcode calls this for every frame that doesn't have a QR
        if (onError) onError(error);
      }
    );
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimer);
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [onScan, onError]);

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div id="qr-reader"></div>
      <style>{`
        /* Overrides for html5-qrcode default UI */
        #qr-reader {
          border: none !important;
          border-radius: 16px;
          overflow: hidden;
          background: var(--color-surface);
        }
        #qr-reader__scan_region {
          background: #000;
        }
        #qr-reader button {
          background: var(--color-primary);
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          margin: 10px;
        }
        #qr-reader select {
          padding: 8px;
          border-radius: 8px;
          background: var(--color-bg);
          color: var(--color-text);
          border: 1px solid #333;
        }
        #qr-reader a {
          color: var(--color-text-dim);
          text-decoration: none;
        }
        /* Hide the "Powered by html5-qrcode" text which is usually the last link */
        #qr-reader > div > a {
          display: none !important;
        }
        /* Style the "Scan an Image File" toggle link */
        #html5-qrcode-anchor-scan-type-change {
          display: inline-block !important;
          margin-top: 15px;
          padding: 8px 20px;
          color: var(--color-primary) !important;
          text-decoration: none !important;
          border: 1px solid var(--color-primary);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        #html5-qrcode-anchor-scan-type-change:hover {
          background: rgba(0, 212, 170, 0.1);
        }
        #qr-reader__dashboard_section_csr span {
          color: var(--color-text) !important;
        }
      `}</style>
    </div>
  );
}
