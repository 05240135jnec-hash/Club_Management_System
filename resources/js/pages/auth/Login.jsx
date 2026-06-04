import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/register.css';
import '../../styles/login.css';

function Login() {
  const navigate = useNavigate();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [emailError,   setEmailError]   = useState('');
  const [passError,    setPassError]    = useState('');
  const [alertError,   setAlertError]   = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Show Google error if redirected back with error
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get('google_error');
    if (googleError) {
      setAlertError(decodeURIComponent(googleError));
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const validateForm = () => {
    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!password || password.length < 1) {
      setPassError('Please enter your password.');
      valid = false;
    } else {
      setPassError('');
    }
    if (!valid) setAlertError('Please fill in all required fields correctly.');
    return valid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlertError('');
    setAlertSuccess(false);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/login', { email, password });
      const { token, user, force_password_change } = response.data;

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('role', user.role);
      if (user.club_id) sessionStorage.setItem('club_id', user.club_id);

      if (force_password_change) {
        window.location.replace('/change-password');
        return;
      }

      setAlertSuccess(true);
      setTimeout(() => {
        if (user.role === 'super_admin')                                  window.location.replace('/superadmin/dashboard');
        else if (user.role === 'advisor' || user.role === 'co_advisor')   window.location.replace('/advisor/dashboard');
        else                                                              window.location.replace('/student/StudentHome');
      }, 1400);
    } catch (error) {
      const data = error.response?.data;
      setAlertError(data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
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
            <h2 className="form-title">LOGIN</h2>
            <p className="form-subtitle">Log in using your official JNEC Email</p>
            <div className="head-rule"></div>
          </div>

          {alertError && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              {alertError}
            </div>
          )}
          {alertSuccess && (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              Login successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <div className="field-group">
              <label className="field-label" htmlFor="email">Email Address</label>
              <input
                type="email" id="email"
                className={`field-input ${emailError ? 'error' : email ? 'filled' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" required
              />
              {emailError && <div className="invalid-feedback show">{emailError}</div>}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="password">
                Password
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              </label>
              <div className="pw-wrap">
                <input
                  type={showPass ? 'text' : 'password'} id="password"
                  className={`field-input ${passError ? 'error' : password ? 'filled' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password" required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  <i className={`bi ${showPass ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                </button>
              </div>
              {passError && <div className="invalid-feedback show">{passError}</div>}
            </div>

            <button type="submit" className="btn-register" disabled={loading}>
              <span>{loading ? 'LOGGING IN...' : 'LOG IN'}</span>
              {loading && <span className="spinner-border spinner-border-sm ms-2"></span>}
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>

          <a href="/auth/google/redirect" className="btn-google">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;