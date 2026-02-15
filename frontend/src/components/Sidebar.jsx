import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
  { to: '/dashboard', labelKey: 'dashboard', icon: '◉' },
  { to: '/courses', labelKey: 'courses', icon: '◇' },
  { to: '/certificates', labelKey: 'certificates', icon: '▣' },
];

const adminItems = [
  { to: '/admin', labelKey: 'admin', icon: '⚙' },
  { to: '/admin/users', labelKey: 'users', icon: '○' },
  { to: '/admin/courses', labelKey: 'courses', icon: '◇' },
  { to: '/admin/enrollments', labelKey: 'enrollments', icon: '◈' },
  { to: '/admin/statistics', labelKey: 'statistics', icon: '▤' },
];

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">{t('mobil_acceleration')}</h1>
        <span className="logo-sub">{t('courses_platform')}</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, labelKey, icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            {t(labelKey)}
          </NavLink>
        ))}
        {isAdmin() && (
          <>
            <div className="nav-divider" />
            {adminItems.map(({ to, labelKey, icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{icon}</span>
                {t(labelKey)}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <span className="version">v1.0.0</span>
      </div>
    </aside>
  );
}
