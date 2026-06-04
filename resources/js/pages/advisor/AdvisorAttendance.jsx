import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AdvisorLayout from './components/AdvisorLayout';
import '../../styles/advisor/attendance.css';

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

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function pctClass(pct) {
  if (pct >= 90) return 'high';
  if (pct >= 75) return 'medium';
  return 'low';
}

function yearLabel(y) {
  if (!y) return '—';
  return String(y);
}

export default function AdvisorAttendance() {
  const [sessions, setSessions]             = useState([]);
  const [activeSession, setActiveSession]   = useState(null);
  const [members, setMembers]               = useState([]);
  const [absent, setAbsent]                 = useState({});
  const [sessionSearch, setSessionSearch]   = useState('');
  const [memberSearch, setMemberSearch]     = useState('');
  const [newModal, setNewModal]             = useState(false);
  const [formName, setFormName]             = useState('');
  const [formDate, setFormDate]             = useState('');
  const [loading, setLoading]               = useState(true);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [toast, setToast]                   = useState(null);
  const [openMenuId, setOpenMenuId]         = useState(null);
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);
  const [editModal, setEditModal]           = useState(false);
  const [editSession, setEditSession]       = useState(null);
  const [editName, setEditName]             = useState('');
  const [editDate, setEditDate]             = useState('');
  const [deleteModal, setDeleteModal]       = useState(false);
  const [deleteSession, setDeleteSession]   = useState(null);
  const [profileMember, setProfileMember]   = useState(null);
  const [savingId, setSavingId]             = useState(null); // which member is currently saving

  const menuRef       = useRef(null);
  const detailMenuRef = useRef(null);

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
      if (detailMenuRef.current && !detailMenuRef.current.contains(e.target)) setDetailMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        setEditModal(false);
        setDeleteModal(false);
        setNewModal(false);
        setOpenMenuId(null);
        setDetailMenuOpen(false);
        setProfileMember(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  async function loadSessions(keepActiveId = null) {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/attendance`, {
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSessions(data.sessions);
      if (data.sessions.length > 0) {
        const target = keepActiveId
          ? data.sessions.find(s => s.id === keepActiveId)
          : data.sessions[0];
        if (target) loadSession(target);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load sessions.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadSession(session) {
    setActiveSession(session);
    setDetailLoading(true);
    setMemberSearch('');
    setDetailMenuOpen(false);
    try {
      const res  = await fetch(`${API_URL}/attendance/${session.id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMembers(data.members.map((m, i) => ({
        ...m,
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      })));
      const absentMap = {};
      data.members.forEach(m => { if (m.status === 'absent') absentMap[m.id] = true; });
      setAbsent(absentMap);
    } catch (err) {
      showToast(err.message || 'Failed to load session.', 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  async function createSession() {
    if (!formName.trim()) { showToast('Please enter a session name.', 'error'); return; }
    if (!formDate)        { showToast('Please select a date.', 'error'); return; }
    try {
      const res  = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), date: formDate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSessions(prev => [data.session, ...prev]);
      setNewModal(false);
      setFormName('');
      setFormDate('');
      showToast('Session created!', 'success');
      loadSession(data.session);
    } catch (err) {
      showToast(err.message || 'Failed to create session.', 'error');
    }
  }

  function openEdit(session) {
    setEditSession(session); setEditName(session.name); setEditDate(session.date);
    setEditModal(true); setOpenMenuId(null); setDetailMenuOpen(false);
  }

  async function saveEdit() {
    if (!editName.trim()) { showToast('Please enter a session name.', 'error'); return; }
    if (!editDate)        { showToast('Please select a date.', 'error'); return; }
    try {
      const res  = await fetch(`${API_URL}/attendance/${editSession.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), date: editDate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSessions(prev => prev.map(s => s.id === editSession.id ? { ...s, name: editName.trim(), date: editDate } : s));
      if (activeSession?.id === editSession.id) setActiveSession(prev => ({ ...prev, name: editName.trim(), date: editDate }));
      setEditModal(false);
      showToast('Session updated!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update session.', 'error');
    }
  }

  function openDelete(session) {
    setDeleteSession(session); setDeleteModal(true); setOpenMenuId(null); setDetailMenuOpen(false);
  }

  async function confirmDelete() {
    try {
      const res  = await fetch(`${API_URL}/attendance/${deleteSession.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const remaining = sessions.filter(s => s.id !== deleteSession.id);
      setSessions(remaining);
      if (activeSession?.id === deleteSession.id) {
        if (remaining.length > 0) loadSession(remaining[0]);
        else { setActiveSession(null); setMembers([]); setAbsent({}); }
      }
      setDeleteModal(false);
      showToast('Session deleted.', 'error');
    } catch (err) {
      showToast(err.message || 'Failed to delete.', 'error');
    }
  }

  // AUTO-SAVE: called immediately on every checkbox change
  async function handleAbsentToggle(memberId, checked, currentAbsent) {
    const newAbsent = { ...currentAbsent };
    if (checked) newAbsent[memberId] = true;
    else delete newAbsent[memberId];

    // Optimistic UI update
    setAbsent(newAbsent);
    setSavingId(memberId);

    const attendance = members.map(m => ({
      user_id: m.id,
      status: newAbsent[m.id] ? 'absent' : 'present',
    }));

    try {
      const res = await fetch(`${API_URL}/attendance/${activeSession.id}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ attendance }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // ✅ Update sidebar percentage locally — no reload, no blink
      const presentTotal = members.filter(m => !newAbsent[m.id]).length;
      const newPct = members.length > 0 ? Math.round((presentTotal / members.length) * 100) : 0;
      setSessions(prev => prev.map(s =>
        s.id === activeSession.id ? { ...s, percentage: newPct } : s
      ));

      showToast('Attendance saved!', 'success');
    } catch (err) {
      // Revert on failure
      setAbsent(currentAbsent);
      showToast(err.message || 'Failed to save.', 'error');
    } finally {
      setSavingId(null);
    }
  }

  const filteredSessions = sessions.filter(s => s.name.toLowerCase().includes(sessionSearch.toLowerCase()));
  const filteredMembers  = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.course || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.student_id || '').toLowerCase().includes(memberSearch.toLowerCase())
  );
  const presentCount = filteredMembers.filter(m => !absent[m.id]).length;
  const absentCount  = filteredMembers.filter(m =>  absent[m.id]).length;
  const today        = new Date().toISOString().split('T')[0];

  function ThreeDotMenu({ session, fromDetail = false }) {
    const isOpen = fromDetail ? detailMenuOpen : openMenuId === session.id;
    return (
      <div className="att-menu-wrap" ref={fromDetail ? detailMenuRef : null} onClick={e => e.stopPropagation()}>
        <button className="att-menu-btn" onClick={() => {
          if (fromDetail) setDetailMenuOpen(o => !o);
          else setOpenMenuId(isOpen ? null : session.id);
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
        {isOpen && (
          <div className="att-menu-dropdown">
            <button className="att-menu-item" onClick={() => openEdit(session)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button className="att-menu-item delete" onClick={() => openDelete(session)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <AdvisorLayout title="Attendance" subtitle="Track and manage club session attendance">

      {/* TOAST */}
      {toast && createPortal(
        <div className={`att-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          {toast.message}
        </div>, document.body
      )}

      {/* PROFILE POPUP */}
      {profileMember && createPortal(
        <div className="att-modal-backdrop" onClick={() => setProfileMember(null)}>
          <div className="att-modal att-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <h3 className="att-modal-title">Student Profile</h3>
              <button className="att-modal-close" onClick={() => setProfileMember(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="att-profile-body">
              <div className="att-profile-avatar-wrap">
                <div className="att-profile-avatar" style={{ background: profileMember.avatarColor }}>
                  {getInitials(profileMember.name)}
                </div>
                <div className="att-profile-name">{profileMember.name}</div>
              </div>
              <div className="att-profile-rows">
                <div className="att-profile-row">
                  <span className="att-profile-label">Student ID</span>
                  <span className="att-profile-val">{profileMember.student_id || '—'}</span>
                </div>
                <div className="att-profile-row">
                  <span className="att-profile-label">Email</span>
                  <span className="att-profile-val">{profileMember.email || '—'}</span>
                </div>
                <div className="att-profile-row">
                  <span className="att-profile-label">Course</span>
                  <span className="att-profile-val">{profileMember.course || '—'}</span>
                </div>
                <div className="att-profile-row">
                  <span className="att-profile-label">Year</span>
                  <span className="att-profile-val">{yearLabel(profileMember.year)}</span>
                </div>
                <div className="att-profile-row">
                  <span className="att-profile-label">Attendance</span>
                  <span className={`att-profile-val ${profileMember.overall_pct < 75 ? 'att-pct-low' : 'att-pct-ok'}`}>
                    {profileMember.overall_pct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* NEW SESSION MODAL */}
      {newModal && createPortal(
        <div className="att-modal-backdrop" onClick={() => { setNewModal(false); setFormName(''); setFormDate(''); }}>
          <div className="att-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <h3 className="att-modal-title">New Session</h3>
              <button className="att-modal-close" onClick={() => { setNewModal(false); setFormName(''); setFormDate(''); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="att-modal-body">
              <div className="att-form-group">
                <label className="att-form-label">Session Name</label>
                <input
                  type="text"
                  className="att-form-input"
                  placeholder="e.g. April Meeting"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createSession()}
                  autoFocus
                />
              </div>
              <div className="att-form-group" style={{ marginTop: 14 }}>
                <label className="att-form-label">Date</label>
                <input
                  type="date"
                  className="att-form-input"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  min={today}
                />
              </div>
            </div>
            <div className="att-modal-footer">
              <button className="att-btn-cancel-form" onClick={() => { setNewModal(false); setFormName(''); setFormDate(''); }}>
                Cancel
              </button>
              <button className="att-btn-create" onClick={createSession}>
                Create Session
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* EDIT MODAL */}
      {editModal && createPortal(
        <div className="att-modal-backdrop" onClick={() => setEditModal(false)}>
          <div className="att-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <h3 className="att-modal-title">Edit Session</h3>
              <button className="att-modal-close" onClick={() => setEditModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="att-modal-body">
              <div className="att-form-group">
                <label className="att-form-label">Session Name</label>
                <input type="text" className="att-form-input" value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
              </div>
              <div className="att-form-group" style={{ marginTop: 14 }}>
                <label className="att-form-label">Date</label>
                <input type="date" className="att-form-input" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
            </div>
            <div className="att-modal-footer">
              <button className="att-btn-cancel-form" onClick={() => setEditModal(false)}>Cancel</button>
              <button className="att-btn-create" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* DELETE MODAL */}
      {deleteModal && createPortal(
        <div className="att-modal-backdrop" onClick={() => setDeleteModal(false)}>
          <div className="att-modal att-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="att-warn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 className="att-warn-title">Delete Session?</h3>
            <p className="att-warn-desc">Are you sure you want to delete <strong>"{deleteSession?.name}"</strong>? This will also delete all attendance records.</p>
            <div className="att-modal-footer">
              <button className="att-btn-cancel-form" onClick={() => setDeleteModal(false)}>Cancel</button>
              <button className="att-btn-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>, document.body
      )}

      <div className="att-page">

        {/* PAGE TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 8, padding: '10px 16px', flex: 1,
            fontSize: 13, color: '#1e40af', lineHeight: 1.5
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Create a session. Mark absent by checkbox.</span>
          </div>
          <button
            className="att-btn-create"
            onClick={() => { setFormName(''); setFormDate(today); setNewModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, paddingRight: 16, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Session
          </button>
        </div>

        {/* ATTENDANCE PANEL */}
        <div className="att-panel">

          {/* Sessions List */}
          <div className="att-sessions-card">
            <div className="att-sessions-header">
              <span className="att-sessions-title">Sessions</span>
              <span className="att-sessions-count">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="att-session-search-wrap">
              <svg className="att-session-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" className="att-session-search" placeholder="Search session..." value={sessionSearch} onChange={e => setSessionSearch(e.target.value)} />
            </div>
            <div className="att-sessions-list" ref={menuRef}>
              {loading ? (
                <div className="att-loading">Loading...</div>
              ) : filteredSessions.length === 0 ? (
                <div style={{ padding: '20px 16px', fontSize: 13, color: '#475569', fontWeight: 500 }}>No sessions found</div>
              ) : filteredSessions.map(s => (
                <div key={s.id} className={`att-session-item ${activeSession?.id === s.id ? 'active' : ''}`} onClick={() => loadSession(s)}>
                  <div className="att-session-item-top">
                    <div className="att-session-item-name">{s.name}</div>
                    <ThreeDotMenu session={s} />
                  </div>
                  <div className="att-session-item-date">{formatDate(s.date)}</div>
                  <div className={`att-session-item-pct ${s.total_members === 0 ? 'low' : pctClass(s.percentage)}`}>
                    {s.total_members === 0 ? '0%' : `${s.percentage}%`} attendance
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                    <span>Created by: <strong>{s.created_by || '—'}</strong></span>
                    {s.updated_by && (
                      <span> · Edited by: <strong>{s.updated_by}</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="att-detail-card">
            {!activeSession ? (
              <div className="att-detail-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <p>Select a session to view attendance</p>
              </div>
            ) : detailLoading ? (
              <div className="att-loading">Loading members...</div>
            ) : (
              <>
                <div className="att-detail-header">
                  <div>
                    <div className="att-detail-name">{activeSession.name}</div>
                    <div className="att-detail-date">{formatDate(activeSession.date)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="att-member-search-wrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" className="att-member-search" placeholder="Search member or ID..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                    </div>
                    <ThreeDotMenu session={activeSession} fromDetail={true} />
                  </div>
                </div>

                <div className="att-table-wrap">
                  <table className="att-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Student ID</th>
                        <th>Year</th>
                        <th>Absent</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: '#475569', fontWeight: 500, padding: '32px' }}>
                            No members found
                          </td>
                        </tr>
                      ) : filteredMembers.map(m => {
                        const isAbsent  = !!absent[m.id];
                        const isSaving  = savingId === m.id;
                        return (
                          <tr key={m.id}>
                            <td>
                              <div className="att-member-cell">
                                <div
                                  className="att-member-avatar att-member-avatar-clickable"
                                  style={{ background: m.avatarColor }}
                                  onClick={() => setProfileMember(m)}
                                  title="View profile"
                                >
                                  {getInitials(m.name)}
                                </div>
                                <div>
                                  <div className="att-member-name">{m.name}</div>
                                  <div className="att-member-dept">{m.course}</div>
                                </div>
                              </div>
                            </td>
                            <td className="att-student-id-cell">{m.student_id || '—'}</td>
                            <td className="att-year-cell">{yearLabel(m.year)}</td>
                            <td>
                              <input
                                type="checkbox"
                                className="att-absent-check"
                                checked={isAbsent}
                                disabled={isSaving}
                                onChange={e => handleAbsentToggle(m.id, e.target.checked, absent)}
                              />
                            </td>
                            <td>
                              {isSaving ? (
                                <span style={{ fontSize: 11, color: '#6b7280' }}>Saving…</span>
                              ) : isAbsent ? (
                                <span className="att-badge-absent">Absent</span>
                              ) : (
                                <span className="att-badge-present">Present</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer — counts only, no save button */}
                <div className="att-detail-footer">
                  <div className="att-footer-counts">
                    <span>Present: <strong>{presentCount}</strong></span>
                    <span>Absent: <strong>{absentCount}</strong></span>
                    <span>of <strong>{members.length}</strong></span>
                  </div>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    ✓ Changes save automatically
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdvisorLayout>
  );
}