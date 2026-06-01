import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Store, CreditCard, BarChart2, Package, QrCode, Home, TrendingUp, Target, ScanLine } from 'lucide-react';

const vendorLinks = [
  { to: '/vendor', icon: <Store size={22} />, label: 'Home' },
  { to: '/vendor/payments', icon: <CreditCard size={22} />, label: 'Payments' },
  { to: '/vendor/analytics', icon: <BarChart2 size={22} />, label: 'Analytics' },
  { to: '/vendor/inventory', icon: <Package size={22} />, label: 'Inventory' },
  { to: '/vendor/qr', icon: <QrCode size={22} />, label: 'My QR' },
];

const buyerLinks = [
  { to: '/buyer', icon: <Home size={22} />, label: 'Home' },
  { to: '/buyer/payments', icon: <CreditCard size={22} />, label: 'Payments' },
  { to: '/buyer/consumption', icon: <TrendingUp size={22} />, label: 'Stats' },
  { to: '/buyer/limits', icon: <Target size={22} />, label: 'Limits' },
  { to: '/scan', icon: <ScanLine size={22} />, label: 'Scan' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const links = user?.role === 'vendor' ? vendorLinks : buyerLinks;

  return (
    <nav style={{
      position: 'relative',
      flexShrink: 0,
      height: '64px',
      background: 'rgba(10, 10, 15, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 50,
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
            justifyContent: 'center',
            gap: '4px',
            flex: 1,
            height: '100%',
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
            transition: 'all 0.2s',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textDecoration: 'none',
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', transition: 'transform 0.2s', transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
                {icon}
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
