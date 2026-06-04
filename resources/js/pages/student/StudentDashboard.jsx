import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './components/StudentLayout';
import '../../styles/student/studentdashboard.css';
import '../../styles/student/studentannouncement.css';

const getToken = () => sessionStorage.getItem('token');

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function AnimatedNumber({ target, suffix = '' }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef();
  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const tick = (now) => {
      const prog = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setValue(Math.round(target * ease));
      if (prog < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return <>{value}{suffix}</>;
}

const TYPE_COLORS = {
  event:    { bg: '#dcfce7', color: '#15803d' },
  general:  { bg: '#dbeafe', color: '#1d4ed8' },
  reminder: { bg: '#fef9c3', color: '#a16207' },
};

function TypeBadge({ type }) {
  const t = (type || 'general').toLowerCase();
  const style = TYPE_COLORS[t] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span className="san-type-badge" style={{ background: style.bg, color: style.color }}>
      {t.toUpperCase()}
    </span>
  );
}

function PaperclipIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { clubId } = useParams();

  const [userName, setUserName]             = useState('');
  const [myClubs, setMyClubs]               = useState([]);
  const [currentClubIdx, setCurrentClubIdx] = useState(0);
  const [stats, setStats]                   = useState({ members: 0, announcements: 0, attendance: 0 });
  const [announcements, setAnnouncements]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [detail, setDetail]                 = useState(null);
  const scrollPosRef                        = useRef(0);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    fetchAll(token);
  }, []);

  useEffect(() => {
    if (myClubs.length === 0) return;
    const token = getToken();
    fetchClubData(token, myClubs[currentClubIdx]?.id, true);
  }, [currentClubIdx, myClubs]);

  useEffect(() => {
    if (myClubs.length === 0) return;
    const token = getToken();
    const interval = setInterval(() => {
      fetchClubData(token, myClubs[currentClubIdx]?.id, false);
    }, 2000);
    return () => clearInterval(interval);
  }, [currentClubIdx, myClubs]);

  // ── fetchAll — defined ONCE, clean ──
  const fetchAll = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [userRes, clubsRes] = await Promise.allSettled([
        axios.get('/api/user', { headers }),
        axios.get('/api/student/my-clubs', { headers }),
      ]);

      if (userRes.status === 'fulfilled') {
        const parts = (userRes.value.data.name || '').trim().split(' ');
        setUserName(parts[0] || 'Student');
      }

      if (clubsRes.status === 'fulfilled') {
        const clubs = clubsRes.value.data.clubs || [];
        setMyClubs(clubs);
        if (clubs.length > 0) {
          const targetIdx = clubId
            ? clubs.findIndex(c => String(c.id) === String(clubId))
            : 0;
          const startIdx = targetIdx >= 0 ? targetIdx : 0;
          setCurrentClubIdx(startIdx);
          fetchClubData(token, clubs[startIdx].id, true);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  // ── fetchClubData — defined ONCE, clean ──
  const fetchClubData = async (token, clubId, showLoading = false) => {
    if (!clubId) return;
    if (showLoading) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [annRes, membersRes, attRes] = await Promise.allSettled([
        axios.get(`/api/student/clubs/${clubId}/announcements`, { headers }),
        axios.get(`/api/student/clubs/${clubId}/members`, { headers }),
        axios.get(`/api/student/clubs/${clubId}/attendance`, { headers }),
      ]);

      const anns = annRes.status === 'fulfilled'
        ? (annRes.value.data.announcements || annRes.value.data.data || annRes.value.data || [])
        : [];

      const members = membersRes.status === 'fulfilled'
        ? (membersRes.value.data.members || membersRes.value.data || [])
        : [];

      const att = attRes.status === 'fulfilled'
        ? (attRes.value.data || {})
        : {};

      setAnnouncements(Array.isArray(anns) ? anns.slice(0, 5) : []);
      setStats({
        members:       Array.isArray(members) ? members.length : 0,
        announcements: Array.isArray(anns) ? anns.length : 0,
        attendance:    att.overall_pct || att.percentage || 0,
      });
    } catch {
      // silent
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  function openDetail(item) {
    scrollPosRef.current = window.scrollY || document.documentElement.scrollTop;
    setDetail(item);
    window.scrollTo(0, 0);
  }

  function handleBack() {
    setDetail(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosRef.current);
    });
  }

  const currentClub = myClubs[currentClubIdx];

  // ── DETAIL VIEW ──
  if (detail) {
    const hasAttachment = !!(detail.image || detail.attachment);
    const attachUrl     = detail.image || detail.attachment;

    return (
      <StudentLayout pageTitle="Dashboard" pageSubtitle="Welcome back to your dashboard">
        <button className="san-back-btn" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Dashboard
        </button>

        <div className="san-detail-card">
          <div className="san-detail-header">
            <div className="san-detail-header-left">
              <TypeBadge type={detail.type} />
              <h1 className="san-detail-title">{detail.title}</h1>
            </div>
            <span className="san-detail-date">
              {detail.date_sent || formatDate(detail.created_at)}
            </span>
          </div>

          {detail.posted_by && (
            <div className="san-detail-posted-by">Posted by {detail.posted_by}</div>
          )}

          <div className="san-detail-divider" />

          <div className="san-detail-body-wrap">
            <p className="san-detail-body">{detail.content || detail.description || ''}</p>
            {hasAttachment && (
              <a className="san-detail-attachment" href={attachUrl}
                 target="_blank" rel="noopener noreferrer">
                <PaperclipIcon size={15} />
                View Attachment
                <OpenIcon />
              </a>
            )}
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ── MAIN DASHBOARD ──
  return (
    <StudentLayout pageTitle="Dashboard" pageSubtitle="Welcome back to your dashboard">

      {/* Greeting */}
      <div className="sdb-greeting-row">
        <div>
          <h1 className="sdb-greeting-title">{getGreeting()}, {userName}</h1>
          <p className="sdb-greeting-sub">
            {currentClub
              ? `You're viewing your dashboard for ${currentClub.name}`
              : 'Welcome back to your dashboard'}
          </p>
        </div>
      </div>

      {/* No club joined */}
      {!loading && myClubs.length === 0 && (
        <div className="sdb-empty-clubs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <strong>You haven't joined any club yet</strong>
          <p>Go to My Club to browse and join clubs using an enrollment key.</p>
          <button className="sdb-join-now-btn" onClick={() => navigate('/student/StudentHome')}>
            Browse Clubs
          </button>
        </div>
      )}

      {/* Stats */}
      {myClubs.length > 0 && (
        <div className="sdb-stats-grid">
          <div className="sdb-stat-card" style={{ animationDelay: '0.05s' }}>
            <div className="sdb-stat-label">Total Members</div>
            <div className="sdb-stat-value">
              {loading ? '—' : <AnimatedNumber target={stats.members} />}
            </div>
          </div>
          <div className="sdb-stat-card" style={{ animationDelay: '0.10s' }}>
            <div className="sdb-stat-label">Announcements</div>
            <div className="sdb-stat-value">
              {loading ? '—' : <AnimatedNumber target={stats.announcements} />}
            </div>
          </div>
          <div className="sdb-stat-card" style={{ animationDelay: '0.15s' }}>
            <div className="sdb-stat-label">My Attendance</div>
            <div className="sdb-stat-value">
              {loading ? '—' : <AnimatedNumber target={stats.attendance} suffix="%" />}
            </div>
          </div>
        </div>
      )}

      {/* Announcements */}
      {myClubs.length > 0 && (
        <div className="sdb-section-card">
          <div className="sdb-section-header">
            <div className="sdb-section-header-left">
              <h2 className="sdb-section-title">Upcoming Announcements</h2>
            </div>
            <a className="sdb-view-all-link" href="/student/announcements"
               onClick={e => { e.preventDefault(); navigate('/student/announcements'); }}>
              View all
            </a>
          </div>

          {loading ? (
            <div className="sdb-loading-list">
              {[1, 2, 3].map(i => (
                <div className="sdb-skeleton-item" key={i}>
                  <div className="sdb-skeleton-body">
                    <div className="sdb-skeleton-line wide" />
                    <div className="sdb-skeleton-line" />
                    <div className="sdb-skeleton-line short" />
                  </div>
                  <div className="sdb-skeleton-thumb" />
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="sdb-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <strong>No announcements yet</strong>
              <p>Check back later for updates from {currentClub?.name}.</p>
            </div>
          ) : (
            <div className="sdb-announce-list">
              {announcements.map((ann, i) => (
                <div key={ann.id || i} className="sdb-announce-item"
                     style={{ animationDelay: `${i * 0.07}s` }}
                     onClick={() => openDetail(ann)}>
                  <div className="sdb-announce-body">
                    <div className="sdb-announce-title">{ann.title}</div>
                    <div className="sdb-announce-desc">{ann.content || ann.description || ''}</div>
                    <span className="sdb-announce-read-more">Read more →</span>
                  </div>
                  <div className="sdb-announce-meta">
                    {!ann.read && <div className="sdb-announce-unread" />}
                    <div className="sdb-announce-meta-spacer" />
                    <div className="sdb-announce-meta-bottom">
                      {ann.image && (
                        <img className="sdb-announce-thumb" src={ann.image} alt=""
                             onError={e => e.target.style.display = 'none'} />
                      )}
                      <span className="sdb-announce-date">
                        {ann.date_sent || formatDate(ann.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </StudentLayout>
  );
}