import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/register.css';
import '../../styles/login.css';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [emailError, setEmailError]     = useState('');
  const [passError, setPassError]       = useState('');
  const [alertError, setAlertError]     = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

  const validateForm = () => {
    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    } else { setEmailError(''); }
    if (!password || password.length < 1) {
      setPassError('Please enter your password.');
      valid = false;
    } else { setPassError(''); }
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
      setAlertSuccess(true);

      // Save token and user to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const role = response.data.user.role;
      setTimeout(() => {
        if (role === 'super_admin') navigate('/superadmin/dashboard');
        else if (role === 'advisor') navigate('/advisor/dashboard');
        else navigate('/student/dashboard');
      }, 1400);
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid email or password.';
      setAlertError(msg);
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
              <label className="field-label" htmlFor="password">Password</label>
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

            <p className="signin-link">
              Don't have an account? <Link to="/register">Register now</Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;