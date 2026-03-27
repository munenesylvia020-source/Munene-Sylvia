import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiPlusCircle, FiActivity, FiSettings, FiLogOut } from 'react-icons/fi';
import '../styles/bottomNav.css';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const navItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard', className: 'nav-home' },
    { icon: FiPlusCircle, label: 'Add Expense', path: '/add', className: 'nav-add' },
    { icon: FiActivity, label: 'Activity', path: '/activity', className: 'nav-activity' },
    { icon: FiSettings, label: 'Settings', path: '/daily-limit', className: 'nav-settings' },
    { icon: FiLogOut, label: 'Logout', path: '/logout', className: 'nav-logout' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path)} ${item.className}`}
            onClick={() => navigate(item.path)}
            title={item.label}
            aria-label={item.label}
          >
            <item.icon className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}