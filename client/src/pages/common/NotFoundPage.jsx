import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', padding: '2rem' }}>
      <div style={{ fontSize: '5rem' }}>🚬</div>
      <h1 style={{ color: 'var(--color-primary)' }}>404</h1>
      <p style={{ textAlign: 'center' }}>This page doesn't exist</p>
      <button className="btn btn-primary" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );
}
