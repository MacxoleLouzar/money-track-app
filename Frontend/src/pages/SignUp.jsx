import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/auth.css';

export default function SignUp() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Sign up failed'); return; }
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
        <p className="auth-subtitle">Create your account</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="auth-input" type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
          <input className="auth-input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="auth-input" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Sign Up'}</button>
        </form>
        <div className="auth-switch">
          Already have an account? <span onClick={() => navigate('/signin')}>Sign In</span>
        </div>
      </div>
    </div>
  );
}
