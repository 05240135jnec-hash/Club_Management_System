import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import '../../../styles/advisor/advisorlayout.css';

const NOTIFICATIONS = [
  {
    id: 1, title: 'Annual Tech Fest – Registration Open',
    preview: 'Registrations are now open. Deadline is 5 April.',
    content: 'We are excited to announce that registrations for the Annual Tech Fest are now officially open! This is a great opportunity for all members to showcase their skills in coding, robotics, and design. Please register before the deadline of 5th April.',
    type: 'event', recipient: 'Advisor',
    date: '28 Mar 2026', time: '09:30 AM', unread: true,
    sender: { name: 'Mr. Tobgay', role: 'Club Coordinator', initials: 'MT' }
  },
  {
    id: 2, title: 'Club Meeting Rescheduled to Friday',
    preview: 'The weekly club meeting has been moved to Friday at 3:00 PM.',
    content: 'Please be informed that due to a scheduling conflict, this week\'s club meeting has been rescheduled from Thursday to Friday at 3:00 PM. The venue remains Room 204, Block B. Attendance is compulsory for all executive committee members.',
    type: 'notice', recipient: 'Advisor',
    date: '25 Mar 2026', time: '11:15 AM', unread: true,
    sender: { name: 'Mr. Dorji', role: 'Club Secretary', initials: 'MD' }
  },
  {
    id: 3, title: 'New Member Joined the Club',
    preview: 'A new student has joined your club using the enrollment key.',
    content: 'A new student has successfully joined your club using the enrollment key. Please review the member list and assign them to appropriate sub-groups if needed.',
    type: 'general', recipient: 'Advisor',
    date: '20 Mar 2026', time: '02:45 PM', unread: false,
    sender: { name: 'System', role: 'Club Management System', initials: 'SY' }
  },
  {
    id: 4, title: 'Work Plan Submitted by Secretary',
    preview: 'The club secretary has submitted a new work plan for review.',
    content: 'The club secretary has submitted the semester work plan for your review and approval. Please review the uploaded document in the Work Plan section and provide your feedback.',
    type: 'result', recipient: 'Advisor',
    date: '15 Mar 2026', time: '10:00 AM', unread: false,
    sender: { name: 'Ms. Pema', role: 'Club Secretary', initials: 'MP' }
  }
];

