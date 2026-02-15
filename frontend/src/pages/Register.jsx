import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { t, language, setLanguage } = useLanguage();
  const [form, setForm] = useState({
    full_name: '',
    region: '',
    district: '',
    neighborhood: '',
    phone_number: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Registration failed.');
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
          <h1>{t('create_account')}</h1>
          <p>{t('register_for_courses')}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>{t('full_name')}</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('region')} (Viloyat)</label>
              <input name="region" value={form.region} onChange={handleChange} placeholder="e.g. Toshkent" required />
            </div>
            <div className="form-group">
              <label>{t('district')} (Tuman)</label>
              <input name="district" value={form.district} onChange={handleChange} placeholder="e.g. Yunusobod" required />
            </div>
          </div>
          <div className="form-group">
            <label>{t('neighborhood')} (Mahalla)</label>
            <input name="neighborhood" value={form.neighborhood} onChange={handleChange} placeholder="e.g. Mahalla 1" required />
          </div>
          <div className="form-group">
            <label>{t('phone_number')}</label>
            <input name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} placeholder="+998901234567" required />
          </div>
          <div className="form-group">
            <label>{t('username')}</label>
            <input name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '...' : t('register')}
          </button>
        </form>
        <p className="auth-footer">
          {t('already_have_account')} <Link to="/login">{t('sign_in')}</Link>
        </p>
      </div>
      <div className="auth-bg" />
    </div>
  );
}
