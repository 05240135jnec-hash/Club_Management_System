import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/register.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [showConf, setShowConf]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState('');
  const [errors, setErrors]             = useState({});

  // Password strength
  const getStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8)           s++;
    if (pw.length >= 12)          s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  };
  const strengthLevels = [
    { label: 'Too weak',    color: '#d63031', width: '18%'  },
    { label: 'Weak',        color: '#e17055', width: '36%'  },
    { label: 'Fair',        color: '#fdcb6e', width: '58%'  },
    { label: 'Strong',      color: '#1D9E75', width: '80%'  },
    { label: 'Very strong', color: '#00b894', width: '100%' },
  ];
  const strength = password ? strengthLevels[getStrength(password)] : null;

  const validate = () => {
    const e = {};
    if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (confirm !== password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/reset-password', {
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="auth-page">
        <div className="bg-overlay" />
        <div className="page-wrapper">
          <div className="form-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 className="form-title" style={{ color: '#ff6b6b' }}>Invalid Link</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>
              This reset link is invalid or has expired.
            </p>
            <button onClick={() => navigate('/forgot-password')} className="btn-register" style={{ marginTop: 0 }}>
              REQUEST NEW LINK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="bg-overlay" />
      <div className="page-wrapper">
        <div className="form-card">

          {/* Header */}
          <div className="form-head text-center">
            <h2 className="form-title">RESET PASSWORD</h2>
            <p className="form-subtitle">Enter your new password below</p>
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
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(29,158,117,0.15)',
                border: '2px solid rgba(29,158,117,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" width="36" height="36">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <h3 style={{ color: '#c9a84c', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Password Reset!</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
                Your password has been reset successfully.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12.5 }}>
                Redirecting to login in 3 seconds...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>

              <div className="field-group">
                <label className="field-label">New Password</label>
                <div className="pw-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`field-input ${errors.password ? 'error' : password ? 'filled' : ''}`}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                    <i className={`bi ${showPass ? 'bi-eye' : 'bi-eye-slash'}`} />
                  </button>
                </div>
                {strength && (
                  <div className="strength-bar-wrap show">
                    <div className="strength-bar">
                      <div className="strength-fill" style={{ width: strength.width, background: strength.color }} />
                    </div>
                    <span className="strength-text" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
                <span className="pw-hint">Minimum 8 characters</span>
                {errors.password && <div className="invalid-feedback show">{errors.password}</div>}
              </div>

              <div className="field-group">
                <label className="field-label">Confirm New Password</label>
                <div className="pw-wrap">
                  <input
                    type={showConf ? 'text' : 'password'}
                    className={`field-input ${errors.confirm ? 'error' : confirm ? 'filled' : ''}`}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowConf(!showConf)}>
                    <i className={`bi ${showConf ? 'bi-eye' : 'bi-eye-slash'}`} />
                  </button>
                </div>
                {errors.confirm && <div className="invalid-feedback show">{errors.confirm}</div>}
              </div>

              <button type="submit" className="btn-register" disabled={loading}>
                <span>{loading ? 'RESETTING...' : 'RESET PASSWORD'}</span>
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