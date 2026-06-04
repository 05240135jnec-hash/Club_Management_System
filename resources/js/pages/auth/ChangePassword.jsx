import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/register.css';
import '../../styles/login.css';

export default function ChangePassword() {
  const navigate  = useNavigate();
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post('/api/change-password', {
        password,
        password_confirmation: confirm,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.club_id) sessionStorage.setItem('club_id', res.data.club_id);

      setSuccess(true);
      const role = sessionStorage.getItem('role');
      setTimeout(() => {
        if (role === 'super_admin')                          window.location.replace('/superadmin/dashboard');
        else if (role === 'advisor' || role === 'co_advisor') window.location.replace('/advisor/dashboard');
        else                                                  window.location.replace('/student/StudentHome');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="bg-overlay"></div>
      <div className="page-wrapper">
        <div className="form-card">
          <div className="form-head text-center">
            <div className="logo-container">
              <img src="/image/logo.png" alt="JNEC Logo" className="college-logo" />
            </div>
            <h2 className="form-title">SET YOUR PASSWORD</h2>
            <p className="form-subtitle">Welcome! Please set your own password to continue.</p>
            <div className="head-rule"></div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              Password changed successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label className="field-label">New Password</label>
              <div className="pw-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`field-input ${password ? 'filled' : ''}`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  <i className={`bi ${showPass ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                </button>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Confirm Password</label>
              <div className="pw-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`field-input ${confirm ? 'filled' : ''}`}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  <i className={`bi ${showConfirm ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-register" disabled={loading}>
              <span>{loading ? 'SAVING...' : 'SET PASSWORD & CONTINUE'}</span>
              {loading && <span className="spinner-border spinner-border-sm ms-2"></span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}