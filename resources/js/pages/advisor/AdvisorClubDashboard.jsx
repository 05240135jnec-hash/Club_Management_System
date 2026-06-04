import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdvisorLayout from './components/AdvisorLayout';
import '../../styles/advisor/advisordashboard.css';

const API = '/api';
const getToken = () => sessionStorage.getItem('token');

// ✅ Fixed: removed semicolons inside color values
const TYPE_COLORS = {
  event:    { bg: '#dbeafe', color: '#1d4ed8' },
  notice:   { bg: '#fef9c3', color: '#a16207' },
  reminder: { bg: '#ffedd5', color: '#9a3412' },
  general:  { bg: '#ede9fe', color: '#374151' },
};

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function getRecipientLabel(recipients) {
  if (recipients === 'students') return 'To: All Students';
  if (recipients === 'both')     return 'To: Members & Students';
  return 'To: Members';
}

function isImageFile(url) {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname;
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(pathname);
  } catch {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
  }
}

function getTypeBadgeClass(type) {
  if (type === 'event')    return 'type-badge event';
  if (type === 'reminder') return 'type-badge reminder';
  if (type === 'notice')   return 'type-badge notice';
  return 'type-badge general';
}

export default function AdvisorClubDashboard() {
  const navigate = useNavigate();

  const [stats, setStats]                 = useState({ members: 0, announcements: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [viewItem, setViewItem]           = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' };
      const [membersRes, announcementsRes] = await Promise.allSettled([
        fetch(`${API}/clubs/members`, { headers }),
        fetch(`${API}/announcements`, { headers }),
      ]);

      let totalMembers = 0;
      if (membersRes.status === 'fulfilled' && membersRes.value.ok) {
        const d = await membersRes.value.json();
        totalMembers = (Array.isArray(d) ? d : []).filter(m => m.status === 'active').length;
      }

      let annList = [];
      if (announcementsRes.status === 'fulfilled' && announcementsRes.value.ok) {
        const d = await announcementsRes.value.json();
        annList = d.announcements || d.data || [];
      }

      setStats({ members: totalMembers, announcements: annList.length });
      setAnnouncements(annList);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  /* ── VIEW PAGE ── */
  if (viewItem) {
    const type = viewItem.type || 'general';

    return (
      <AdvisorLayout title="Dashboard" subtitle="Welcome back here's your club at a glance">
        <div className="ann-view-page">

          <div className="ann-view-toprow">
            <button className="ann-back-btn" onClick={() => setViewItem(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back to Dashboard
            </button>
          </div>

          <div className="ann-view-card">

            <div className="ann-view-header-row">
              <div className="ann-view-title-group">
                <span className={getTypeBadgeClass(type)}>
                  {type.toUpperCase()}
                </span>
                <h1 className="ann-view-title">{viewItem.title}</h1>
              </div>
              <span className="ann-view-date">
                {viewItem.date_sent || formatDateTime(viewItem.created_at)}
              </span>
            </div>

            <div className="ann-view-recipient">
              {getRecipientLabel(viewItem.recipients)}
            </div>

            <div className="ann-view-authors">
              {(viewItem.posted_by || viewItem.created_by) && (
                <span>
                  Posted by: <strong>{viewItem.posted_by || viewItem.created_by}</strong>
                </span>
              )}
              {(viewItem.last_edited_by || viewItem.updated_by) && (
                <span>
                  Last edited by: <strong>{viewItem.last_edited_by || viewItem.updated_by}</strong>
                </span>
              )}
            </div>

            <div className="ann-view-divider" />

            {viewItem.attachment && isImageFile(viewItem.attachment) && (
              <div className="ann-view-img-wrap">
                <img src={viewItem.attachment} alt="attachment" className="ann-view-img" />
              </div>
            )}

            <div className="ann-view-content">
              {viewItem.content}
            </div>

            {viewItem.attachment && !isImageFile(viewItem.attachment) && (
              <a
                href={viewItem.attachment}
                target="_blank"
                rel="noreferrer"
                className="ann-view-attachment-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41A2 2 0 016.59 14.59l8.49-8.49"/>
                </svg>
                View Attachment
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}

          </div>
        </div>
      </AdvisorLayout>
    );
  }

  /* ── DASHBOARD PAGE ── */
  return (
    <AdvisorLayout title="Dashboard" subtitle="Welcome back here's your club at a glance">

      <div className="adb-stat-cards">
        <div className="adb-stat-card">
          <div className="adb-stat-info">
            <span className="adb-stat-label">Total Members</span>
            <span className="adb-stat-value">{loading ? '—' : stats.members}</span>
          </div>
        </div>
        <div className="adb-stat-card">
          <div className="adb-stat-info">
            <span className="adb-stat-label">Total Announcements</span>
            <span className="adb-stat-value">{loading ? '—' : stats.announcements}</span>
          </div>
        </div>
      </div>

      <div className="adb-card adb-ann-full">
        <div className="adb-card-header">
          <div>
            <div className="adb-card-title">Recent Announcements</div>
            <div className="adb-card-subtitle">Latest posts from your club</div>
          </div>
          <button className="adb-see-all-btn" onClick={() => navigate('/advisor/announcements')}>
            See all →
          </button>
        </div>

        <div className="adb-ann-list adb-ann-list-full">
          {loading ? (
            <div className="adb-loading">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="adb-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p>No announcements yet.</p>
            </div>
          ) : (
            announcements.slice(0, 5).map(ann => {
              const type   = ann.type || 'general';
              const colors = TYPE_COLORS[type] || TYPE_COLORS.general;
              return (
                <div key={ann.id} className="adb-ann-item" onClick={() => setViewItem(ann)}>
                  <div className="adb-ann-body">

                    <div className="adb-ann-title">{ann.title}</div>

                    <div className="adb-ann-desc">
                      {ann.content?.length > 160
                        ? ann.content.slice(0, 160) + '...'
                        : ann.content}
                    </div>

                    <div className="adb-ann-footer">
                      <span
                        className="adb-ann-badge"
                        style={{ background: colors.bg, color: colors.color }}
                      >
                        {type.toUpperCase()}
                      </span>
                      <div className="adb-ann-meta">
                        <span className="adb-ann-recipient">
                          {getRecipientLabel(ann.recipients)}
                        </span>
                        <span className="adb-ann-date">
                          {ann.date_sent || formatDate(ann.created_at)}
                        </span>
                        {(ann.posted_by || ann.created_by) && (
                          <span className="adb-ann-author">
                            Posted by: {ann.posted_by || ann.created_by}
                          </span>
                        )}
                        {ann.attachment && (
                          <span className="adb-ann-attach-tag">
                            <PaperclipIcon />
                            Attachment
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="adb-ann-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </AdvisorLayout>
  );
}