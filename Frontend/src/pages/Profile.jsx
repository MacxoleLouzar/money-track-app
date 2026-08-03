import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { User, Mail, Lock, Pencil, Check, X } from 'lucide-react';
import '../css/profile.css';

export default function Profile() {
  const { user, token, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameMsg, setNameMsg] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${API_URL}/auth/profile`, { headers })
      .then(r => r.json())
      .then(d => { setProfile(d); setNewName(d.name); })
      .finally(() => setLoading(false));
  }, []);

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const joinedDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const saveName = async () => {
    if (!newName.trim()) return;
    setNameSaving(true); setNameMsg('');
    const res = await fetch(`${API_URL}/auth/profile`, { method: 'PUT', headers, body: JSON.stringify({ name: newName }) });
    const data = await res.json();
    if (res.ok) {
      setProfile(p => ({ ...p, name: data.name }));
      login(data, token); // update AuthContext
      setEditingName(false);
      setNameMsg('');
    } else {
      setNameMsg(data.message || 'Failed to update name');
    }
    setNameSaving(false);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg(''); setPwSuccess(false);
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { setPwMsg('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT', headers,
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } else {
      setPwMsg(data.message || 'Failed to update password');
    }
    setPwSaving(false);
  };

  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account</p>
        </div>
      </div>

      {/* Avatar card */}
      <div className="profile-avatar-card">
        <div className="profile-avatar">{initials(profile?.name)}</div>
        <div className="profile-avatar-info">
          <div className="profile-avatar-name">{profile?.name}</div>
          <div className="profile-avatar-email">{profile?.email}</div>
          {joinedDate && <div className="profile-avatar-joined">Member since {joinedDate}</div>}
        </div>
      </div>

      {/* Name section */}
      <div className="profile-section">
        <div className="profile-section-title"><User size={16} /> Full Name</div>
        {editingName ? (
          <div className="profile-edit-row">
            <input
              className="form-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveName()}
            />
            <button className="btn btn-primary btn-sm" onClick={saveName} disabled={nameSaving}>
              <Check size={15} /> {nameSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { setEditingName(false); setNewName(profile?.name); setNameMsg(''); }}>
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="profile-field-row">
            <span className="profile-field-value">{profile?.name}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setEditingName(true)}>
              <Pencil size={14} /> Edit
            </button>
          </div>
        )}
        {nameMsg && <p className="profile-msg error">{nameMsg}</p>}
      </div>

      {/* Email section (read-only) */}
      <div className="profile-section">
        <div className="profile-section-title"><Mail size={16} /> Email Address</div>
        <div className="profile-field-row">
          <span className="profile-field-value">{profile?.email}</span>
          <span className="profile-field-badge">Read-only</span>
        </div>
      </div>

      {/* Change password section */}
      <div className="profile-section">
        <div className="profile-section-title"><Lock size={16} /> Change Password</div>
        <form onSubmit={savePassword} className="profile-pw-form">
          <input
            className="form-input"
            type="password"
            placeholder="Current password"
            value={pwForm.currentPassword}
            onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
            required
          />
          <input
            className="form-input"
            type="password"
            placeholder="New password (min 6 chars)"
            value={pwForm.newPassword}
            onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
            required
          />
          <input
            className="form-input"
            type="password"
            placeholder="Confirm new password"
            value={pwForm.confirm}
            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
            required
          />
          {pwMsg && <p className="profile-msg error">{pwMsg}</p>}
          {pwSuccess && <p className="profile-msg success">✅ Password updated successfully</p>}
          <button className="btn btn-primary" type="submit" disabled={pwSaving}>
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
