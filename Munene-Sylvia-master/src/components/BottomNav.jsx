import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Activity, PieChart, Settings, LogOut } from 'lucide-react';
import '../styles/bottomNav.css';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: PieChart, label: 'Portfolio', path: '/portfolio' },
    { icon: PlusCircle, label: 'Add', path: '/add', isPrimary: true },
    { icon: Activity, label: 'Activity', path: '/activity' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <div className="bottom-nav-spacer"></div>
      <nav className="bottom-nav">
        <div className="bottom-nav-container">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${isActive(item.path)} ${item.isPrimary ? 'nav-primary' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.label}
              aria-label={item.label}
            >
              <item.icon className="nav-icon" size={item.isPrimary ? 28 : 24} />
              <span className="nav-label">{item.label}</span>
              {isActive(item.path) && !item.isPrimary && <span className="nav-indicator"></span>}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}