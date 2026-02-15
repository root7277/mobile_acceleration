import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="page-title">{t('mobil_acceleration')} Platform</span>
      </div>
      <div className="topbar-right">
        <div className="language-switcher">
          {['en', 'uz', 'ru'].map((lang) => (
            <button
              key={lang}
              className={`lang-btn ${language === lang ? 'active' : ''}`}
              onClick={() => setLanguage(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.full_name}</span>
          <span className="user-role">{user?.role?.replace('_', ' ')}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          {t('logout')}
        </button>
      </div>
    </header>
  );
}
