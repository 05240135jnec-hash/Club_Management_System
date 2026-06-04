import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/register.css';

// Options data
const COURSES = [
  'Civil Engineering', 'Electrical Engineering',
  'Electronics & Communication Engineering', 'Information Technology',
  'Computer Science & Engineering', 'Mechanical Engineering',
  'Architecture', 'Environmental Engineering',
  'Geoinformation Science', 'Geology & Mining'
];
const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
const DEPARTMENTS = [
  'Civil & Architecture', 'Electrical Engineering',
  'Electronics & Communication', 'Information Technology',
  'Mechanical Engineering', 'Environmental Engineering',
  'Basic Sciences', 'Management Studies', 'DSSA Office'
];

// Combobox Component
function Combobox({ options, value, onChange, placeholder, errorMsg, allowAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [allOptions, setAllOptions] = useState(options);
  const wrapRef = useRef();

  const filtered = query
    ? allOptions.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : allOptions;

  const handleSelect = (val) => {
    onChange(val);
    setQuery('');
    setOpen(false);
  };

  const handleAdd = () => {
    const trimmed = query.trim();
    if (!allOptions.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
      setAllOptions([...allOptions, trimmed]);
    }
    handleSelect(trimmed);
  };

  return (
    <div className={`combobox-wrap ${open ? 'open' : ''}`} ref={wrapRef}>
      <input
        type="text"
        className={`field-input combobox-input ${errorMsg ? 'error' : value ? 'filled' : ''}`}
        placeholder={placeholder}
        value={open ? query : value}
        onChange={e => { setQuery(e.target.value); onChange(''); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        autoComplete="off"
      />
      <button type="button" className="combo-chevron" onClick={() => setOpen(!open)}>
        <i className="bi bi-chevron-down"></i>
      </button>
      {open && (
        <ul className="combo-dropdown">
          {filtered.map(opt => (
            <li key={opt} className="combo-option" onMouseDown={() => handleSelect(opt)}>
              {opt}
            </li>
          ))}
          {allowAdd && query && !allOptions.some(o => o.toLowerCase() === query.toLowerCase()) && (
            <li className="combo-option add-new" onMouseDown={handleAdd}>
              <i className="bi bi-plus-circle-fill" style={{ color: 'var(--green)', fontSize: 13 }}></i>
              {' '}Add "<strong>{query}</strong>"
            </li>
          )}
          {filtered.length === 0 && !allowAdd && (
            <li className="combo-empty">No matching options.</li>
          )}
        </ul>
      )}
      {errorMsg && <div className="invalid-feedback show">{errorMsg}</div>}
    </div>
  );
}

// Main Register Component
function Register() {
  const navigate = useNavigate();

  const [name, setName]               = useState('');
  const [userType, setUserType]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConf, setShowConf]       = useState(false);
  const [loading, setLoading]         = useState(false);

  // Student fields
  const [course, setCourse]   = useState('');
  const [year, setYear]       = useState('');
  const [studentId, setStudentId] = useState('');

  // Advisor fields
  const [staffId, setStaffId]     = useState('');
  const [department, setDepartment] = useState('');

  // Errors
  const [errors, setErrors] = useState({});
  const [alertError, setAlertError]     = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

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
    if (!name.trim())                                   e.name = 'Full name is required.';
    if (!userType)                                      e.userType = 'Please select user type.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.email = 'Enter a valid email address.';
    } else if (!email.endsWith('.jnec@rub.edu.bt')) {
        e.email = 'Only JNEC email (e.g. 05240165.jnec@rub.edu.bt) is allowed.';
    }
    if (password.length < 8)                            e.password = 'Password must be at least 8 characters.';
    if (confirm !== password)                           e.confirm = 'Passwords do not match.';
    if (userType === 'student') {
      if (!course)      e.course    = 'Please select or enter a course.';
      if (!year)        e.year      = 'Please select a year.';
      if (!studentId)   e.studentId = 'Student ID is required.';
    }
    if (userType === 'adviser' || userType === 'co_adviser') {
      if (!staffId)     e.staffId    = 'Staff ID is required.';
      if (!department)  e.department = 'Please select or enter a department.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertError('');
    setAlertSuccess(false);
    if (!validate()) { setAlertError('Please fill in all required fields correctly.'); return; }
    setLoading(true);
    try {
      await axios.post('/api/register', {
        name,
        email,
        password,
        password_confirmation: confirm,
        role:       userType === 'adviser' ? 'advisor' : userType === 'co_adviser' ? 'co_advisor' : 'student',
        course:     userType === 'student'                              ? course     : undefined,
        year:       userType === 'student'                              ? year       : undefined,
        student_id: userType === 'student'                              ? studentId  : undefined,
        staff_id:   (userType === 'adviser' || userType === 'co_adviser') ? staffId    : undefined,
        department: (userType === 'adviser' || userType === 'co_adviser') ? department : undefined,
      });
      setAlertSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
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

          {/* HEADER */}
          <div className="form-head text-center">
            <div className="logo-container">
              <img src="/image/logo.png" alt="JNEC Logo" className="college-logo" />
            </div>
            <h2 className="form-title">REGISTRATION</h2>
            <p className="form-subtitle">Register using your official JNEC Email</p>
            <div className="head-rule"></div>
          </div>

          {/* ALERTS */}
          {alertError && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              {alertError}
            </div>
          )}

          {/* ✅ UPDATED SUCCESS MESSAGE */}
          {alertSuccess && (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              Registration successful! Please check <strong>{email}</strong> to verify your account before logging in.
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Full Name */}
            <div className="field-group">
              <label className="field-label">Full Name</label>
              <input
                type="text"
                className={`field-input ${errors.name ? 'error' : name ? 'filled' : ''}`}
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
              {errors.name && <div className="invalid-feedback show">{errors.name}</div>}
            </div>

            {/* User Type + Email */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">User Type</label>
                  <div className="select-wrap">
                    <select
                      className={`field-select ${errors.userType ? 'error' : userType ? 'filled' : ''}`}
                      value={userType}
                      onChange={e => { setUserType(e.target.value); setErrors({}); }}
                    >
                      <option value="" disabled></option>
                      <option value="student">Student</option>
                      <option value="adviser">Club Advisor</option>
                      <option value="co_adviser">Co-Advisor</option>
                    </select>
                    <i className="bi bi-chevron-down select-chevron"></i>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input
                    type="email"
                    className={`field-input ${errors.email ? 'error' : email ? 'filled' : ''}`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {errors.email && <div className="invalid-feedback show">{errors.email}</div>}
                </div>
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="pw-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={`field-input ${errors.password ? 'error' : password ? 'filled' : ''}`}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                      <i className={`bi ${showPass ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                    </button>
                  </div>
                  {strength && (
                    <div className="strength-bar-wrap show">
                      <div className="strength-bar">
                        <div className="strength-fill" style={{ width: strength.width, background: strength.color }}></div>
                      </div>
                      <span className="strength-text" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                  <span className="pw-hint">Minimum 8 characters</span>
                  {errors.password && <div className="invalid-feedback show">{errors.password}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Confirm Password</label>
                  <div className="pw-wrap">
                    <input
                      type={showConf ? 'text' : 'password'}
                      className={`field-input ${errors.confirm ? 'error' : confirm ? 'filled' : ''}`}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowConf(!showConf)}>
                      <i className={`bi ${showConf ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                    </button>
                  </div>
                  {errors.confirm && <div className="invalid-feedback show">{errors.confirm}</div>}
                </div>
              </div>
            </div>

            {/* STUDENT SECTION */}
            {userType === 'student' && (
              <div className="details-section">
                <div className="section-divider"><span>STUDENT DETAILS</span></div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="field-group">
                      <label className="field-label">Course</label>
                      <Combobox
                        options={COURSES} value={course} onChange={setCourse}
                        placeholder="Type or select..." errorMsg={errors.course} allowAdd={true}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="field-group">
                      <label className="field-label">Year</label>
                      <Combobox
                        options={YEARS} value={year} onChange={setYear}
                        placeholder="Select year..." errorMsg={errors.year} allowAdd={false}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="field-group">
                      <label className="field-label">Student ID</label>
                      <input
                        type="text"
                        className={`field-input ${errors.studentId ? 'error' : studentId ? 'filled' : ''}`}
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                      />
                      {errors.studentId && <div className="invalid-feedback show">{errors.studentId}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADVISER SECTION */}
            {userType === 'adviser' && (
              <div className="details-section">
                <div className="section-divider"><span>ADVISER DETAILS</span></div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="field-group">
                      <label className="field-label">Staff ID</label>
                      <input
                        type="text"
                        className={`field-input ${errors.staffId ? 'error' : staffId ? 'filled' : ''}`}
                        value={staffId}
                        onChange={e => setStaffId(e.target.value)}
                      />
                      {errors.staffId && <div className="invalid-feedback show">{errors.staffId}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="field-group">
                      <label className="field-label">Department</label>
                      <Combobox
                        options={DEPARTMENTS} value={department} onChange={setDepartment}
                        placeholder="Type or select..." errorMsg={errors.department} allowAdd={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CO-ADVISER SECTION */}
            {userType === 'co_adviser' && (
              <div className="details-section">
                <div className="section-divider"><span>CO-ADVISER DETAILS</span></div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="field-group">
                      <label className="field-label">Staff ID</label>
                      <input
                        type="text"
                        className={`field-input ${errors.staffId ? 'error' : staffId ? 'filled' : ''}`}
                        value={staffId}
                        onChange={e => setStaffId(e.target.value)}
                      />
                      {errors.staffId && <div className="invalid-feedback show">{errors.staffId}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="field-group">
                      <label className="field-label">Department</label>
                      <Combobox
                        options={DEPARTMENTS} value={department} onChange={setDepartment}
                        placeholder="Type or select..." errorMsg={errors.department} allowAdd={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-register" disabled={loading}>
              <span>{loading ? 'REGISTERING...' : 'REGISTER'}</span>
              {loading && <span className="spinner-border spinner-border-sm ms-2"></span>}
            </button>

            <p className="signin-link">
              Already have an account? <a href="/login">Sign in instead</a>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;