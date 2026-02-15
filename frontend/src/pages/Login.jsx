import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { t, language, setLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-lang-switcher">
          {['en', 'uz', 'ru'].map((lang) => (
            <button key={lang} type="button" className={`lang-btn-sm ${language === lang ? 'active' : ''}`} onClick={() => setLanguage(lang)}>
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="auth-header">
          <h1>{t('mobil_acceleration')}</h1>
          <p>{t('sign_in_to_account')}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>{t('username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('enter_username')}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('enter_password')}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '...' : t('sign_in')}
          </button>
        </form>
        <p className="auth-footer">
          {t('dont_have_account')} <Link to="/register">{t('register')}</Link>
        </p>
      </div>
      <div className="auth-bg" />
    </div>
  );
}
