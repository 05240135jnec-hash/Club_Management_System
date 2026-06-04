import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/advisor/acceptinvitation.css';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [inviteInfo, setInviteInfo]   = useState(null);   // club name from token
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [form, setForm]               = useState({ name: '', password: '', password_confirmation: '' });
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);

  // ── Fetch invite info (club name) from token ──────────────
  useEffect(() => {
    if (!token) { setLoadingInfo(false); return; }
    axios.get(`/api/invitations/info?token=${token}`)
      .then(res => setInviteInfo(res.data))
      .catch(() => setInviteInfo(null))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.name.trim())                              return setError('Please enter your full name.');
    if (form.password.length < 8)                       return setError('Password must be at least 8 characters.');
    if (form.password !== form.password_confirmation)   return setError('Passwords do not match.');

    setLoading(true);
    try {
      const res = await axios.post('/api/invitations/accept', {
        token,
        name:                  form.name,
        password:              form.password,
        password_confirmation: form.password_confirmation,
      });

      // ── Save session exactly like normal login ──
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user',  JSON.stringify(res.data.user));
      sessionStorage.setItem('role',  res.data.user.role);   // 'co_advisor'

      setSuccess(true);

      // ── Redirect to advisor dashboard after 2 s ──
      setTimeout(() => navigate('/advisor/dashboard'), 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── No token ──────────────────────────────────────────────
  if (!token) {
    return (
      <div className="ai-wrapper">
        <div className="ai-card">
          <div className="ai-icon ai-icon--warn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <h2 className="ai-title">Invalid Link</h2>
          <p className="ai-desc">This invitation link is invalid or has already been used.</p>
          <button className="ai-btn" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────
  if (success) {
    return (
      <div className="ai-wrapper">
        <div className="ai-card">
          <div className="ai-icon ai-icon--success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h2 className="ai-title">Welcome Aboard! 🎉</h2>
          <p className="ai-desc">
            Your co-advisor account has been created and linked to
            <strong> {inviteInfo?.club_name || 'the club'}</strong>.
            <br/>Redirecting to your dashboard...
          </p>
          <div className="ai-loader"></div>
        </div>
      </div>
    );
  }

  // ── Loading invite info ───────────────────────────────────
  if (loadingInfo) {
    return (
      <div className="ai-wrapper">
        <div className="ai-card">
          <div className="ai-loader"></div>
          <p className="ai-desc" style={{ marginTop: 16 }}>Loading invitation...</p>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────
  return (
    <div className="ai-wrapper">
      <div className="ai-card">

        {/* Header */}
        <div className="ai-header">
          <div className="ai-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <h1 className="ai-title">Accept Co-Advisor Invitation</h1>

          {/* Show club name from token */}
          {inviteInfo?.club_name && (
            <div className="ai-club-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              {inviteInfo.club_name}
            </div>
          )}

          <p className="ai-desc">Set your name and password to complete your account setup.</p>
        </div>

        {/* Form */}
        <div className="ai-form">

          <div className="ai-field">
            <label className="ai-label">Full Name <span className="ai-required">*</span></label>
            <input
              className={`ai-input ${error && !form.name ? 'err' : ''}`}
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="ai-field">
            <label className="ai-label">Password <span className="ai-required">*</span></label>
            <input
              className="ai-input"
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="ai-field">
            <label className="ai-label">Confirm Password <span className="ai-required">*</span></label>
            <input
              className="ai-input"
              type="password"
              name="password_confirmation"
              placeholder="Re-enter your password"
              value={form.password_confirmation}
              onChange={handleChange}
            />
          </div>

          {error && <div className="ai-error">{error}</div>}

          <button
            className="ai-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Accept & Join Club'}
          </button>

        </div>

        <p className="ai-footer-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          Your account is secured and linked to your club automatically.
        </p>

      </div>
    </div>
  );
}