import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeDisplay({ token, shopName }) {
  const value = `${window.location.origin}/scan?token=${token}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        background: '#fff',
        padding: '1.5rem',
        borderRadius: '20px',
        boxShadow: '0 0 40px rgba(0, 212, 170, 0.2)',
      }}>
        <QRCodeSVG
          value={value}
          size={220}
          level="H"
          imageSettings={{
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🚬%3C/text%3E%3C/svg%3E",
            height: 32,
            width: 32,
            excavate: true,
          }}
        />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, color: 'var(--color-text)' }}>{shopName}</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Customer scans this to connect</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
          {token?.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}
