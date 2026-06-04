import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SuperAdminLayout from './components/SuperAdminLayout';
import Swal from 'sweetalert2';
import '../../styles/superadmin/settings.css';

const getToken = () => sessionStorage.getItem('token');

function getInitials(name) {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Settings() {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Password modal
  const [pwModal, setPwModal]         = useState(false);
  const [currentPw, setCurrentPw]     = useState('');
  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [pwSaving, setPwSaving]       = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Max clubs
  const [maxClubs, setMaxClubs]             = useState(2);
  const [maxClubsModal, setMaxClubsModal]   = useState(false);
  const [maxClubsInput, setMaxClubsInput]   = useState(2);
  const [maxClubsSaving, setMaxClubsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSystemSettings();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res  = await fetch('/api/profile', { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setUser(data.user);
    } catch {}
    setLoading(false);
  }

  async function fetchSystemSettings() {
    try {
      const res  = await fetch('/api/superadmin/settings', { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setMaxClubs(data.max_clubs_per_student ?? 2);
    } catch {}
  }

  // ── Max clubs ──
  function openMaxClubsModal() { setMaxClubsInput(maxClubs); setMaxClubsModal(true); }

  async function saveMaxClubs() {
    const val = parseInt(maxClubsInput);
    if (!val || val < 1 || val > 10) {
      Swal.fire({ icon: 'warning', title: 'Invalid', text: 'Please enter a number between 1 and 10.' });
      return;
    }
    setMaxClubsSaving(true);
    try {
      const res  = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_clubs_per_student: val }),
      });
      const data = await res.json();
      if (res.ok) {
        setMaxClubs(data.max_clubs_per_student);
        setMaxClubsModal(false);
        Swal.fire({ icon: 'success', title: 'Updated!', text: `Max clubs per student set to ${val}.`, timer: 1500, showConfirmButton: false });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' });
    }
    setMaxClubsSaving(false);
  }

  // ── Password ──
  async function handlePasswordSave(e) {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) { Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'All fields are required.' }); return; }
    if (newPw.length < 8) { Swal.fire({ icon: 'warning', title: 'Too short', text: 'Password must be at least 8 characters.' }); return; }
    if (newPw === currentPw) { Swal.fire({ icon: 'warning', title: 'Same Password', text: 'New password cannot be the same as current.' }); return; }
    if (newPw !== confirmPw) { Swal.fire({ icon: 'warning', title: 'Mismatch', text: 'Passwords do not match.' }); return; }
    setPwSaving(true);
    try {
      const res  = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw, new_password_confirmation: confirmPw }),
      });
      const data = await res.json();
      if (res.ok) { Swal.fire({ icon: 'success', title: 'Password Changed!', timer: 1500, showConfirmButton: false }); closePwModal(); }
      else { Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to change password.' }); }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
    setPwSaving(false);
  }

  function closePwModal() {
    setPwModal(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setShowCurrent(false); setShowNew(false); setShowConfirm(false);
  }

  const EyeIcon = ({ show }) => show ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  if (loading) return (
    <SuperAdminLayout title="Settings" subtitle="Application settings">
      <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>
    </SuperAdminLayout>
  );

  return (
    <SuperAdminLayout title="Settings" subtitle="Application settings">
      <div className="st-page">

        {/* ── ACCOUNT SETTINGS CARD ── */}
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-title">Account Settings</div>
            <div className="st-card-sub">Manage your profile and security</div>
          </div>
          <div className="st-profile-preview">
            <div className="st-avatar-wrap">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="st-avatar-img"/>
                : <div className="st-avatar-initials">{getInitials(user?.name)}</div>}
            </div>
            <div className="st-profile-info">
              <div className="st-profile-name">{user?.name || '—'}</div>
              <div className="st-profile-email">{user?.email || '—'}</div>
              <div className="st-profile-role">{user?.role?.replace('_', ' ').toUpperCase() || '—'}</div>
            </div>
          </div>
          <div className="st-divider"/>
          <div className="st-row" onClick={() => setPwModal(true)}>
            <div className="st-row-icon gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="st-row-info">
              <div className="st-row-title">Change Password</div>
              <div className="st-row-desc">Update your account password</div>
            </div>
            <svg className="st-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        {/* ── SYSTEM SETTINGS CARD ── */}
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-title">System Settings</div>
            <div className="st-card-sub">Control application-wide rules and limits</div>
          </div>
          <div className="st-row" onClick={openMaxClubsModal}>
            <div className="st-row-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="st-row-info">
              <div className="st-row-title">Max Clubs Per Student</div>
              <div className="st-row-desc">Currently set to <strong>{maxClubs}</strong> club{maxClubs !== 1 ? 's' : ''} per student</div>
            </div>
            <span style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 800, fontSize: 16, padding: '4px 14px', borderRadius: 20, border: '1.5px solid #bbf7d0', marginRight: 8 }}>{maxClubs}</span>
            <svg className="st-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

      </div>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {pwModal && createPortal(
        <div className="st-modal-backdrop" onClick={closePwModal}>
          <div className="st-modal" onClick={e => e.stopPropagation()}>
            <div className="st-modal-header">
              <span className="st-modal-title">Change Password</span>
              <button className="st-modal-close" onClick={closePwModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handlePasswordSave} className="st-modal-body">
              <div className="st-form-group">
                <label className="st-form-label">Current Password <span style={{color:'#ef4444'}}>*</span></label>
                <div className="st-pw-wrap">
                  <input className="st-form-input" type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password"/>
                  <button type="button" className="st-pw-eye" onClick={() => setShowCurrent(!showCurrent)}><EyeIcon show={showCurrent}/></button>
                </div>
              </div>
              <div className="st-form-group">
                <label className="st-form-label">New Password <span style={{color:'#ef4444'}}>*</span></label>
                <div className="st-pw-wrap">
                  <input className="st-form-input" type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters"/>
                  <button type="button" className="st-pw-eye" onClick={() => setShowNew(!showNew)}><EyeIcon show={showNew}/></button>
                </div>
                {newPw && newPw.length < 8 && <span style={{fontSize:12,color:'#ef4444'}}>❌ Min 8 characters</span>}
                {newPw && newPw.length >= 8 && newPw !== currentPw && <span style={{fontSize:12,color:'#16a34a'}}>✅ Good</span>}
              </div>
              <div className="st-form-group">
                <label className="st-form-label">Confirm New Password <span style={{color:'#ef4444'}}>*</span></label>
                <div className="st-pw-wrap">
                  <input className="st-form-input" type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password"/>
                  <button type="button" className="st-pw-eye" onClick={() => setShowConfirm(!showConfirm)}><EyeIcon show={showConfirm}/></button>
                </div>
                {confirmPw && newPw && confirmPw !== newPw && <span style={{fontSize:12,color:'#ef4444'}}>❌ Passwords do not match</span>}
                {confirmPw && newPw && confirmPw === newPw && newPw.length >= 8 && <span style={{fontSize:12,color:'#16a34a'}}>✅ Passwords match</span>}
              </div>
              <div className="st-modal-footer">
                <button type="button" className="st-btn-cancel" onClick={closePwModal}>Cancel</button>
                <button type="submit" className="st-btn-save" disabled={pwSaving}>{pwSaving ? 'Updating...' : 'Update Password'}</button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* ── MAX CLUBS MODAL ── */}
      {maxClubsModal && createPortal(
        <div className="st-modal-backdrop" onClick={() => setMaxClubsModal(false)}>
          <div className="st-modal" onClick={e => e.stopPropagation()} style={{maxWidth:400}}>
            <div className="st-modal-header">
              <span className="st-modal-title">Max Clubs Per Student</span>
              <button className="st-modal-close" onClick={() => setMaxClubsModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="st-modal-body">
              <div className="st-form-group">
                <label className="st-form-label">Maximum Clubs <span style={{color:'#ef4444'}}>*</span></label>
                <input className="st-form-input" type="number" min={1} max={10} value={maxClubsInput} onChange={e => setMaxClubsInput(e.target.value)} style={{ fontSize:20, fontWeight:700, textAlign:'center', height:52 }}/>
                <span style={{ fontSize:12, color:'#5a78a1' }}>Enter a value between 1 and 10</span>
              </div>
              <div className="st-modal-footer">
                <button className="st-btn-cancel" onClick={() => setMaxClubsModal(false)}>Cancel</button>
                <button className="st-btn-save" onClick={saveMaxClubs} disabled={maxClubsSaving}>{maxClubsSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

    </SuperAdminLayout>
  );
}