import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/auth.css';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Sign in failed'); return; }
      login(data.user, data.token);
      navigate('/dashboard');
    } catch {
      setError('Server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">💰 MoneyTrack</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="auth-input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="auth-input" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="auth-switch">
          Don't have an account? <span onClick={() => navigate('/signup')}>Sign Up</span>
        </div>
      </div>
    </div>
  );
}
