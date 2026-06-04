import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './components/StudentLayout';
import '../../styles/student/studentworkplan.css';

const getToken = () => sessionStorage.getItem('token');

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileExt(fileName) {
  if (!fileName) return 'FILE';
  return fileName.split('.').pop().toUpperCase();
}

export default function StudentWorkPlan() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const [myClubs, setMyClubs] = useState([]);
  const [currentClubIdx, setCurrentClubIdx] = useState(0);
  const [workPlans, setWorkPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    fetchClubs(token);
  }, []);

  useEffect(() => {
    if (myClubs.length === 0) return;
    fetchWorkPlans(myClubs[currentClubIdx]?.id);
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
        fetchWorkPlans(clubs[startIdx].id);
      } else {
        setLoading(false);
      }
    } catch { setLoading(false); }
  };

  const fetchWorkPlans = async (clubId) => {
    if (!clubId) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`/api/student/clubs/${clubId}/work-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkPlans(res.data.work_plans || []);
    } catch {
      setWorkPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = workPlans.filter(w =>
    (w.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.file_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <StudentLayout pageTitle="Work Plans" pageSubtitle="Browse and download your club's work plans">

      {/* Toolbar */}
      <div className="swp-toolbar">
        <div className="swp-search-wrap">
          <svg className="swp-search-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="swp-search-input"
            type="text"
            placeholder="Search work plans…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="swp-search-clear" onClick={() => setSearch('')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Plan List */}
      {loading ? (
        <div className="swp-plan-list">
          {[1,2,3].map(i => (
            <div className="swp-skeleton-item" key={i}>
              <div className="swp-skeleton-icon" />
              <div className="swp-skeleton-body">
                <div className="swp-skeleton-line wide" />
                <div className="swp-skeleton-line" />
              </div>
              <div className="swp-skeleton-btns" />
            </div>
          ))}
        </div>
      ) : myClubs.length === 0 ? (
        <div className="swp-empty-state">
          <div className="swp-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3>No club joined yet</h3>
          <p>Join a club to see work plans.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="swp-empty-state">
          <div className="swp-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3>No plans found</h3>
          <p>Try adjusting your search.</p>
          {search && (
            <button className="swp-btn-reset" onClick={() => setSearch('')}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="swp-plan-list">
          {filtered.map((plan, i) => (
            <div
              className="swp-plan-item"
              key={plan.id || i}
              onClick={() => window.open(plan.file_url, '_blank')}
            >
              {/* File Icon */}
              <div className="swp-file-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                  <line x1="9" y1="17" x2="15" y2="17"/>
                  <line x1="9" y1="9"  x2="12" y2="9"/>
                </svg>
              </div>

              {/* Plan Info */}
              <div className="swp-plan-info">
                <div className="swp-plan-name">{plan.title}</div>
                <div className="swp-plan-meta">
                  <span className="swp-meta-filename">{plan.file_name}</span>
                  <span className="swp-meta-dot" />
                  <span>{formatDate(plan.created_at)}</span>
                </div>
                <div style={{fontSize:12, color:'#6b7280', marginTop:4}}>
                  <span>👤 Posted by: <strong>{plan.uploaded_by || '—'}</strong></span>
                </div>
              </div>

              {/* Download button only */}
              <div className="swp-plan-actions">
                <a
                  className="swp-btn swp-btn-download"
                  href={plan.file_url}
                  target="_blank"
                  rel="noreferrer"
                  download={plan.file_name}
                  onClick={e => e.stopPropagation()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </StudentLayout>
  );
}