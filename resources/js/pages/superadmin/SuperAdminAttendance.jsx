import { useState, useEffect } from 'react';
import SuperAdminLayout from './components/SuperAdminLayout';
import '../../styles/superadmin/attendance.css';

const API      = '/api/superadmin';
const getToken = () => sessionStorage.getItem('token');

/* ── helpers ─────────────────────────────────────────── */
function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function RateBar({ rate }) {
  if (rate === null || rate === undefined) {
    return <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>No sessions</span>;
  }
  const fill = rate >= 80 ? '#16a34a' : rate >= 60 ? '#ca8a04' : '#dc2626';
  return (
    <div className="sa-att-bar-wrap">
      <div className="sa-att-bar-bg">
        <div className="sa-att-bar-fill" style={{ width: `${rate}%`, background: fill }} />
      </div>
      <span className="sa-att-bar-pct" style={{ color: fill }}>{rate}%</span>
    </div>
  );
}

function RateBadge({ rate }) {
  if (rate === null || rate === undefined) return <span className="sa-att-badge gray">—</span>;
  const cls = rate >= 80 ? 'green' : rate >= 60 ? 'amber' : 'red';
  return <span className={`sa-att-badge ${cls}`}>{rate}%</span>;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ══════════════════════════════════════════════════════════
   LEVEL 1 — All Clubs Overview
══════════════════════════════════════════════════════════ */
function Level1({ onSelectClub }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/attendance`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const clubs = (data?.clubs || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Stat cards — no icons */}
      <div className="sa-att-stats">
        <div className="sa-att-stat">
          <div className="sa-att-stat-label">Total Clubs</div>
          <div className="sa-att-stat-num">{loading ? '—' : (data?.total_clubs ?? 0)}</div>
        </div>
        <div className="sa-att-stat">
          <div className="sa-att-stat-label">Active This Month</div>
          <div className="sa-att-stat-num">{loading ? '—' : (data?.active_month ?? 0)}</div>
        </div>
      </div>

      {/* Club table */}
      <div className="sa-att-card">
        <div className="sa-att-card-header">
          <span className="sa-att-card-title">All Clubs Attendance</span>
          <div className="sa-att-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs..." />
          </div>
        </div>

        {loading ? (
          <div className="sa-att-loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading attendance data...
          </div>
        ) : clubs.length === 0 ? (
          <div className="sa-att-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p>No clubs found.</p>
          </div>
        ) : (
          <div className="sa-att-table-wrap">
            <table className="sa-att-table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Advisor</th>
                  <th style={{ textAlign: 'center' }}>Sessions</th>
                  <th>Avg Rate</th>
                  <th>Last Session</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map(club => (
                  <tr key={club.id} className="clickable" onClick={() => onSelectClub(club)}>
                    <td>
                      <div className="sa-att-club-cell">
                        <div className="sa-att-avatar">{getInitials(club.name)}</div>
                        <div>
                          <div className="sa-att-club-name">{club.name}</div>
                          <div className="sa-att-club-cat">{club.category || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#1a2332', fontSize: 13 }}>{club.advisor}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#1a2332' }}>{club.total_sessions}</td>
                    <td><RateBar rate={club.total_sessions > 0 ? club.avg_rate : null} /></td>
                    <td style={{ color: '#1a2332', fontSize: 13 }}>{fmtDate(club.last_session)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   LEVEL 2 — Club Sessions
══════════════════════════════════════════════════════════ */
function Level2({ club, onBack, onSelectSession }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/attendance/${club.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [club.id]);

  const sessions = (data?.sessions || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.date.includes(search)
  );

  return (
    <>
      <div className="sa-att-breadcrumb">
        <button className="crumb-link" onClick={onBack}>All Clubs</button>
        <span className="sep">›</span>
        <span className="crumb-current">{club.name}</span>
      </div>

      <button className="sa-att-back-btn" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to All Clubs
      </button>

      <div className="sa-att-card">
        <div className="sa-att-card-header">
          <div>
            <span className="sa-att-card-title">{club.name} — Sessions</span>
            {data && (
              <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                {data.total_members} active members
              </div>
            )}
          </div>
          <div className="sa-att-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions..." />
          </div>
        </div>

        {loading ? (
          <div className="sa-att-loading">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="sa-att-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>No sessions recorded yet.</p>
          </div>
        ) : (
          <div className="sa-att-table-wrap">
            <table className="sa-att-table">
              <thead>
                <tr>
                  <th>Session Name</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Members</th>
                  <th style={{ textAlign: 'center' }}>Present</th>
                  <th style={{ textAlign: 'center' }}>Absent</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id} className="clickable" onClick={() => onSelectSession(session)}>
                    <td style={{ fontWeight: 600, color: '#1a2332' }}>{session.name}</td>
                    <td style={{ color: '#1a2332', fontSize: 13 }}>{fmtDate(session.date)}</td>
                    <td style={{ textAlign: 'center', color: '#1a2332', fontWeight: 600 }}>{session.total}</td>
                    <td style={{ textAlign: 'center', color: '#15803d', fontWeight: 700 }}>{session.present}</td>
                    <td style={{ textAlign: 'center', color: '#b91c1c', fontWeight: 700 }}>{session.absent}</td>
                    <td><RateBadge rate={session.rate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   LEVEL 3 — Session Member Detail
══════════════════════════════════════════════════════════ */
function Level3({ club, session, onBack, onBackToClub }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/attendance/${club.id}/session/${session.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [club.id, session.id]);

  const members = (data?.members || []).filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.student_id || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'present' && m.status === 'present') ||
      (filter === 'absent'  && m.status === 'absent');
    return matchSearch && matchFilter;
  });

  const s = data?.session;

  return (
    <>
      <div className="sa-att-breadcrumb">
        <button className="crumb-link" onClick={onBack}>All Clubs</button>
        <span className="sep">›</span>
        <button className="crumb-link" onClick={onBackToClub}>{club.name}</button>
        <span className="sep">›</span>
        <span className="crumb-current">{session.name}</span>
      </div>

      <button className="sa-att-back-btn" onClick={onBackToClub}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to {club.name}
      </button>

      {/* Session summary — no icons, same style as stat cards */}
      {!loading && s && (
        <div className="sa-att-session-stats">
          <div className="sa-att-session-stat">
            <div className="sa-att-session-stat-label">Total Members</div>
            <div className="sa-att-session-stat-num">{s.total}</div>
          </div>
          <div className="sa-att-session-stat">
            <div className="sa-att-session-stat-label">Present</div>
            <div className="sa-att-session-stat-num" style={{ color: '#15803d' }}>{s.present}</div>
          </div>
          <div className="sa-att-session-stat">
            <div className="sa-att-session-stat-label">Absent</div>
            <div className="sa-att-session-stat-num" style={{ color: '#b91c1c' }}>{s.absent}</div>
          </div>
        </div>
      )}

      <div className="sa-att-card">
        <div className="sa-att-card-header">
          <div>
            <span className="sa-att-card-title">{session.name}</span>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{fmtDate(session.date)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              {['all', 'present', 'absent'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 12px', fontSize: 12, fontWeight: 600,
                    borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: filter === f ? '#fff' : 'transparent',
                    color: filter === f
                      ? (f === 'present' ? '#15803d' : f === 'absent' ? '#b91c1c' : '#1a2332')
                      : '#475569',
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="sa-att-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="sa-att-loading">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="sa-att-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p>No members found.</p>
          </div>
        ) : (
          <div className="sa-att-table-wrap">
            <table className="sa-att-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Student ID</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Overall %</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="sa-att-club-cell">
                        <div className="sa-att-member-avatar">{getInitials(m.name)}</div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#1a2332' }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#1a2332', fontSize: 13 }}>{m.student_id}</td>
                    <td style={{ color: '#1a2332', fontSize: 13 }}>{m.course}</td>
                    <td style={{ color: '#1a2332', fontSize: 13 }}>Y{m.year}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`sa-att-badge ${m.status}`}>
                        {m.status === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <RateBadge rate={m.overall_pct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function SuperAdminAttendance() {
  const [level,           setLevel]           = useState(1);
  const [selectedClub,    setSelectedClub]    = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  function handleSelectClub(club) { setSelectedClub(club); setLevel(2); }
  function handleSelectSession(session) { setSelectedSession(session); setLevel(3); }
  function handleBackToAll() { setSelectedClub(null); setSelectedSession(null); setLevel(1); }
  function handleBackToClub() { setSelectedSession(null); setLevel(2); }

  const title    = level === 1 ? 'Attendance'
                 : level === 2 ? selectedClub?.name + ' — Attendance'
                 : selectedSession?.name || 'Session Detail';
  const subtitle = level === 1 ? 'Overall attendance across all clubs'
                 : level === 2 ? 'All sessions for this club'
                 : 'Member-level attendance detail';

  return (
    <SuperAdminLayout title={title} subtitle={subtitle}>
      <div className="sa-att-page">
        {level === 1 && <Level1 onSelectClub={handleSelectClub} />}
        {level === 2 && selectedClub && (
          <Level2 club={selectedClub} onBack={handleBackToAll} onSelectSession={handleSelectSession} />
        )}
        {level === 3 && selectedClub && selectedSession && (
          <Level3 club={selectedClub} session={selectedSession} onBack={handleBackToAll} onBackToClub={handleBackToClub} />
        )}
      </div>
    </SuperAdminLayout>
  );
}