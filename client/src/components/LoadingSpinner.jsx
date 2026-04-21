export default function LoadingSpinner({ fullPage }) {
  if (fullPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ margin: 0 }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading...</p>
      </div>
    );
  }
  return <div className="spinner" />;
}
