import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './components/StudentLayout';
import '../../styles/student/studentannouncement.css';

const getToken = () => sessionStorage.getItem('token');

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByMonth(list) {
  const groups = {};
  list.forEach(a => {
    const d = new Date(a.created_at || a.date_sent);
    const key = isNaN(d) ? 'Other' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });
  return groups;
}

function AnimatedNumber({ target }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const tick = (now) => {
      const prog = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setValue(Math.round(target * ease));
      if (prog < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <>{value}</>;
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

export default function StudentAnnouncements() {
  const navigate = useNavigate();
  const { clubId } = useParams();

  const [myClubs, setMyClubs]               = useState([]);
  const [currentClubIdx, setCurrentClubIdx] = useState(0);
  const [announcements, setAnnouncements]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeFilter, setActiveFilter]     = useState('all');
  const [search, setSearch]                 = useState('');
  const [detail, setDetail]                 = useState(null);
  const scrollPosRef                        = useRef(0);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    fetchClubs(token);
  }, []);

  useEffect(() => {
    if (myClubs.length === 0) return;
    fetchAnnouncements(myClubs[currentClubIdx]?.id);
  }, [currentClubIdx, myClubs]);

  const fetchClubs = async (token) => {
    try {
      const res = await axios.get('/api/student/my-clubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clubs = res.data.clubs || [];
      setMyClubs(clubs);
      if (clubs.length > 0) {
        const targetIdx = clubId
          ? clubs.findIndex(c => String(c.id) === String(clubId))
          : 0;
        const startIdx = targetIdx >= 0 ? targetIdx : 0;
        setCurrentClubIdx(startIdx);
        fetchAnnouncements(clubs[startIdx].id);
      } else {
        setLoading(false);
      }
    } catch { setLoading(false); }
  };

  const fetchAnnouncements = async (clubId) => {
    if (!clubId) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`/api/student/clubs/${clubId}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const raw = res.data.announcements || res.data || [];
      // Merge with locally stored read IDs so read status persists after logout
      const readIds = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
      setAnnouncements(raw.map(a => ({ ...a, read: a.read || readIds.includes(String(a.id)) })));
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = announcements.filter(a => {
    const matchFilter = activeFilter === 'all' || (a.type || '').toLowerCase() === activeFilter;
    const matchSearch = (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (a.content || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const grouped = groupByMonth(filtered);
  const filters = ['all', 'event', 'general', 'reminder'];

  /* Open detail — save scroll + mark as read immediately */
  function openDetail(item) {
    scrollPosRef.current = window.scrollY || document.documentElement.scrollTop;

    if (!item.read) {
      // Save to localStorage so it stays read after logout/login
      const readIds = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
      if (!readIds.includes(String(item.id))) {
        localStorage.setItem('readAnnouncements', JSON.stringify([...readIds, String(item.id)]));
      }

      setAnnouncements(prev =>
        prev.map(a => a.id === item.id ? { ...a, read: true } : a)
      );
      try {
        const token = getToken();
        const clubId = myClubs[currentClubIdx]?.id;
        if (clubId) {
          axios.post(
            `/api/student/clubs/${clubId}/announcements/${item.id}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          ).catch(() => {});
        }
      } catch (_) {}
    }

    setDetail({ ...item, read: true });
    window.scrollTo(0, 0);
  }

  /* Back — restore scroll */
  function handleBack() {
    setDetail(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosRef.current);
    });
  }

  /* ── DETAIL VIEW ── */
  if (detail) {
    const hasAttachment = !!(detail.image || detail.attachment);
    const attachUrl     = detail.image || detail.attachment;

    return (
      <StudentLayout pageTitle="Announcements" pageSubtitle="Information of the club">
        <button className="san-back-btn" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Announcements
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
            <p className="san-detail-body">{detail.content}</p>

            {hasAttachment && (
              <a
                className="san-detail-attachment"
                href={attachUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PaperclipIcon size={15}/>
                View Attachment
                <OpenIcon/>
              </a>
            )}
          </div>
        </div>
      </StudentLayout>
    );
  }

  /* ── LIST VIEW ── */
  return (
    <StudentLayout pageTitle="Announcements" pageSubtitle="Information of the club">

      {/* Stats */}
      <div className="san-stats-wrapper">
        <div className="san-stats-grid">
          <div className="san-stat-card" style={{ animationDelay: '0.05s' }}>
            <div className="san-stat-label">Total Announcements</div>
            <div className="san-stat-value">
              {loading ? '—' : <AnimatedNumber target={announcements.length} />}
            </div>
          </div>
          <div className="san-stat-card" style={{ animationDelay: '0.10s' }}>
            <div className="san-stat-label">Unread</div>
            <div className="san-stat-value">
              {/* This now updates instantly when you open an announcement */}
              {loading ? '—' : <AnimatedNumber target={announcements.filter(a => !a.read).length} />}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="san-filter-bar">
        <div className="san-tabs">
          {filters.map(f => (
            <button
              key={f}
              className={`san-tab${activeFilter === f ? ' active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="san-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search announcements…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="san-loading-list">
          {[1,2,3].map(i => (
            <div className="san-skeleton-card" key={i}>
              <div className="san-skeleton-body">
                <div className="san-skeleton-line wide" />
                <div className="san-skeleton-line" />
                <div className="san-skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      ) : myClubs.length === 0 ? (
        <div className="san-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <strong>No club joined yet</strong>
          <p>Join a club to see announcements.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="san-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <strong>No announcements found</strong>
          <p>Try adjusting your filter or search term.</p>
        </div>
      ) : (
        <div className="san-announce-section">
          {Object.entries(grouped).map(([month, items], gi) => (
            <div className="san-month-group" key={month}>
              <div className="san-month-label">{month}</div>
              {items.map((a, i) => (
                <div
                  key={a.id || i}
                  className={`san-announce-card${!a.read ? ' san-unread' : ''}`}
                  style={{ animationDelay: `${gi * 0.05 + i * 0.06}s` }}
                  onClick={() => openDetail(a)}
                >
                  <div className="san-announce-body">
                    <div className="san-announce-title-row">
                      <TypeBadge type={a.type} />
                      <span className="san-announce-title">
                        {a.title}
                        {/* Unread dot indicator */}
                        {!a.read && <span className="san-unread-dot"/>}
                      </span>
                    </div>
                    <div className="san-announce-desc">{a.content}</div>
                    <span className="san-announce-read-more">Read more →</span>
                  </div>
                  <div className="san-announce-meta">
                    <div className="san-announce-meta-spacer" />
                    <div className="san-announce-meta-bottom">
                      {(a.image || a.attachment) && (
                        <span className="san-attach-pill">
                          <PaperclipIcon size={11}/>
                          Attachment
                        </span>
                      )}
                      <span className="san-announce-date">
                        {a.date_sent || formatDate(a.created_at)}
                      </span>
                      {a.posted_by && (
                        <span className="san-announce-posted-by">By {a.posted_by}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}