import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/register.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [emailError, setEmailError] = useState('');

  const validate = () => {
    if (!email.trim()) { setEmailError('Email is required.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email.'); return false; }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-overlay" />
      <div className="page-wrapper">
        <div className="form-card">

          {/* Header */}
          <div className="form-head text-center">
            <div className="logo-container">
              <img src="/image/logo.png" alt="JNEC Logo" className="college-logo" />
            </div>
            <h2 className="form-title">FORGOT PASSWORD</h2>
            <p className="form-subtitle">Enter your email to receive a reset link</p>
            <div className="head-rule" />
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-circle-fill me-2" />
              {error}
            </div>
          )}

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
                If <strong style={{ color: '#fff' }}>{email}</strong> is registered, a password reset link has been sent.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, marginBottom: 24 }}>
                Check your inbox and click the link to reset your password. The link expires in 60 minutes.
              </p>
              <button onClick={() => navigate('/login')} className="btn-register" style={{ marginTop: 0 }}>
                BACK TO LOGIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  className={`field-input ${emailError ? 'error' : email ? 'filled' : ''}`}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="your.id.jnec@rub.edu.bt"
                  autoComplete="email"
                />
                {emailError && <div className="invalid-feedback show">{emailError}</div>}
              </div>

              <button type="submit" className="btn-register" disabled={loading}>
                <span>{loading ? 'SENDING...' : 'SEND RESET LINK'}</span>
                {loading && <span className="spinner-border spinner-border-sm ms-2" />}
              </button>

              <p className="signin-link">
                Remember your password? <a href="/login">Sign in</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}