import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './components/StudentLayout';
import '../../styles/student/studentattendance.css';

const getToken = () => sessionStorage.getItem('token');

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AnimatedNumber({ target, suffix = '' }) {
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
  return <>{value}{suffix}</>;
}

export default function StudentAttendance() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const [myClubs, setMyClubs] = useState([]);
  const [currentClubIdx, setCurrentClubIdx] = useState(0);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    fetchClubs(token);
  }, []);

  useEffect(() => {
    if (myClubs.length === 0) return;
    fetchAttendance(myClubs[currentClubIdx]?.id);
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
        fetchAttendance(clubs[startIdx].id);
      } else {
        setLoading(false);
      }
    } catch { setLoading(false); }
  };

  const fetchAttendance = async (clubId) => {
    if (!clubId) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`/api/student/clubs/${clubId}/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(res.data);
    } catch {
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  const sessions = attendance?.sessions || [];

  // The club name comes from the API response top-level, or from each session row
  const clubName = attendance?.club_name || myClubs[currentClubIdx]?.name || '—';

  const filtered = sessions.filter(s => {
    const matchSearch = (s.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    const matchDate   = !dateFilter  || s.date === dateFilter;
    return matchSearch && matchStatus && matchDate;
  });

  return (
    <StudentLayout pageTitle="My Attendance" pageSubtitle="Your attendance records across joined clubs">

      {/* Summary Cards */}
      <div className="sat-summary-row">
        <div className="sat-summary-card">
          <span className="sat-s-label">Total Sessions</span>
          <span className="sat-s-value">
            {loading ? '—' : <AnimatedNumber target={attendance?.total_sessions || 0} />}
          </span>
        </div>
        <div className="sat-summary-card">
          <span className="sat-s-label">Present</span>
          <span className="sat-s-value">
            {loading ? '—' : <AnimatedNumber target={attendance?.present || 0} />}
          </span>
        </div>
        <div className="sat-summary-card">
          <span className="sat-s-label">Absent</span>
          <span className="sat-s-value">
            {loading ? '—' : <AnimatedNumber target={attendance?.absent || 0} />}
          </span>
        </div>
        <div className="sat-summary-card">
          <span className="sat-s-label">Attendance Rate</span>
          <span className="sat-s-value">
            {loading ? '—' : <AnimatedNumber target={attendance?.overall_pct || 0} suffix="%" />}
          </span>
        </div>
      </div>

      {/* Attendance Records Card */}
      <div className="sat-attendance-card">
        <div className="sat-card-header">
          <div className="sat-card-header-left">
            <span className="sat-card-title">Attendance Records</span>
            <span className="sat-card-subtitle">
              {loading ? 'Loading…' : `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Filters */}
          <div className="sat-filter-bar">
            <div className="sat-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="sat-search-input"
                type="text"
                placeholder="Search event…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <input
              className="sat-date-input"
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              title="Filter by date"
            />

            <select
              className="sat-filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="sat-table-wrap">
          {loading ? (
            <div className="sat-skeleton-list">
              {[1,2,3,4,5].map(i => (
                <div className="sat-skeleton-row" key={i}>
                  <div className="sat-skeleton-cell wide" />
                  <div className="sat-skeleton-cell" />
                  <div className="sat-skeleton-cell short" />
                </div>
              ))}
            </div>
          ) : myClubs.length === 0 ? (
            <div className="sat-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                   strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <p>You haven't joined any club yet.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="sat-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                   strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <p>No records found for your search.</p>
            </div>
          ) : (
            <table className="sat-table">
              <thead>
                <tr>
                  <th>Club Name</th>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id || i}>
                    {/* Club name: from session row, or fallback to top-level club_name, or from myClubs */}
                    <td><div className="sat-event-name">{s.club_name || clubName}</div></td>
                    {/* Session name */}
                    <td><div className="sat-event-name">{s.name}</div></td>
                    {/* Date */}
                    <td className="sat-date-cell">{formatDate(s.date)}</td>
                    {/* Status */}
                    <td>
                      <span className={`sat-status-badge ${s.status}`}>
                        {s.status === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </StudentLayout>
  );
}