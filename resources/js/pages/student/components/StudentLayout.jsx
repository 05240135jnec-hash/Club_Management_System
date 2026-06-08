import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import '../../../styles/student/studentLayout.css';

const getToken = () => sessionStorage.getItem('token');

const NOTIF_ICONS = {
  announcement: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  work_plan:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
  general:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

function getInitials(name) {
  const parts = (name||'').trim().split(/\s+/);
  return parts.length===1 ? parts[0].slice(0,2).toUpperCase() : (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
}

function EyeIcon({ open }) {
  return open
    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

function MsgBox({ msg }) {
  if (!msg||!msg.text) return null;
  return (
    <div style={{ fontSize:12.5, fontWeight:600, padding:'8px 12px', borderRadius:8,
      background: msg.type==='success'?'#d1fae5':'#fef2f2',
      color:      msg.type==='success'?'#065f46':'#b91c1c',
      border:     `1px solid ${msg.type==='success'?'#6ee7b7':'#fca5a5'}`,
    }}>{msg.text}</div>
  );
}

export default function StudentLayout({ children, pageTitle, pageSubtitle }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(!!sessionStorage.getItem('token'));

  // ── Club ──
  const urlClubId = window.location.pathname.split('/').filter(Boolean).pop();
  const cachedId  = sessionStorage.getItem('currentClubId') || '';
  const [currentClubId, setCurrentClubId] = useState(/^\d+$/.test(urlClubId) ? urlClubId : cachedId);
  const [clubName, setClubName] = useState((/^\d+$/.test(urlClubId) && urlClubId === cachedId) ? (sessionStorage.getItem('currentClubName') || '') : '');
  const [blogEnabled, setBlogEnabled] = useState(false);

  // ── Profile ──
  const [profileOpen, setProfileOpen]     = useState(false);
  const [profileMode, setProfileMode]     = useState('view');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState({ text:'', type:'' });
  const [pendingPhoto, setPendingPhoto]   = useState(null);
  const [pendingFile, setPendingFile]     = useState(null);
  const [profile, setProfile]             = useState({ name:'', email:'', studentId:'', course:'', year:'', photoUrl:null });
  const [editForm, setEditForm]           = useState({ name:'', email:'', studentId:'', course:'', year:'' });

  // ── Reset Password ──
  const [pwdOpen, setPwdOpen]     = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg]       = useState({ text:'', type:'' });
  const [showPwd, setShowPwd]     = useState({ current:false, new:false, confirm:false });
  const [pwdForm, setPwdForm]     = useState({ current_password:'', new_password:'', new_password_confirmation:'' });

  // ── Notifications ──
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifDetail, setNotifDetail]     = useState(null);
  const [notifications, setNotifications] = useState([]);

  const avatarFileRef = useRef();
  const notifRef      = useRef();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Fetch profile ──
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', { headers:{ Authorization:`Bearer ${getToken()}` } });
      if (!res.ok) return;
      const { user:u } = await res.json();
      setProfile({ name:u.name||'', email:u.email||'', studentId:u.student_id||'', course:u.course||'', year:u.year||'', photoUrl:u.avatar||null });
    } catch {}
  };

  // ── Fetch notifications ──
  const fetchNotifications = async () => {
    try {
      const res  = await fetch('/api/notifications', { headers:{ Authorization:`Bearer ${getToken()}` } });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
  };

 useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.replace('/login');
      return;
    }
    setAuthChecked(true);
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => { window.location.replace('/login'); };

    axios.get('/api/student/my-clubs', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        const clubs = res.data.clubs || [];
        if (clubs.length > 0) {
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          const urlId     = pathParts[pathParts.length - 1];
          const matched   = clubs.find(c => String(c.id) === String(urlId)) || clubs[0];
          setClubName(matched.name);
          setCurrentClubId(String(matched.id));
          sessionStorage.setItem('currentClubName', matched.name);
          sessionStorage.setItem('currentClubId', String(matched.id));

          // ✅ Fetch blog_enabled for this club
          try {
            const blogRes = await axios.get(`/api/student/clubs/${matched.id}/blogs`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setBlogEnabled(!!blogRes.data.blog_enabled);
          } catch (_) { setBlogEnabled(false); }
        }
      }).catch(() => {});

    fetchProfile();
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [location.pathname]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') { setNotifOpen(false); setNotifDetail(null); setProfileOpen(false); setPwdOpen(false); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const handleLogout = async () => {
    try { await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${getToken()}` } }); } catch {}
    sessionStorage.clear(); navigate('/login');
  };

  // ── Notifications ──
  async function markAsRead(id) {
    setNotifications(p => p.map(n => n.id===id ? {...n,is_read:true} : n));
    try { await fetch(`/api/notifications/${id}/read`, { method:'PUT', headers:{ Authorization:`Bearer ${getToken()}` } }); } catch {}
  }
  async function markAllRead() {
    setNotifications(p => p.map(n => ({...n,is_read:true})));
    try { await fetch('/api/notifications/read-all', { method:'PUT', headers:{ Authorization:`Bearer ${getToken()}` } }); } catch {}
  }
  async function clearAll() {
    setNotifications([]);
    try { await fetch('/api/notifications', { method:'DELETE', headers:{ Authorization:`Bearer ${getToken()}` } }); } catch {}
  }
  function openDetail(n) { markAsRead(n.id); setNotifDetail(n); setNotifOpen(false); }

  // ── Profile ──
  function openProfile() { setProfileMode('view'); setPendingPhoto(null); setPendingFile(null); setProfileMsg({text:'',type:''}); setProfileOpen(true); }
  function openEdit()    { setEditForm({ name:profile.name, email:profile.email, studentId:profile.studentId, course:profile.course, year:profile.year }); setPendingPhoto(null); setPendingFile(null); setProfileMsg({text:'',type:''}); setProfileMode('edit'); }

  function handlePhotoChange(e) {
    const file = e.target.files[0]; if (!file) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPendingPhoto(ev.target.result);
    reader.readAsDataURL(file); e.target.value='';
  }

  async function saveProfile() {
    if (!editForm.name.trim()||!editForm.email.trim()) { setProfileMsg({text:'Name and email are required.',type:'error'}); return; }
    setProfileSaving(true); setProfileMsg({text:'',type:''});
    try {
      const fd = new FormData();
      fd.append('name',       editForm.name.trim());
      fd.append('email',      editForm.email.trim());
      fd.append('student_id', editForm.studentId.trim());
      fd.append('course',     editForm.course.trim());
      fd.append('year',       editForm.year.trim());
      if (pendingFile) fd.append('avatar', pendingFile);
      const res  = await fetch('/api/profile', { method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:fd });
      const data = await res.json();
      if (!res.ok) { setProfileMsg({text:data.message||'Failed to update.',type:'error'}); return; }
      const u = data.user;
      setProfile({ name:u.name, email:u.email, studentId:u.student_id||'', course:u.course||'', year:u.year||'', photoUrl:u.avatar||null });
      setPendingPhoto(null); setPendingFile(null);
      setProfileMsg({text:'Profile updated successfully!',type:'success'});
      setTimeout(() => { setProfileMode('view'); setProfileMsg({text:'',type:''}); }, 1200);
    } catch { setProfileMsg({text:'Could not connect to server.',type:'error'}); }
    finally  { setProfileSaving(false); }
  }

  // ── Reset Password ──
  function openPwd() { setPwdOpen(true); setPwdForm({current_password:'',new_password:'',new_password_confirmation:''}); setPwdMsg({text:'',type:''}); setShowPwd({current:false,new:false,confirm:false}); }

  async function savePwd() {
    if (!pwdForm.current_password)                                { setPwdMsg({text:'Enter your current password.',type:'error'}); return; }
    if (pwdForm.new_password.length<8)                            { setPwdMsg({text:'New password must be at least 8 characters.',type:'error'}); return; }
    if (pwdForm.new_password!==pwdForm.new_password_confirmation) { setPwdMsg({text:'Passwords do not match.',type:'error'}); return; }
    setPwdSaving(true); setPwdMsg({text:'',type:''});
    try {
      const res  = await fetch('/api/profile/password', { method:'PUT', headers:{ Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' }, body:JSON.stringify(pwdForm) });
      const data = await res.json();
      if (!res.ok) { setPwdMsg({text:data.message||'Failed to change password.',type:'error'}); return; }
      setPwdMsg({text:'Password changed successfully!',type:'success'});
      setTimeout(() => { setPwdOpen(false); setPwdMsg({text:'',type:''}); }, 1500);
    } catch { setPwdMsg({text:'Could not connect to server.',type:'error'}); }
    finally  { setPwdSaving(false); }
  }

  const avatarDisplay = (pendingPhoto || profile.photoUrl)
    ? <img src={pendingPhoto || profile.photoUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
    : getInitials(profile.name);

  const isActive = (path) => location.pathname.startsWith(path);

  const navItems = [
    { group:'Main', items:[
      { label:'Dashboard', path: currentClubId ? `/student/dashboard/${currentClubId}` : '/student/dashboard',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
    ]},
    { group:'Club Activity', items:[
      { label:'Announcements', path: currentClubId ? `/student/announcements/${currentClubId}` : '/student/announcements',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
      { label:'My Attendance', path: currentClubId ? `/student/attendance/${currentClubId}` : '/student/attendance',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg> },
      { label:'Certificate', path: currentClubId ? `/student/certificate/${currentClubId}` : '/student/certificate',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
    ]},
    { group:'Club Content', items:[
      { label:'Work Plan', path: currentClubId ? `/student/workplan/${currentClubId}` : '/student/workplan',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg> },
      { label:'Gallery', path: currentClubId ? `/student/gallery/${currentClubId}` : '/student/gallery',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
      ...(blogEnabled ? [{ label:'Club Blog', path: currentClubId ? `/student/blog/${currentClubId}` : '/student/blog',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> }] : []),
    ]},
  ];

  if (!authChecked) return null;

  return (
    <div className="sl-app-wrapper">
      <div className={`sl-sidebar-overlay${sidebarOpen?' active':''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sl-sidebar${sidebarOpen?' open':''}`}>
        <div className="sl-sidebar-brand">
          <div className="sl-brand-avatar"><img src="/image/logo-removebg-preview.png" alt="JNEC Logo" onError={e => e.target.style.display='none'} /></div>
          <div className="sl-brand-text">
            <span className="sl-brand-name">{clubName||'JNEC Club Management'}</span>
            <span className="sl-brand-sub">Student Panel</span>
          </div>
        </div>

        {navItems.map(group => (
          <nav className="sl-nav-group" key={group.group}>
            <div className="sl-nav-group-label">{group.group}</div>
            {group.items.map(item => (
              <a key={item.label} className={`sl-nav-item${isActive(item.path)?' active':''}`} href={item.path}
                onClick={e => { e.preventDefault(); navigate(item.path); setSidebarOpen(false); }}>
                {item.icon}{item.label}
              </a>
            ))}
          </nav>
        ))}

        <nav className="sl-nav-group">
          <div className="sl-nav-group-label">System</div>
          <a className={`sl-nav-item${isActive('/student/settings')?' active':''}`} href="/student/settings"
            onClick={e => { e.preventDefault(); navigate('/student/settings'); setSidebarOpen(false); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </a>
        </nav>

        <div className="sl-sidebar-bottom">
          <button className="sl-logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="sl-main-content">
        <header className="sl-topbar">
          <div className="sl-topbar-left">
            <button className="sl-hamburger" onClick={() => setSidebarOpen(v=>!v)} aria-label="Open menu">
              <span /><span /><span />
            </button>
            <div className="sl-topbar-titles">
              <span className="sl-topbar-title">{pageTitle||'Dashboard'}</span>
              <span className="sl-topbar-subtitle">{pageSubtitle||'Welcome back to your dashboard'}</span>
            </div>
          </div>

          <div className="sl-topbar-right">
            {/* My Clubs */}
            <a href="/student/StudentHome" className="sl-my-club-link"
              onClick={e => { e.preventDefault(); navigate('/student/StudentHome'); }}>
              <div className="sl-my-club-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span className="sl-my-club-label">My Clubs</span>
            </a>

            {/* Notifications */}
            <div className="sl-notif-wrap" ref={notifRef}>
              <button className={`sl-icon-btn ${notifOpen?'open':''}`} title="Notifications" onClick={() => setNotifOpen(o=>!o)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span className="sl-notif-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="sl-notif-panel">
                  <div className="sl-notif-header">
                    <span className="sl-notif-title">Notifications</span>
                    <div className="sl-notif-actions">
                      {unreadCount > 0 && <span className="sl-notif-pill">{unreadCount}</span>}
                      <button className="sl-notif-mark-all" onClick={markAllRead}>Mark all read</button>
                    </div>
                  </div>
                  <div className="sl-notif-list">
                    {notifications.length===0 ? (
                      <div className="sl-notif-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <p>No notifications yet.</p>
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`sl-notif-item ${!n.is_read?'unread':''}`} onClick={() => openDetail(n)}>
                        {!n.is_read && <div className="sl-notif-dot" />}
                        <div className="sl-notif-icon">{NOTIF_ICONS[n.type]||NOTIF_ICONS.general}</div>
                        <div className="sl-notif-body">
                          <div className="sl-notif-item-title">{n.title}</div>
                          <div className="sl-notif-item-preview">{n.message}</div>
                          <div className="sl-notif-item-footer">
                            <span className="sl-notif-time">{n.created_at}</span>
                            <button className="sl-notif-view" onClick={e => { e.stopPropagation(); openDetail(n); }}>View</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="sl-notif-footer">
                    <button className="sl-notif-clear" onClick={clearAll}>Clear all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <button className="sl-profile-btn" title="Profile" onClick={openProfile}>
              <div className="sl-profile-avatar">
                {profile.photoUrl
                  ? <img src={profile.photoUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                  : getInitials(profile.name)
                }
              </div>
              <span className="sl-profile-name">{(profile.name||'Student').split(' ')[0]}</span>
            </button>
          </div>
        </header>

        <div className="sl-page-body">{children}</div>
      </div>

      {/* NOTIFICATION DETAIL MODAL */}
      {notifDetail && createPortal(
        <div className="sl-modal-overlay" onClick={() => setNotifDetail(null)}>
          <div className="sl-modal-box" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-head">
              <span className="sl-modal-tag">{notifDetail.title}</span>
              <button className="sl-modal-x" onClick={() => setNotifDetail(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="sl-modal-body">
              <h2 className="sl-modal-title">{notifDetail.title}</h2>
              <div className="sl-modal-meta">{notifDetail.created_at}{notifDetail.club_name ? ` · ${notifDetail.club_name}` : ''}</div>
              <div className="sl-modal-divider" />
              <p className="sl-modal-content">{notifDetail.message}</p>
            </div>
            <div className="sl-modal-foot">
              <button className="sl-modal-close-btn" onClick={() => setNotifDetail(null)}>Close</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* PROFILE MODAL */}
      {profileOpen && createPortal(
        <div className="sl-modal-overlay" onClick={() => setProfileOpen(false)}>
          <div className="sl-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-head">
              <span style={{fontSize:15, fontWeight:700, color:'#1a1a2e'}}>Student Profile</span>
              <button className="sl-modal-x" onClick={() => setProfileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {profileMode==='view' ? (
              <div className="sl-pm-body">
                <div className="sl-pm-avatar-wrap">
                  <div className="sl-pm-avatar-ring">
                    <div className="sl-pm-avatar-circle">{avatarDisplay}</div>
                  </div>
                  <div className="sl-pm-online-dot" />
                </div>
                <h2 className="sl-pm-name">{profile.name||'—'}</h2>
                <span className="sl-pm-role-badge">Student</span>
                <div className="sl-pm-info-grid">
                  {[
                    { label:'Email',      value: profile.email,     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                    { label:'Student ID', value: profile.studentId, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
                    { label:'Course',     value: profile.course,    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                    { label:'Year',       value: profile.year,      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  ].map(({ label, value, icon }) => (
                    <div className="sl-pm-info-row" key={label}>
                      <div className="sl-pm-info-icon">{icon}</div>
                      <div className="sl-pm-info-content">
                        <span className="sl-pm-info-label">{label}</span>
                        <span className="sl-pm-info-value">{value||'—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="sl-pm-edit-btn" onClick={openEdit} style={{width:'100%'}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit Profile
                  </button>
              </div>
            ) : (
              <div className="sl-pm-body">
                <div className="sl-pm-avatar-wrap">
                  <div className="sl-pm-avatar-ring"><div className="sl-pm-avatar-circle">{avatarDisplay}</div></div>
                  <button className="sl-pm-camera-btn" onClick={() => avatarFileRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </button>
                  <input ref={avatarFileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange} />
                </div>
                <p className="sl-pm-photo-hint">Click the camera icon to change photo</p>
                <div className="sl-pm-form">
                  {[
                    { label:'Full Name',  key:'name',      type:'text',  required:true  },
                    { label:'Email',      key:'email',     type:'email', required:true, disabled:true  },
                    { label:'Student ID', key:'studentId', type:'text',  required:false },
                    { label:'Course',     key:'course',    type:'text',  required:false },
                    { label:'Year',       key:'year',      type:'text',  required:false },
                  ].map(({ label, key, type, required }) => (
                    <div className="sl-pm-form-group" key={key}>
                      <label className="sl-pm-label">{label} {required && <span style={{color:'#e53e3e'}}>*</span>}</label>
                      <input className="sl-pm-input" type={type} value={editForm[key]}
                        onChange={e => setEditForm(f=>({...f,[key]:e.target.value}))} maxLength={120}
                        disabled={required === false ? false : key === 'email' ? true : false}
                        style={key === 'email' ? { opacity: 0.6, cursor: 'not-allowed', background: '#f1f5f9' } : {}}
                      />
                    </div>
                  ))}
                  <MsgBox msg={profileMsg} />
                  <div className="sl-pm-form-actions">
                    <button className="sl-pm-cancel" onClick={() => setProfileMode('view')}>Cancel</button>
                    <button className="sl-pm-save" onClick={saveProfile} disabled={profileSaving}>
                      {profileSaving ? 'Saving...' : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Changes</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>, document.body
      )}

      {/* RESET PASSWORD MODAL */}
      {pwdOpen && createPortal(
        <div className="sl-modal-overlay" onClick={() => setPwdOpen(false)}>
          <div className="sl-profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
            <div className="sl-modal-head">
              <span style={{fontSize:15, fontWeight:700, color:'#1a1a2e'}}>Reset Password</span>
              <button className="sl-modal-x" onClick={() => setPwdOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="sl-pm-body">
              <div style={{width:64,height:64,borderRadius:'50%',background:'#eef1fd',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="2" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <p style={{fontSize:13,color:'#6b7280',marginBottom:20,textAlign:'center'}}>Enter your current password and choose a new one.</p>
              <div className="sl-pm-form" style={{width:'100%'}}>
                {[
                  {label:'Current Password', key:'current_password',          showKey:'current'},
                  {label:'New Password',     key:'new_password',              showKey:'new',     placeholder:'Min. 8 characters'},
                  {label:'Confirm Password', key:'new_password_confirmation', showKey:'confirm', placeholder:'Re-enter new password'},
                ].map(({label,key,showKey,placeholder}) => (
                  <div className="sl-pm-form-group" key={key}>
                    <label className="sl-pm-label">{label} <span style={{color:'#e53e3e'}}>*</span></label>
                    <div style={{position:'relative'}}>
                      <input className="sl-pm-input" type={showPwd[showKey]?'text':'password'} value={pwdForm[key]}
                        onChange={e => setPwdForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder||''} style={{paddingRight:40}} />
                      <button type="button" onClick={() => setShowPwd(s=>({...s,[showKey]:!s[showKey]}))}
                        style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:0}}>
                        <EyeIcon open={showPwd[showKey]} />
                      </button>
                    </div>
                  </div>
                ))}
                <MsgBox msg={pwdMsg} />
                <div className="sl-pm-form-actions">
                  <button className="sl-pm-cancel" onClick={() => setPwdOpen(false)}>Cancel</button>
                  <button className="sl-pm-save" onClick={savePwd} disabled={pwdSaving}>{pwdSaving?'Changing...':'Change Password'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

    </div>
  );
}