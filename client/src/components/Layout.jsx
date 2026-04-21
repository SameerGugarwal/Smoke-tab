import BottomNav from './BottomNav';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout-root">
      <div className="layout-inner">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
