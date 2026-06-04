import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import '../../../styles/advisor/advisorlayout.css';

const NOTIF_ICONS = {
  announcement:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  report:              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  attendance_clash:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  member_joined:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="19" y2="13"/></svg>,
  secretary_assigned:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  work_plan:           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
  audit_feedback:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  co_advisor_accepted: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 17 21 12 16 7"/></svg>,
};

const NOTIF_COLORS = {
  announcement:        'type-event',
  report:              'type-result',
  attendance_clash:    'type-warn',
  member_joined:       'type-general',
  secretary_assigned:  'type-general',
  work_plan:           'type-result',
  audit_feedback:      'type-notice',
  co_advisor_accepted: 'type-event',
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

export default function AdvisorLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  // const [authChecked, setAuthChecked] = useState(!!sessionStorage.getItem('token'));
  const [clubName, setClubName]               = useState(null);
  const [notifOpen, setNotifOpen]             = useState(false);
  const [notifDetail, setNotifDetail]         = useState(null);
  const [notifications, setNotifications]     = useState([]);
  const [notifLoading, setNotifLoading]       = useState(false);
  const [settingsOpen, setSettingsOpen]       = useState(false);
  const [clubFeatures, setClubFeatures]       = useState({ blog_enabled:false, audit_report_enabled:false });
  const [profileOpen, setProfileOpen]         = useState(false);
  const [profileMode, setProfileMode]         = useState('view');
  const [profileSaving, setProfileSaving]     = useState(false);
  const [profileMsg, setProfileMsg]           = useState({ text:'', type:'' });
  const [pendingPhoto, setPendingPhoto]       = useState(null);
  const [pendingFile, setPendingFile]         = useState(null);
  const [profile, setProfile]                 = useState({ name:'', email:'', department:'', photoUrl:null });
  const [editForm, setEditForm]               = useState({ name:'', email:'', department:'' });
  const [pwdOpen, setPwdOpen]                 = useState(false);
  const [pwdSaving, setPwdSaving]             = useState(false);
  const [pwdMsg, setPwdMsg]                   = useState({ text:'', type:'' });
  const [showPwd, setShowPwd]                 = useState({ current:false, new:false, confirm:false });
  const [pwdForm, setPwdForm]                 = useState({ current_password:'', new_password:'', new_password_confirmation:'' });
  const [appointOpen, setAppointOpen]         = useState(false);
  const [appointLoading, setAppointLoading]   = useState(false);
  const [appointCoAdvisors, setAppointCoAdvisors] = useState([]);
  const [appointSelected, setAppointSelected] = useState(null);
  const [appointMsg, setAppointMsg]           = useState({ text:'', type:'' });
  const [appointStep, setAppointStep]         = useState(1);

  const location      = useLocation();
  const navigate      = useNavigate();
  const avatarFileRef = useRef();
  const settingsRef   = useRef();
  const notifRef      = useRef();

  const isActive    = (path) => location.pathname === path;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const userRole    = (() => { try { return JSON.parse(sessionStorage.getItem('user')||'{}').role||'advisor'; } catch { return 'advisor'; } })();
  const isCoAdvisor = userRole === 'co_advisor';
  const token       = () => sessionStorage.getItem('token');

  // ── Fetch notifications ──
  const fetchNotifications = async () => {
    try {
      const res  = await fetch('/api/notifications', { headers:{ Authorization:`Bearer ${token()}` } });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', { headers:{ Authorization:`Bearer ${token()}` } });
      if (!res.ok) return;
      const { user:u } = await res.json();
      setProfile({ name:u.name||'', email:u.email||'', department:u.department||'', photoUrl:u.avatar||null });
    } catch {}
  };

  useEffect(() => {
    if (!sessionStorage.getItem('token')) {
      window.location.replace('/login');
      return;
    }
    // setAuthChecked(true);
    // Push multiple states so back button has nowhere to go
    window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
      window.location.replace('/login');
    };
    async function fetchFeatures() {
      try {
        const res = await fetch('/api/clubs/my-club', { headers:{ Authorization:`Bearer ${token()}` } });
        if (res.ok) {
          const d = await res.json();
          if (d.name) { setClubName(d.name); sessionStorage.setItem('advisor_club_name', d.name); }
          setClubFeatures({ blog_enabled:d.blog_enabled??false, audit_report_enabled:d.audit_report_enabled??false });
        }
      } catch {}
    }
    const cached = sessionStorage.getItem('advisor_club_name');
    if (cached) setClubName(cached);
    fetchFeatures();
    fetchProfile();
    fetchNotifications();
    const iv = setInterval(() => { fetchFeatures(); fetchNotifications(); }, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') { setSettingsOpen(false); setNotifOpen(false); setNotifDetail(null); setProfileOpen(false); setPwdOpen(false); setAppointOpen(false); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const handleLogout = async () => {
    try { await fetch('/api/logout', { method:'POST', headers:{ Authorization:`Bearer ${token()}` } }); } catch {}
    sessionStorage.clear();
    // Clear ALL browser history entries by replacing with login
    window.history.go(-(window.history.length - 1));
    window.location.replace('/login');
  };

  // ── Notifications ──
  async function markAsRead(id) {
    setNotifications(p => p.map(n => n.id===id ? {...n, is_read:true} : n));
    try { await fetch(`/api/notifications/${id}/read`, { method:'PUT', headers:{ Authorization:`Bearer ${token()}` } }); } catch {}
  }

  async function markAllRead() {
    setNotifications(p => p.map(n => ({...n, is_read:true})));
    try { await fetch('/api/notifications/read-all', { method:'PUT', headers:{ Authorization:`Bearer ${token()}` } }); } catch {}
  }

  async function clearAll() {
    setNotifications([]);
    try { await fetch('/api/notifications', { method:'DELETE', headers:{ Authorization:`Bearer ${token()}` } }); } catch {}
  }

  function openDetail(notif) { markAsRead(notif.id); setNotifDetail(notif); setNotifOpen(false); }

  // ── Profile ──
  function openProfile() { setProfileMode('view'); setPendingPhoto(null); setPendingFile(null); setProfileMsg({text:'',type:''}); setProfileOpen(true); }
  function openEdit()    { setEditForm({ name:profile.name, email:profile.email, department:profile.department }); setPendingPhoto(null); setPendingFile(null); setProfileMsg({text:'',type:''}); setProfileMode('edit'); }

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
      fd.append('name', editForm.name.trim()); fd.append('email', editForm.email.trim()); fd.append('department', editForm.department.trim());
      if (pendingFile) fd.append('avatar', pendingFile);
      const res  = await fetch('/api/profile', { method:'POST', headers:{ Authorization:`Bearer ${token()}` }, body:fd });
      const data = await res.json();
      if (!res.ok) { setProfileMsg({text:data.message||'Failed to update.',type:'error'}); return; }
      const u = data.user;
      setProfile({ name:u.name, email:u.email, department:u.department||'', photoUrl:u.avatar||null });
      const stored = JSON.parse(sessionStorage.getItem('user')||'{}');
      sessionStorage.setItem('user', JSON.stringify({...stored, name:u.name, email:u.email}));
      setPendingPhoto(null); setPendingFile(null);
      setProfileMsg({text:'Profile updated successfully!',type:'success'});
      setTimeout(() => { setProfileMode('view'); setProfileMsg({text:'',type:''}); }, 1200);
    } catch { setProfileMsg({text:'Could not connect to server.',type:'error'}); }
    finally  { setProfileSaving(false); }
  }

  // ── Reset Password ──
  function openPwd() { setPwdOpen(true); setSettingsOpen(false); setPwdForm({current_password:'',new_password:'',new_password_confirmation:''}); setPwdMsg({text:'',type:''}); setShowPwd({current:false,new:false,confirm:false}); }

  async function savePwd() {
    if (!pwdForm.current_password)                                { setPwdMsg({text:'Enter your current password.',type:'error'}); return; }
    if (pwdForm.new_password.length<8)                            { setPwdMsg({text:'New password must be at least 8 characters.',type:'error'}); return; }
    if (pwdForm.new_password!==pwdForm.new_password_confirmation) { setPwdMsg({text:'Passwords do not match.',type:'error'}); return; }
    setPwdSaving(true); setPwdMsg({text:'',type:''});
    try {
      const res  = await fetch('/api/profile/password', { method:'PUT', headers:{ Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' }, body:JSON.stringify(pwdForm) });
      const data = await res.json();
      if (!res.ok) { setPwdMsg({text:data.message||'Failed to change password.',type:'error'}); return; }
      setPwdMsg({text:'Password changed successfully!',type:'success'});
      setTimeout(() => { setPwdOpen(false); setPwdMsg({text:'',type:''}); }, 1500);
    } catch { setPwdMsg({text:'Could not connect to server.',type:'error'}); }
    finally  { setPwdSaving(false); }
  }

  // ── Appoint New Advisor ──
  async function openAppoint() {
    setSettingsOpen(false); setAppointStep(1); setAppointSelected(null); setAppointMsg({text:'',type:''}); setAppointLoading(true); setAppointOpen(true);
    try {
      const res  = await fetch('/api/club/co-advisors', { headers:{ Authorization:`Bearer ${token()}` } });
      const data = await res.json();
      setAppointCoAdvisors(data.co_advisors || []);
    } catch { setAppointMsg({text:'Failed to load co-advisors.',type:'error'}); }
    finally  { setAppointLoading(false); }
  }

  async function confirmAppoint() {
    if (!appointSelected) return;
    setAppointLoading(true); setAppointMsg({text:'',type:''});
    try {
      const res  = await fetch('/api/club/appoint-advisor', { method:'POST', headers:{ Authorization:`Bearer ${token()}`, 'Content-Type':'application/json' }, body:JSON.stringify({ co_advisor_user_id: appointSelected.user_id }) });
      const data = await res.json();
      if (!res.ok) { setAppointMsg({text:data.message,type:'error'}); return; }
      sessionStorage.clear(); navigate('/login');
    } catch { setAppointMsg({text:'Something went wrong.',type:'error'}); }
    finally  { setAppointLoading(false); }
  }

  const avatarDisplay = profile.photoUrl
    ? <img src={profile.photoUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
    : getInitials(profile.name);

  const editAvatarSrc = pendingPhoto || profile.photoUrl;
  const editAvatar = editAvatarSrc
    ? <img src={editAvatarSrc} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
    : getInitials(editForm.name||profile.name);

  if (!sessionStorage.getItem('token')) {
    window.location.replace('/login');
    return null;
  }

  return (
    <div className="advisor-layout">
      <div className="al-app-wrapper">
        {sidebarOpen && <div className="al-sidebar-overlay active" onClick={() => setSidebarOpen(false)} />}

        <aside className={`al-sidebar ${sidebarOpen?'open':''}`}>
          <div className="al-sidebar-brand">
            <div className="al-brand-avatar"><img src="/image/logo-removebg-preview.png" alt="JNEC Logo" /></div>
            <div className="al-brand-text">
              {clubName ? <span className="al-brand-name">{clubName}</span> : <span className="al-brand-name-skeleton" />}
              <span className="al-brand-sub">{isCoAdvisor?'Co-Advisor Panel':'Club Advisor Panel'}</span>
            </div>
          </div>

          <div className="al-sidebar-nav-scroll">
            <nav className="al-nav-group">
              <div className="al-nav-group-label">Main</div>
              <Link to="/advisor/club-dashboard" className={`al-nav-item ${isActive('/advisor/club-dashboard')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Dashboard
              </Link>
              <Link to="/advisor/club-details" className={`al-nav-item ${isActive('/advisor/club-details')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Club Details
              </Link>
              {!isCoAdvisor && (
                <Link to="/advisor/invite-coadvisor" className={`al-nav-item ${isActive('/advisor/invite-coadvisor')?'active':''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="19" y2="13"/></svg>Add Co-Advisor
                </Link>
              )}
              <Link to="/advisor/assign-secretary" className={`al-nav-item ${isActive('/advisor/assign-secretary')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>Assign Secretary
              </Link>
              <Link to="/advisor/members" className={`al-nav-item ${isActive('/advisor/members')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Members
              </Link>
            </nav>

            <nav className="al-nav-group">
              <div className="al-nav-group-label">Content</div>
              <Link to="/advisor/announcements" className={`al-nav-item ${isActive('/advisor/announcements')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Announcements
              </Link>
              <Link to="/advisor/attendance" className={`al-nav-item ${isActive('/advisor/attendance')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Attendance
              </Link>
              <Link to="/advisor/enrollment-key" className={`al-nav-item ${isActive('/advisor/enrollment-key')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>Enrollment Key
              </Link>
            </nav>

            <nav className="al-nav-group">
              <div className="al-nav-group-label">Uploads</div>
              <Link to="/advisor/upload-reports" className={`al-nav-item ${isActive('/advisor/upload-reports')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>Upload Reports
              </Link>
              <Link to="/advisor/work-plan" className={`al-nav-item ${isActive('/advisor/work-plan')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>Upload Work Plan
              </Link>
              <Link to="/advisor/upload-image" className={`al-nav-item ${isActive('/advisor/upload-image')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Upload Image
              </Link>
              {clubFeatures.blog_enabled && (
                <Link to="/advisor/upload-blog" className={`al-nav-item ${isActive('/advisor/upload-blog')?'active':''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Upload Blog
                </Link>
              )}
            </nav>

            <nav className="al-nav-group">
              <div className="al-nav-group-label">System</div>
              <Link to="/advisor/settings" className={`al-nav-item ${isActive('/advisor/settings')?'active':''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </Link>
            </nav>

            <div className="al-nav-group al-logout-group">
              <button className="al-nav-item al-logout-btn" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Log Out
              </button>
            </div>
          </div>
        </aside>

        <div className="al-main-content">
          <header className="al-topbar">
            <div className="al-topbar-left">
              <button className="al-hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="al-topbar-title-wrap">
                <span className="al-topbar-title">{title||'Dashboard'}</span>
                <span className="al-topbar-subtitle">{subtitle||(isCoAdvisor?'Welcome back, Co-Advisor':'Welcome back, Advisor')}</span>
              </div>
            </div>

            <div className="al-topbar-right">
              <button className="al-clubs-btn" onClick={() => navigate('/advisor/dashboard')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Clubs
              </button>


              <div className="al-dropdown-wrap" ref={notifRef}>
                <button className={`al-icon-btn al-notif-btn ${notifOpen?'open':''}`} title="Notifications" onClick={() => setNotifOpen(o=>!o)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {unreadCount > 0 && <span className="al-notif-badge">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="al-notif-panel">
                    <div className="al-notif-header">
                      <span className="al-notif-title">Notifications</span>
                      <div className="al-notif-actions">
                        {unreadCount > 0 && <span className="al-notif-pill">{unreadCount}</span>}
                        <button className="al-notif-mark-all" onClick={markAllRead}>Mark all read</button>
                      </div>
                    </div>
                    <div className="al-notif-list">
                      {notifications.length===0 ? (
                        <div className="al-notif-empty">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                          <p>No notifications yet.</p>
                        </div>
                      ) : notifications.map(n => (
                        <div key={n.id} className={`al-notif-item ${!n.is_read?'unread':''}`} onClick={() => openDetail(n)}>
                          {!n.is_read && <div className="al-notif-dot" />}
                          <div className={`al-notif-icon ${NOTIF_COLORS[n.type]||'type-general'}`}>{NOTIF_ICONS[n.type]||NOTIF_ICONS.member_joined}</div>
                          <div className="al-notif-body">
                            <div className="al-notif-item-title">{n.title}</div>
                            <div className="al-notif-item-preview">{n.message}</div>
                            <div className="al-notif-item-footer">
                              <span className="al-notif-time">{n.created_at}</span>
                              <button className="al-notif-view" onClick={e => { e.stopPropagation(); openDetail(n); }}>View</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="al-notif-footer">
                      <button className="al-notif-clear" onClick={clearAll}>Clear all notifications</button>
                    </div>
                  </div>
                )}
              </div>

              <button className="al-profile-btn" onClick={openProfile}>
                <div className="al-profile-avatar">
                  {profile.photoUrl ? <img src={profile.photoUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} /> : getInitials(profile.name)}
                </div>
                <span className="al-profile-name">{(profile.name||'Advisor').split(' ')[0]}</span>
              </button>
            </div>
          </header>
          <main className="al-page-body">{children}</main>
        </div>
      </div>

      {/* NOTIFICATION DETAIL MODAL */}
      {notifDetail && createPortal(
        <div className="al-modal-backdrop" onClick={() => setNotifDetail(null)}>
          <div className="al-notif-detail" onClick={e => e.stopPropagation()}>
            <div className="al-nd-header">
              <span className={`al-nd-badge ${NOTIF_COLORS[notifDetail.type]||'type-general'}`}>{notifDetail.title}</span>
              <button className="al-nd-close" onClick={() => setNotifDetail(null)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="al-nd-body">
              <h2 className="al-nd-title">{notifDetail.title}</h2>
              <div className="al-nd-meta">{notifDetail.created_at}{notifDetail.club_name ? ` · ${notifDetail.club_name}` : ''}</div>
              <div className="al-nd-divider" />
              <p className="al-nd-content">{notifDetail.message}</p>
            </div>
            <div className="al-nd-footer"><button className="al-nd-close-btn" onClick={() => setNotifDetail(null)}>Close</button></div>
          </div>
        </div>, document.body
      )}

      {/* PROFILE MODAL */}
      {profileOpen && createPortal(
        <div className="al-modal-backdrop" onClick={() => setProfileOpen(false)}>
          <div className="al-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="al-pm-header">
              <span className="al-pm-title">{isCoAdvisor?'Co-Advisor Profile':'Advisor Profile'}</span>
              <button className="al-pm-close" onClick={() => setProfileOpen(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            {profileMode==='view' ? (
              <div className="al-pm-body">
                <div className="al-pm-avatar-wrap">
                  <div className="al-pm-avatar-ring"><div className="al-pm-avatar-circle">{avatarDisplay}</div></div>
                  <div className="al-pm-online-dot" />
                </div>
                <h2 className="al-pm-name">{profile.name||'—'}</h2>
                <span className="al-pm-role">{isCoAdvisor?'Co-Advisor Panel':'Club Advisor Panel'}</span>
                <div className="al-pm-info-grid">
                  <div className="al-pm-info-row">
                    <div className="al-pm-info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                    <div className="al-pm-info-content"><span className="al-pm-info-label">Email</span><span className="al-pm-info-value">{profile.email||'—'}</span></div>
                  </div>
                  <div className="al-pm-info-row">
                    <div className="al-pm-info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                    <div className="al-pm-info-content"><span className="al-pm-info-label">Department</span><span className="al-pm-info-value">{profile.department||'—'}</span></div>
                  </div>
                </div>
                <button className="al-pm-edit-btn" onClick={openEdit}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit Profile
                </button>
              </div>
            ) : (
              <div className="al-pm-body">
                <div className="al-pm-avatar-wrap">
                  <div className="al-pm-avatar-ring"><div className="al-pm-avatar-circle">{editAvatar}</div></div>
                  <button className="al-pm-camera-btn" onClick={() => avatarFileRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </button>
                  <input ref={avatarFileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange} />
                </div>
                <p className="al-pm-photo-hint">Click the camera icon to change photo</p>
                <div className="al-pm-form">
                  <div className="al-pm-form-group"><label className="al-pm-label">Full Name <span style={{color:'#e53e3e'}}>*</span></label><input className="al-pm-input" type="text" value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} maxLength={80} /></div>
                  <div className="al-pm-form-group"><label className="al-pm-label">Email <span style={{color:'#e53e3e'}}>*</span></label><input className="al-pm-input" type="email" value={editForm.email} onChange={e => setEditForm(f=>({...f,email:e.target.value}))} maxLength={120} /></div>
                  <div className="al-pm-form-group"><label className="al-pm-label">Department</label><input className="al-pm-input" type="text" value={editForm.department} onChange={e => setEditForm(f=>({...f,department:e.target.value}))} maxLength={100} /></div>
                  <MsgBox msg={profileMsg} />
                  <div className="al-pm-form-actions">
                    <button className="al-pm-cancel" onClick={() => setProfileMode('view')}>Cancel</button>
                    <button className="al-pm-save" onClick={saveProfile} disabled={profileSaving}>{profileSaving?'Saving...':<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Changes</>}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>, document.body
      )}

      {/* RESET PASSWORD MODAL */}
      {pwdOpen && createPortal(
        <div className="al-modal-backdrop" onClick={() => setPwdOpen(false)}>
          <div className="al-profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
            <div className="al-pm-header">
              <span className="al-pm-title">Reset Password</span>
              <button className="al-pm-close" onClick={() => setPwdOpen(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="al-pm-body">
              <div style={{width:64,height:64,borderRadius:'50%',background:'#eef1fd',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="2" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <p style={{fontSize:13,color:'#6b7280',marginBottom:20,textAlign:'center'}}>Enter your current password and choose a new one.</p>
              <div className="al-pm-form" style={{width:'100%'}}>
                {[{label:'Current Password',key:'current_password',showKey:'current'},{label:'New Password',key:'new_password',showKey:'new',placeholder:'Min. 8 characters'},{label:'Confirm Password',key:'new_password_confirmation',showKey:'confirm',placeholder:'Re-enter new password'}].map(({label,key,showKey,placeholder}) => (
                  <div className="al-pm-form-group" key={key}>
                    <label className="al-pm-label">{label} <span style={{color:'#e53e3e'}}>*</span></label>
                    <div style={{position:'relative'}}>
                      <input className="al-pm-input" type={showPwd[showKey]?'text':'password'} value={pwdForm[key]} onChange={e => setPwdForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder||''} style={{paddingRight:40}} />
                      <button type="button" onClick={() => setShowPwd(s=>({...s,[showKey]:!s[showKey]}))} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:0}}><EyeIcon open={showPwd[showKey]} /></button>
                    </div>
                  </div>
                ))}
                <MsgBox msg={pwdMsg} />
                <div className="al-pm-form-actions">
                  <button className="al-pm-cancel" onClick={() => setPwdOpen(false)}>Cancel</button>
                  <button className="al-pm-save" onClick={savePwd} disabled={pwdSaving}>{pwdSaving?'Changing...':'Change Password'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* APPOINT NEW ADVISOR MODAL */}
      {appointOpen && createPortal(
        <div className="al-modal-backdrop" onClick={() => setAppointOpen(false)}>
          <div className="al-profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:460}}>
            <div className="al-pm-header">
              <span className="al-pm-title">Appoint New Advisor</span>
              <button className="al-pm-close" onClick={() => setAppointOpen(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="al-pm-body" style={{gap:14}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'#fef3c7',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" width="28" height="28"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              {appointStep===1 ? (
                <>
                  <p style={{fontSize:13.5,fontWeight:600,color:'#1a1a2e',textAlign:'center'}}>Select a co-advisor to become the new main advisor</p>
                  <p style={{fontSize:12.5,color:'#6b7280',textAlign:'center',marginTop:-6}}>After appointing, you will automatically leave the club.</p>
                  {appointLoading ? (
                    <p style={{fontSize:13,color:'#6b7280',textAlign:'center',padding:'20px 0'}}>Loading co-advisors...</p>
                  ) : appointCoAdvisors.length===0 ? (
                    <div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,padding:'14px 16px',fontSize:13,color:'#b91c1c',fontWeight:600,textAlign:'center',width:'100%'}}>
                      ⚠️ You have no co-advisors yet. Please invite a co-advisor before appointing a new advisor.
                    </div>
                  ) : (
                    <div style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
                      {appointCoAdvisors.map(ca => (
                        <div key={ca.user_id} onClick={() => setAppointSelected(ca)}
                          style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderRadius:12,border:`2px solid ${appointSelected?.user_id===ca.user_id?'#2d5be3':'#e8eaf0'}`,background:appointSelected?.user_id===ca.user_id?'#eef4ff':'#fff',cursor:'pointer',transition:'all 0.18s'}}>
                          <div style={{width:40,height:40,borderRadius:'50%',background:'#d1fae5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#065f46',flexShrink:0}}>
                            {(ca.name||'').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{ca.name}</div>
                            <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{ca.email}</div>
                          </div>
                          {appointSelected?.user_id===ca.user_id && <svg viewBox="0 0 24 24" fill="none" stroke="#2d5be3" strokeWidth="3" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      ))}
                    </div>
                  )}
                  <MsgBox msg={appointMsg} />
                  <div className="al-pm-form-actions" style={{marginTop:4,width:'100%'}}>
                    <button className="al-pm-cancel" onClick={() => setAppointOpen(false)}>Cancel</button>
                    <button className="al-pm-save" onClick={() => { if (appointSelected) setAppointStep(2); }} disabled={!appointSelected||appointCoAdvisors.length===0} style={{background:appointSelected?'#1a2332':'#e2e8f0',color:appointSelected?'#c9a84c':'#9ca3af'}}>Next →</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{fontSize:13.5,fontWeight:700,color:'#1a1a2e',textAlign:'center'}}>Are you sure you want to appoint</p>
                  <div style={{background:'#f0f7ff',border:'1px solid #bfdbfe',borderRadius:10,padding:'14px 18px',textAlign:'center',width:'100%'}}>
                    <div style={{fontSize:15,fontWeight:800,color:'#1a1a2e'}}>{appointSelected?.name}</div>
                    <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>{appointSelected?.email}</div>
                  </div>
                  <div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,padding:'12px 16px',fontSize:12.5,color:'#b91c1c',fontWeight:600,lineHeight:1.6,width:'100%'}}>
                    ⚠️ <strong>Warning:</strong> Once you appoint them as the new advisor, you will permanently leave this club and lose all advisor access. This cannot be undone.
                  </div>
                  <MsgBox msg={appointMsg} />
                  <div className="al-pm-form-actions" style={{marginTop:4,width:'100%'}}>
                    <button className="al-pm-cancel" onClick={() => setAppointStep(1)}>← Back</button>
                    <button onClick={confirmAppoint} disabled={appointLoading} style={{flex:2,padding:'10px 16px',fontSize:13,fontWeight:700,fontFamily:'inherit',background:'#dc2626',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',opacity:appointLoading?0.6:1}}>
                      {appointLoading?'Appointing...':'Yes, Appoint & Leave'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}