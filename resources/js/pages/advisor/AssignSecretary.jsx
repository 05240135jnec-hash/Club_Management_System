import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AdvisorLayout from './components/AdvisorLayout';
import Swal from 'sweetalert2';
import '../../styles/advisor/assignsecretary.css';

const API_URL = '/api';
const getToken = () => sessionStorage.getItem('token');

const AVATAR_COLORS = [
  '#4f46e5','#0891b2','#7c3aed','#059669',
  '#dc2626','#d97706','#be185d','#1d4ed8',
];

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AssignSecretary() {
  const [members, setMembers]               = useState([]);
  const [secretaries, setSecretaries]       = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalOpen, setModalOpen]           = useState(false);
  const [warnOpen, setWarnOpen]             = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [loading, setLoading]               = useState(true);
  const [toast, setToast]                   = useState(null);
  const [openMenuId, setOpenMenuId]         = useState(null);

  useEffect(() => {
    loadMembers();
    const handler = e => {
      if (!e.target.closest('.as-dot-wrap')) setOpenMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setModalOpen(false); setWarnOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      };

      // Load available club members AND current secretaries in parallel
      const [availRes, secretaryRes] = await Promise.allSettled([
        fetch(`${API_URL}/secretary/available-users`, { headers }),
        fetch(`${API_URL}/secretary`, { headers }),
      ]);

      // Available members (only enrolled in this club, from backend)
      if (availRes.status === 'fulfilled' && availRes.value.ok) {
        const data = await availRes.value.json();
        const all = (data.users || []).map((m, i) => ({
          id:          m.student_id || m.id,
          userId:      m.id,
          name:        m.name,
          dept:        m.department || '—',
          role:        m.role || 'member',
          avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        }));
        setMembers(all);
      }

      // Current secretaries of this club
      if (secretaryRes.status === 'fulfilled' && secretaryRes.value.ok) {
        const data = await secretaryRes.value.json();
        const secs = (data.members || [])
          .filter(m => m.role === 'secretary')
          .map((m, i) => ({
            id:          m.student_id || m.id,
            userId:      m.id,
            name:        m.name,
            dept:        m.course || m.department || '—',
            role:        'secretary',
            avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
          }));
        setSecretaries(secs);
      }

    } catch (err) {
      showToast(err.message || 'Failed to load members.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  async function confirmAssign() {
    if (!selectedMember) return;
    try {
      const res = await fetch(`${API_URL}/secretary/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ user_id: selectedMember.userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSecretaries(prev => [...prev, { ...selectedMember, role: 'secretary' }]);
      setMembers(prev => prev.filter(m => m.userId !== selectedMember.userId));
      setModalOpen(false);
      setSelectedMember(null);
      setSearchQuery('');
      showToast(`${selectedMember.name} assigned as Secretary!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to assign.', 'error');
    }
  }

  // ── Remove with SweetAlert ──
  async function removeSecretary(member) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: 'Remove Secretary?',
      html: `Are you sure you want to remove <strong>${member.name}</strong> as secretary? They will go back to being a regular member.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/secretary/${member.userId}/remove`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSecretaries(prev => prev.filter(s => s.userId !== member.userId));
      setMembers(prev => [...prev, { ...member, role: 'member' }]);
      showToast(`${member.name} removed as secretary.`, 'error');
    } catch (err) {
      showToast(err.message || 'Failed to remove.', 'error');
    }
  }

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(m.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const count = secretaries.length;

  const subtitle = count === 0
    ? 'No secretary assigned yet, select a member below'
    : count === 1
      ? '1 secretary assigned — 1 slot remaining'
      : '2 secretaries assigned — maximum reached';

  return (
    <AdvisorLayout title="Assign Secretary" subtitle="Assign a club member as secretary">

      {/* TOAST */}
      {toast && createPortal(
        <div className={`as-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          {toast.message}
        </div>, document.body
      )}

      <div className="as-page">

        {/* ══ ASSIGN CARD ══ */}
        <div className="as-card">

          {/* Header */}
          <div className="as-card-header">
            <div>
              <h2 className="as-card-title">Assign Secretary</h2>
              <p className="as-card-subtitle">{subtitle}</p>
            </div>
            <div className="as-slot-pills">
              {[0, 1].map(i => {
                const filled = !!secretaries[i];
                return (
                  <span key={i} className={`as-slot-pill ${filled ? 'filled' : ''}`}>
                    {filled ? getInitials(secretaries[i].name) : `Slot ${i + 1}`}
                    <span className={`as-slot-dot ${filled ? 'filled' : 'empty'}`} />
                  </span>
                );
              })}
            </div>
          </div>

          {/* Slots Area */}
          <div className="as-slots-area">
            {loading ? (
              <p className="as-loading">Loading members...</p>
            ) : count === 0 ? (
              <div className="as-empty">
                <div className="as-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p className="as-empty-title">No secretary assigned</p>
                <p className="as-empty-desc">Select an enrolled member to assign as Club Secretary.</p>
              </div>
            ) : (
              <div className="as-assigned-list">
                {secretaries.map(member => (
                  <div key={member.userId} className="as-assigned-card">
                    <div
                      className="as-assigned-avatar"
                      style={{ background: `linear-gradient(135deg, ${member.avatarColor}, #4f7af8)` }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="as-assigned-info">
                      <div className="as-assigned-name">{member.name}</div>
                      <div className="as-assigned-id">{member.id} · {member.dept}</div>
                    </div>
                    <div className="as-assigned-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Secretary
                    </div>

                    {/* ── 3-dot menu ── */}
                    <div className="as-dot-wrap">
                      <button
                        className="as-dot-btn"
                        onClick={() => setOpenMenuId(openMenuId === member.userId ? null : member.userId)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <circle cx="12" cy="5" r="1.5"/>
                          <circle cx="12" cy="12" r="1.5"/>
                          <circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>
                      {openMenuId === member.userId && (
                        <div className="as-dot-dropdown">
                          <button
                            className="as-dot-item as-dot-item--danger"
                            onClick={() => removeSecretary(member)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="as-action-row">
            <div className="as-max-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Maximum <strong>2 secretaries</strong> allowed per club
            </div>
            <button
              className={`as-assign-btn ${count >= 2 ? 'full' : ''}`}
              onClick={() => count >= 2 ? setWarnOpen(true) : setModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Assign Secretary
            </button>
          </div>
        </div>

        {/* ══ CAPABILITIES CARD ══ */}
        <div className="as-card as-cap-card">
          <div className="as-cap-header">
            <div className="as-cap-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h2 className="as-cap-header-title">What the secretary can do</h2>
              <p className="as-cap-header-sub">The assigned secretary will have access to all these features</p>
            </div>
          </div>
          <div className="as-cap-grid">
            {[
              { cls: 'as-cap-blue',   title: 'Manage members',       desc: 'View and remove members',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { cls: 'as-cap-purple', title: 'Upload Work plan',      desc: 'Upload work plan',                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              { cls: 'as-cap-purple', title: 'Upload image and blog', desc: 'A moment captured, a story untold', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              { cls: 'as-cap-green',  title: 'Record attendance',    desc: 'Mark and download records',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
              { cls: 'as-cap-orange', title: 'Post announcements',   desc: 'Send notices to members',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
              { cls: 'as-cap-red',    title: 'Upload reports',       desc: 'Submit audit and activity files', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
            ].map((cap, i) => (
              <div key={i} className="as-cap-item">
                <div className={`as-cap-icon ${cap.cls}`}>{cap.icon}</div>
                <div>
                  <div className="as-cap-title">{cap.title}</div>
                  <div className="as-cap-desc">{cap.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ASSIGN MODAL ══ */}
      {modalOpen && createPortal(
        <div className="as-modal-backdrop" onClick={() => { setModalOpen(false); setSelectedMember(null); setSearchQuery(''); }}>
          <div className="as-modal" onClick={e => e.stopPropagation()}>
            <div className="as-modal-header">
              <div>
                <h3 className="as-modal-title">Assign Club Secretary</h3>
                <p className="as-modal-sub">Search and select an enrolled member by name or student ID</p>
              </div>
              <button className="as-modal-close" onClick={() => { setModalOpen(false); setSelectedMember(null); setSearchQuery(''); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="as-search-wrap">
              <svg className="as-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus
                type="text"
                className="as-search-input"
                placeholder="Search by name or student ID…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedMember(null); }}
              />
            </div>

            <div className="as-member-list">
              {filteredMembers.length === 0 ? (
                <div className="as-no-results">
                  {searchQuery
                    ? <>No enrolled members found matching "<strong>{searchQuery}</strong>"</>
                    : 'No available enrolled members to assign.'
                  }
                </div>
              ) : filteredMembers.map(member => {
                const isSelected = selectedMember?.userId === member.userId;
                return (
                  <div
                    key={member.userId}
                    className={`as-member-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="as-member-avatar" style={{ background: member.avatarColor }}>
                      {getInitials(member.name)}
                    </div>
                    <div className="as-member-details">
                      <div className="as-member-name">{member.name}</div>
                      <div className="as-member-sid">{member.id} · {member.dept}</div>
                    </div>
                    <div className="as-member-check">
                      {isSelected && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="11" height="11">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="as-modal-footer">
              <button className="as-btn-cancel" onClick={() => { setModalOpen(false); setSelectedMember(null); setSearchQuery(''); }}>Cancel</button>
              <button className="as-btn-confirm" disabled={!selectedMember} onClick={confirmAssign}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* ══ WARN MODAL ══ */}
      {warnOpen && createPortal(
        <div className="as-modal-backdrop" onClick={() => setWarnOpen(false)}>
          <div className="as-warn-modal" onClick={e => e.stopPropagation()}>
            <div className="as-warn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className="as-warn-title">Maximum Limit Reached</h3>
            <p className="as-warn-desc">You have already assigned <strong>2 secretaries</strong> for this club. Please remove one before assigning a new secretary.</p>
            <button className="as-btn-warn-ok" onClick={() => setWarnOpen(false)}>Got it</button>
          </div>
        </div>, document.body
      )}

    </AdvisorLayout>
  );
}