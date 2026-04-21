import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const vendorLinks = [
  { to: '/vendor', icon: '🏪', label: 'Home' },
  { to: '/vendor/analytics', icon: '📊', label: 'Analytics' },
  { to: '/vendor/inventory', icon: '📦', label: 'Inventory' },
  { to: '/vendor/qr', icon: '📱', label: 'My QR' },
];

const buyerLinks = [
  { to: '/buyer', icon: '🏠', label: 'Home' },
  { to: '/buyer/consumption', icon: '📈', label: 'Stats' },
  { to: '/buyer/limits', icon: '🎯', label: 'Limits' },
  { to: '/scan', icon: '📷', label: 'Scan' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const links = user?.role === 'vendor' ? vendorLinks : buyerLinks;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'rgba(10, 10, 15, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 50,
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {links.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/vendor' || to === '/buyer'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
            transition: 'all 0.2s',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
          })}
        >
          <span style={{ fontSize: '1.4rem' }}>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