const NOTIF_ICONS = {
  event:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  notice:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  result:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  general: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdvisorLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [notifOpen, setNotifOpen]           = useState(false);
  const [notifDetail, setNotifDetail]       = useState(null);
  const [notifications, setNotifications]   = useState(NOTIFICATIONS);
  const [settingsOpen, setSettingsOpen]     = useState(false);
  const [profileOpen, setProfileOpen]       = useState(false);
  const [profileMode, setProfileMode]       = useState('view'); // 'view' | 'edit'
  const [pendingPhoto, setPendingPhoto]     = useState(null);
  const [profile, setProfile] = useState({
    name:       localStorage.getItem('advisor_name')  || 'Club Advisor',
    email:      localStorage.getItem('advisor_email') || 'advisor@jnec.edu.bt',
    department: localStorage.getItem('advisor_dept')  || 'Computer Science & Engineering',
    photoUrl:   localStorage.getItem('advisor_photo') || null,
  });
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '' });

  const location = useLocation();
  const navigate = useNavigate();
  const avatarFileRef  = useRef();
  const settingsRef    = useRef();
  const notifRef       = useRef();

  const isActive = (path) => location.pathname === path;
  const unreadCount = notifications.filter(n => n.unread).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setSettingsOpen(false); setNotifOpen(false);
        setNotifDetail(null); setProfileOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ── Notifications ──
  function markAsRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  }
  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }
  function clearAll() { setNotifications([]); }
  function openDetail(notif) {
    markAsRead(notif.id);
    setNotifDetail(notif);
    setNotifOpen(false);
  }

  // ── Profile ──
  function openProfile() {
    setProfileMode('view');
    setPendingPhoto(null);
    setProfileOpen(true);
  }
  function openEdit() {
    setEditForm({ name: profile.name, email: profile.email, department: profile.department });
    setPendingPhoto(null);
    setProfileMode('edit');
  }
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPendingPhoto(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }
  function saveProfile() {
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.department.trim()) return;
    const updated = {
      ...profile,
      name:       editForm.name.trim(),
      email:      editForm.email.trim(),
      department: editForm.department.trim(),
      photoUrl:   pendingPhoto !== null ? pendingPhoto : profile.photoUrl,
    };
    setProfile(updated);
    localStorage.setItem('advisor_name',  updated.name);
    localStorage.setItem('advisor_email', updated.email);
    localStorage.setItem('advisor_dept',  updated.department);
    if (updated.photoUrl) localStorage.setItem('advisor_photo', updated.photoUrl);
    setPendingPhoto(null);
    setProfileMode('view');
  }

  const avatarDisplay = profile.photoUrl
    ? <img src={profile.photoUrl} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
    : getInitials(profile.name);

  const editAvatarDisplay = (pendingPhoto || profile.photoUrl)
    ? <img src={pendingPhoto || profile.photoUrl} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
    : getInitials(profile.name);

  return (
    <div className="advisor-layout">
      <div className="al-app-wrapper">

        {/* SIDEBAR OVERLAY */}
        {sidebarOpen && <div className="al-sidebar-overlay active" onClick={() => setSidebarOpen(false)} />}

        {/* SIDEBAR */}
        <aside className={`al-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="al-sidebar-brand">
            <div className="al-brand-avatar">
              <img src="/image/logo-removebg-preview.png" alt="JNEC Logo" />
            </div>
            <div className="al-brand-text">
              <span className="al-brand-name">JNEC Club<br />Management</span>
              <span className="al-brand-sub">Club Advisor Panel</span>
            </div>
          </div>

          <nav className="al-nav-group">
            <div className="al-nav-group-label">Main</div>
            <Link to="/advisor/club-dashboard" className={`al-nav-item ${isActive('/advisor/club-dashboard') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Dashboard
            </Link>
            <Link to="/advisor/club-details" className={`al-nav-item ${isActive('/advisor/club-details') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Club Details
            </Link>
            <Link to="/advisor/invite-coadvisor" className={`al-nav-item ${isActive('/advisor/invite-coadvisor') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="19" y2="13"/></svg>
              Invite Co-Adviser
            </Link>
            <Link to="/advisor/assign-secretary" className={`al-nav-item ${isActive('/advisor/assign-secretary') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
              Assign Secretary
            </Link>
            <Link to="/advisor/members" className={`al-nav-item ${isActive('/advisor/members') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Members
            </Link>
          </nav>

          <nav className="al-nav-group">
            <div className="al-nav-group-label">Content</div>
            <Link to="/advisor/announcements" className={`al-nav-item ${isActive('/advisor/announcements') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Announcements
            </Link>
            <Link to="/advisor/attendance" className={`al-nav-item ${isActive('/advisor/attendance') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Attendance
            </Link>
            <Link to="/advisor/enrollment-key" className={`al-nav-item ${isActive('/advisor/enrollment-key') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              Enrollment Key
            </Link>
          </nav>

          <nav className="al-nav-group">
            <div className="al-nav-group-label">Uploads</div>
            <Link to="/advisor/upload-reports" className={`al-nav-item ${isActive('/advisor/upload-reports') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Upload Reports
            </Link>
            <Link to="/advisor/work-plan" className={`al-nav-item ${isActive('/advisor/work-plan') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Upload Work Plan
            </Link>
            <Link to="/advisor/upload-image" className={`al-nav-item ${isActive('/advisor/upload-image') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Upload Image
            </Link>
            <Link to="/advisor/upload-blog" className={`al-nav-item ${isActive('/advisor/upload-blog') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Upload Blog
            </Link>
          </nav>

          <div className="al-nav-group al-logout-group">
            <button className="al-nav-item al-logout-btn" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log Out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="al-main-content">

          {/* TOPBAR */}
          <header className="al-topbar">
            <div className="al-topbar-left">
              <button className="al-hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <div className="al-topbar-title-wrap">
                <span className="al-topbar-title">{title || 'Dashboard'}</span>
                <span className="al-topbar-subtitle">{subtitle || 'Welcome back, Advisor'}</span>
              </div>
            </div>

            <div className="al-topbar-right">

              {/* HOME */}
              <button className="al-icon-btn" title="Dashboard" onClick={() => navigate('/advisor/dashboard')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </button>

              {/* SETTINGS */}
              <div className="al-dropdown-wrap" ref={settingsRef}>
                <button className={`al-icon-btn al-settings-btn ${settingsOpen ? 'open' : ''}`}
                  title="Settings" onClick={() => setSettingsOpen(o => !o)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
                {settingsOpen && (
                  <div className="al-dropdown">
                    <div className="al-dropdown-header">Account Settings</div>
                    <button className="al-dropdown-item" onClick={() => setSettingsOpen(false)}>
                      <div className="al-dditem-icon reset">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <div className="al-dditem-label">
                        <span>Reset Password</span>
                        <span>Update your credentials</span>
                      </div>
                    </button>
                    <button className="al-dropdown-item" onClick={() => setSettingsOpen(false)}>
                      <div className="al-dditem-icon deact">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      </div>
                      <div className="al-dditem-label">
                        <span>Deactivate Account</span>
                        <span>Disable this club account</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* NOTIFICATIONS */}
              <div className="al-dropdown-wrap" ref={notifRef}>
                <button className={`al-icon-btn al-notif-btn ${notifOpen ? 'open' : ''}`}
                  title="Notifications" onClick={() => setNotifOpen(o => !o)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && <span className="al-notif-badge">{unreadCount}</span>}
                </button>

                {notifOpen && (
                  <div className="al-notif-panel">
                    <div className="al-notif-header">
                      <span className="al-notif-title">Notifications</span>
                      <div className="al-notif-actions">
                        <span className="al-notif-pill">{unreadCount}</span>
                        <button className="al-notif-mark-all" onClick={markAllRead}>Mark all read</button>
                      </div>
                    </div>
                    <div className="al-notif-list">
                      {notifications.length === 0 ? (
                        <div className="al-notif-empty">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                          <p>No notifications yet.</p>
                        </div>
                      ) : notifications.map(n => (
                        <div key={n.id} className={`al-notif-item ${n.unread ? 'unread' : ''}`} onClick={() => markAsRead(n.id)}>
                          {n.unread && <div className="al-notif-dot" />}
                          <div className={`al-notif-icon type-${n.type}`}>{NOTIF_ICONS[n.type]}</div>
                          <div className="al-notif-body">
                            <div className="al-notif-item-title">{n.title}</div>
                            <div className="al-notif-item-preview">{n.preview}</div>
                            <div className="al-notif-item-footer">
                              <span className="al-notif-time">{n.date} · {n.time}</span>
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

              {/* PROFILE */}
              <button className="al-profile-btn" onClick={openProfile}>
                <div className="al-profile-avatar">{avatarDisplay}</div>
                <span className="al-profile-name">{profile.name.split(' ')[0]}</span>
              </button>

            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="al-page-body">{children}</main>
        </div>
      </div>

      {/* ── NOTIFICATION DETAIL MODAL ── */}
      {notifDetail && createPortal(
        <div className="al-modal-backdrop" onClick={() => setNotifDetail(null)}>
          <div className="al-notif-detail" onClick={e => e.stopPropagation()}>
            <div className="al-nd-header">
              <span className={`al-nd-badge ${notifDetail.type}`}>{notifDetail.type.charAt(0).toUpperCase() + notifDetail.type.slice(1)}</span>
              <button className="al-nd-close" onClick={() => setNotifDetail(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="al-nd-body">
              <h2 className="al-nd-title">{notifDetail.title}</h2>
              <div className="al-nd-meta">{notifDetail.date} · {notifDetail.time}</div>
              <div className="al-nd-divider" />
              <p className="al-nd-greeting">Hi {notifDetail.recipient},</p>
              <p className="al-nd-content">{notifDetail.content}</p>
              <div className="al-nd-sender">
                <div className="al-nd-sender-avatar">{notifDetail.sender.initials}</div>
                <div className="al-nd-sender-info">
                  <span className="al-nd-sender-label">From</span>
                  <span className="al-nd-sender-name">{notifDetail.sender.name}</span>
                  <span className="al-nd-sender-role">{notifDetail.sender.role}</span>
                </div>
              </div>
            </div>
            <div className="al-nd-footer">
              <button className="al-nd-close-btn" onClick={() => setNotifDetail(null)}>Close</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ── PROFILE MODAL ── */}
      {profileOpen && createPortal(
        <div className="al-modal-backdrop" onClick={() => setProfileOpen(false)}>
          <div className="al-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="al-pm-header">
              <span className="al-pm-title">Admin Profile</span>
              <button className="al-pm-close" onClick={() => setProfileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {profileMode === 'view' ? (
              <div className="al-pm-body">
                <div className="al-pm-avatar-wrap">
                  <div className="al-pm-avatar-ring">
                    <div className="al-pm-avatar-circle">{avatarDisplay}</div>
                  </div>
                  <div className="al-pm-online-dot" />
                </div>
                <h2 className="al-pm-name">{profile.name}</h2>
                <span className="al-pm-role">Club Advisor Panel</span>
                <div className="al-pm-info-grid">
                  <div className="al-pm-info-row">
                    <div className="al-pm-info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <div className="al-pm-info-content">
                      <span className="al-pm-info-label">Email</span>
                      <span className="al-pm-info-value">{profile.email}</span>
                    </div>
                  </div>
                  <div className="al-pm-info-row">
                    <div className="al-pm-info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <div className="al-pm-info-content">
                      <span className="al-pm-info-label">Department</span>
                      <span className="al-pm-info-value">{profile.department}</span>
                    </div>
                  </div>
                </div>
                <button className="al-pm-edit-btn" onClick={openEdit}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="al-pm-body">
                <div className="al-pm-avatar-wrap">
                  <div className="al-pm-avatar-ring">
                    <div className="al-pm-avatar-circle">{editAvatarDisplay}</div>
                  </div>
                  <button className="al-pm-camera-btn" onClick={() => avatarFileRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </button>
                  <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                </div>
                <p className="al-pm-photo-hint">Click the camera icon to change photo</p>
                <div className="al-pm-form">
                  <div className="al-pm-form-group">
                    <label className="al-pm-label">Full Name <span style={{color:'#e53e3e'}}>*</span></label>
                    <input className="al-pm-input" type="text" value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} maxLength={80} />
                  </div>
                  <div className="al-pm-form-group">
                    <label className="al-pm-label">Email <span style={{color:'#e53e3e'}}>*</span></label>
                    <input className="al-pm-input" type="email" value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} maxLength={120} />
                  </div>
                  <div className="al-pm-form-group">
                    <label className="al-pm-label">Department <span style={{color:'#e53e3e'}}>*</span></label>
                    <input className="al-pm-input" type="text" value={editForm.department} onChange={e => setEditForm(f => ({...f, department: e.target.value}))} maxLength={100} />
                  </div>
                  <div className="al-pm-form-actions">
                    <button className="al-pm-cancel" onClick={() => setProfileMode('view')}>Cancel</button>
                    <button className="al-pm-save" onClick={saveProfile}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      Save Changes
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