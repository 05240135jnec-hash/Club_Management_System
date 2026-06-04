import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import '../../../styles/superadmin/superadmin.css';

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

function SuperAdminLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  // const [authChecked, setAuthChecked] = useState(!!sessionStorage.getItem('token'));
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  // ── Notifications ──
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifDetail, setNotifDetail]     = useState(null);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Profile ──
  const [profileOpen, setProfileOpen]     = useState(false);
  const [profileMode, setProfileMode]     = useState('view');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState({ text:'', type:'' });
  const [pendingPhoto, setPendingPhoto]   = useState(null);
  const [pendingFile, setPendingFile]     = useState(null);
  const [profile, setProfile]             = useState({ name:'', email:'', photoUrl:null });
  const [editForm, setEditForm]           = useState({ name:'', email:'' });

  const avatarFileRef = useRef();
  const notifRef      = useRef();

  const isActive = (path) => location.pathname === path;
  const token    = () => sessionStorage.getItem('token');

  // ── Fetch profile ──
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', { headers:{ Authorization:`Bearer ${token()}` } });
      if (!res.ok) return;
      const { user:u } = await res.json();
      setProfile({ name:u.name||'Super Admin', email:u.email||'', photoUrl:u.avatar||null });
    } catch {}
  };

  // ── Fetch notifications ──
  const fetchNotifications = async () => {
    try {
      const res  = await fetch('/api/notifications', { headers:{ Authorization:`Bearer ${token()}` } });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
  };

  useEffect(() => {
    if (!sessionStorage.getItem('token')) {
      window.location.replace('/login');
      return;
    }
    window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
      window.location.replace('/login');
    };
    fetchProfile();
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') { setNotifOpen(false); setNotifDetail(null); setProfileOpen(false); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

    const handleLogoutConfirm = async () => {
      try {
          await fetch('/api/logout', { method:'POST', headers:{ Authorization:`Bearer ${token()}` } });
      } catch {}
      sessionStorage.clear();
      window.location.replace('/login')
    };

  // ── Notifications ──
  async function markAsRead(id) {
    setNotifications(p => p.map(n => n.id===id ? {...n,is_read:true} : n));
    try { await fetch(`/api/notifications/${id}/read`, { method:'PUT', headers:{ Authorization:`Bearer ${token()}` } }); } catch {}
  }
  async function markAllRead() {
    setNotifications(p => p.map(n => ({...n,is_read:true})));
    try { await fetch('/api/notifications/read-all', { method:'PUT', headers:{ Authorization:`Bearer ${token()}` } }); } catch {}
  }
  async function clearAll() {
    setNotifications([]);
    try { await fetch('/api/notifications', { method:'DELETE', headers:{ Authorization:`Bearer ${token()}` } }); } catch {}
  }
  function openDetail(n) { markAsRead(n.id); setNotifDetail(n); setNotifOpen(false); }

  // ── Profile ──
  function openProfile() { setProfileMode('view'); setPendingPhoto(null); setPendingFile(null); setProfileMsg({text:'',type:''}); setProfileOpen(true); }
  function openEdit()    { setEditForm({ name:profile.name, email:profile.email }); setPendingPhoto(null); setPendingFile(null); setProfileMsg({text:'',type:''}); setProfileMode('edit'); }

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
      fd.append('name', editForm.name.trim()); fd.append('email', editForm.email.trim());
      if (pendingFile) fd.append('avatar', pendingFile);
      const res  = await fetch('/api/profile', { method:'POST', headers:{ Authorization:`Bearer ${token()}` }, body:fd });
      const data = await res.json();
      if (!res.ok) { setProfileMsg({text:data.message||'Failed to update.',type:'error'}); return; }
      const u = data.user;
      setProfile({ name:u.name, email:u.email, photoUrl:u.avatar||null });
      setPendingPhoto(null); setPendingFile(null);
      setProfileMsg({text:'Profile updated successfully!',type:'success'});
      setTimeout(() => { setProfileMode('view'); setProfileMsg({text:'',type:''}); }, 1200);
    } catch { setProfileMsg({text:'Could not connect to server.',type:'error'}); }
    finally  { setProfileSaving(false); }
  }

  const avatarSrc = pendingPhoto || profile.photoUrl;
  const avatarDisplay = avatarSrc
    ? <img src={avatarSrc} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
    : getInitials(profile.name || 'SA');

  if (!sessionStorage.getItem('token')) {
    window.location.replace('/login');
    return null;
  }

  return (
    <div className="superadmin-page">
    <div className="app-wrapper">
      {sidebarOpen && <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <h3>Logging Out?</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-modal-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-logout-confirm" onClick={handleLogoutConfirm}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen?'open':''}`}>
        <div className="sidebar-brand">
          <div className="brand-avatar"><img src="/image/logo.png" alt="JNEC Logo" /></div>
          <div className="brand-text">
            <span className="brand-name">JNEC Club<br />Management</span>
            <span className="brand-sub">Super Admin Panel</span>
          </div>
        </div>

        <nav className="nav-group">
          <div className="nav-group-label">Overview</div>
          <Link to="/superadmin/dashboard" className={`nav-item ${isActive('/superadmin/dashboard')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Dashboard
          </Link>
          <Link to="/superadmin/feature-control" className={`nav-item ${isActive('/superadmin/feature-control')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>Feature Control
          </Link>
          <Link to="/superadmin/user-management" className={`nav-item ${isActive('/superadmin/user-management')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>User Management
          </Link>
        </nav>

        <nav className="nav-group">
          <div className="nav-group-label">Management</div>
          <Link to="/superadmin/attendance" className={`nav-item ${isActive('/superadmin/attendance')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Attendance
          </Link>
          <Link to="/superadmin/all-clubs" className={`nav-item ${isActive('/superadmin/all-clubs')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>All Clubs
          </Link>
          <Link to="/superadmin/reports" className={`nav-item ${isActive('/superadmin/reports')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>Reports
          </Link>
          <Link to="/superadmin/announcements" className={`nav-item ${isActive('/superadmin/announcements')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Announcements
          </Link>
          <Link to="/superadmin/certificate" className={`nav-item ${isActive('/superadmin/certificate')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>Certificate
          </Link>
        </nav>

        <nav className="nav-group">
          <div className="nav-group-label">System</div>
          <Link to="/superadmin/settings" className={`nav-item ${isActive('/superadmin/settings')?'active':''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="topbar-title-wrap">
              <span className="topbar-title">{title||'Dashboard'}</span>
              <span className="topbar-subtitle">{subtitle||'Club overview'}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Notifications */}
            <div style={{position:'relative'}} ref={notifRef}>
              <button className="icon-btn" title="Notifications" onClick={() => setNotifOpen(o=>!o)}
                style={{background: notifOpen?'#eef1fd':'', color: notifOpen?'#2d5be3':''}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span style={{background:'#e53e3e',color:'#fff',fontSize:9,fontWeight:800,minWidth:16,height:16,borderRadius:8,padding:'0 4px',display:'flex',alignItems:'center',justifyContent:'center',position:'absolute',top:4,right:4,border:'1.5px solid #fff'}}>{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div style={{position:'absolute',top:'calc(100% + 10px)',right:0,width:360,maxHeight:480,background:'#fff',borderRadius:16,boxShadow:'0 8px 40px rgba(0,0,0,0.14)',zIndex:9999,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                  <div style={{padding:'16px 20px 12px',borderBottom:'1px solid #e8eaf0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:13,fontWeight:800,letterSpacing:1.4,textTransform:'uppercase',color:'#1a2332'}}>Notifications</span>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      {unreadCount > 0 && <span style={{fontSize:11,fontWeight:700,background:'#1a2332',color:'#c9a84c',borderRadius:20,padding:'2px 9px'}}>{unreadCount}</span>}
                      <button onClick={markAllRead} style={{fontSize:11,fontWeight:600,color:'#2d5be3',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>Mark all read</button>
                    </div>
                  </div>
                  <div style={{overflowY:'auto',flex:1}}>
                    {notifications.length===0 ? (
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',gap:10,color:'#b0bac8'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <p style={{fontSize:13}}>No notifications yet.</p>
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} onClick={() => openDetail(n)}
                        style={{display:'flex',alignItems:'flex-start',gap:12,padding:'13px 18px',borderBottom:'1px solid #f0f2f5',position:'relative',cursor:'pointer',background:!n.is_read?'#f0f7ff':'#fff',transition:'background 0.15s'}}>
                        {!n.is_read && <div style={{position:'absolute',top:18,left:6,width:6,height:6,borderRadius:'50%',background:'#2d5be3'}} />}
                        <div style={{width:36,height:36,borderRadius:10,background:'#eef1fd',color:'#2d5be3',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:'#1a2332',marginBottom:2}}>{n.title}</div>
                          <div style={{fontSize:11.5,color:'#8892a4',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:5}}>{n.message}</div>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <span style={{fontSize:10.5,color:'#b0bac8'}}>{n.created_at}</span>
                            <button onClick={e=>{e.stopPropagation();openDetail(n);}} style={{fontSize:11,fontWeight:600,color:'#2d5be3',background:'#eef1fd',border:'none',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontFamily:'inherit'}}>View</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:'10px 18px',borderTop:'1px solid #e8eaf0',textAlign:'center'}}>
                    <button onClick={clearAll} style={{fontSize:12,fontWeight:600,color:'#94a3b8',cursor:'pointer',background:'none',border:'none',fontFamily:'inherit'}}>Clear all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <button className="profile-btn" title="Profile" onClick={openProfile}>
              <div className="profile-avatar" style={{overflow:'hidden'}}>
                {profile.photoUrl
                  ? <img src={profile.photoUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                  : getInitials(profile.name || 'SA')
                }
              </div>
              <span className="profile-name">{profile.name||'Super Admin'}</span>
            </button>
          </div>
        </header>

        <main className="page-body">{children}</main>
      </div>
    </div>

    {/* NOTIFICATION DETAIL MODAL */}
    {notifDetail && createPortal(
      <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={() => setNotifDetail(null)}>
        <div style={{background:'#fff',borderRadius:18,width:'min(480px,95vw)',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #f0f2f5'}}>
            <span style={{fontSize:12,fontWeight:700,background:'#eef1fd',color:'#2d5be3',borderRadius:20,padding:'3px 12px'}}>{notifDetail.title}</span>
            <button onClick={() => setNotifDetail(null)} style={{width:30,height:30,borderRadius:'50%',border:'none',background:'#f0f2f5',color:'#4a5568',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{padding:'24px 24px 18px'}}>
            <h2 style={{fontSize:17,fontWeight:800,color:'#1a2332',marginBottom:6}}>{notifDetail.title}</h2>
            <div style={{fontSize:11.5,color:'#b0bac8',marginBottom:18}}>{notifDetail.created_at}{notifDetail.club_name?` · ${notifDetail.club_name}`:''}</div>
            <div style={{height:1,background:'#e8eaf0',marginBottom:18}} />
            <p style={{fontSize:13.5,color:'#3d4a5c',lineHeight:1.75}}>{notifDetail.message}</p>
          </div>
          <div style={{padding:'0 24px 20px'}}>
            <button onClick={() => setNotifDetail(null)} style={{width:'100%',padding:10,fontSize:13,fontWeight:600,fontFamily:'inherit',background:'#f0f2f5',color:'#8892a4',border:'none',borderRadius:10,cursor:'pointer'}}>Close</button>
          </div>
        </div>
      </div>, document.body
    )}

    {/* PROFILE MODAL */}
    {profileOpen && createPortal(
      <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={() => setProfileOpen(false)}>
        <div style={{background:'#fff',borderRadius:18,width:'min(420px,95vw)',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',overflow:'hidden',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #f0f2f5'}}>
            <span style={{fontSize:15,fontWeight:700,color:'#1a2332'}}>Super Admin Profile</span>
            <button onClick={() => setProfileOpen(false)} style={{width:30,height:30,borderRadius:'50%',border:'none',background:'#f0f2f5',color:'#4a5568',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {profileMode==='view' ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 24px 28px',gap:12}}>
              <div style={{position:'relative'}}>
                <div style={{width:100,height:100,borderRadius:'50%',background:'linear-gradient(135deg,#1a2332,#2d5be3)',padding:3,boxShadow:'0 4px 20px rgba(45,91,227,0.3)'}}>
                  <div style={{width:'100%',height:'100%',borderRadius:'50%',background:'#1a2332',border:'3px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',fontSize:26,fontWeight:800,color:'#c9a84c'}}>
                    {profile.photoUrl ? <img src={profile.photoUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} /> : getInitials(profile.name||'SA')}
                  </div>
                </div>
                <div style={{position:'absolute',bottom:4,right:4,width:14,height:14,background:'#16a34a',borderRadius:'50%',border:'2.5px solid #fff'}} />
              </div>
              <h2 style={{fontSize:19,fontWeight:800,color:'#1a2332'}}>{profile.name||'Super Admin'}</h2>
              <span style={{fontSize:12,color:'#2d5be3',background:'#eef1fd',border:'1px solid #bfdbfe',borderRadius:20,padding:'3px 12px',fontWeight:600}}>Super Admin</span>
              <div style={{width:'100%',border:'1px solid #e8eaf0',borderRadius:12,overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px'}}>
                  <div style={{width:32,height:32,borderRadius:8,background:'#eef1fd',color:'#2d5be3',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:1}}>
                    <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',color:'#8892a4'}}>Email</span>
                    <span style={{fontSize:13,fontWeight:600,color:'#1a2332'}}>{profile.email||'—'}</span>
                  </div>
                </div>
              </div>
              {/* Edit Profile button — Reset Pwd removed */}
              <button onClick={openEdit} style={{width:'100%',display:'flex',alignItems:'center',gap:8,background:'#1a2332',color:'#c9a84c',fontSize:13,fontWeight:700,fontFamily:'inherit',border:'none',borderRadius:10,padding:'11px 20px',cursor:'pointer',justifyContent:'center'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 24px 28px',gap:12}}>
              <div style={{position:'relative'}}>
                <div style={{width:100,height:100,borderRadius:'50%',background:'linear-gradient(135deg,#1a2332,#2d5be3)',padding:3}}>
                  <div style={{width:'100%',height:'100%',borderRadius:'50%',background:'#1a2332',border:'3px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',fontSize:26,fontWeight:800,color:'#c9a84c'}}>
                    {avatarDisplay}
                  </div>
                </div>
                <button onClick={() => avatarFileRef.current?.click()} style={{position:'absolute',bottom:2,right:2,width:28,height:28,borderRadius:'50%',border:'2px solid #fff',background:'#2d5be3',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
                <input ref={avatarFileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange} />
              </div>
              <p style={{fontSize:11.5,color:'#8892a4',marginTop:-4}}>Click the camera icon to change photo</p>
              <div style={{width:'100%',display:'flex',flexDirection:'column',gap:12}}>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <label style={{fontSize:12.5,fontWeight:600,color:'#2d3748'}}>Full Name <span style={{color:'#e53e3e'}}>*</span></label>
                  <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}
                    style={{width:'100%',padding:'10px 14px',fontSize:13.5,fontFamily:'inherit',color:'#1a2332',background:'#f7f8fc',border:'1.5px solid #e0e4f0',borderRadius:8,outline:'none'}} />
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  <label style={{fontSize:12.5,fontWeight:600,color:'#2d3748'}}>Email <span style={{color:'#e53e3e'}}>*</span></label>
                  <input type="email" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}
                    style={{width:'100%',padding:'10px 14px',fontSize:13.5,fontFamily:'inherit',color:'#1a2332',background:'#f7f8fc',border:'1.5px solid #e0e4f0',borderRadius:8,outline:'none'}} />
                </div>
                <MsgBox msg={profileMsg} />
                <div style={{display:'flex',gap:10}}>
                  <button onClick={() => setProfileMode('view')} style={{flex:1,padding:10,fontSize:13,fontWeight:600,fontFamily:'inherit',background:'#f0f2f5',color:'#4a5568',border:'none',borderRadius:9,cursor:'pointer'}}>Cancel</button>
                  <button onClick={saveProfile} disabled={profileSaving} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:10,fontSize:13,fontWeight:700,fontFamily:'inherit',background:'#1a2332',color:'#c9a84c',border:'none',borderRadius:9,cursor:'pointer',opacity:profileSaving?0.6:1}}>
                    {profileSaving?'Saving...':'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>, document.body
    )}

    </div>
  );
}

export default SuperAdminLayout;