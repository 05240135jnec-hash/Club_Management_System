import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import AdvisorLayout from './components/AdvisorLayout';
import '../../styles/advisor/members.css';

const AVATAR_COLORS = [
  '#7c6fcd','#4aab8a','#e07a4a','#2d5be3',
  '#d44f8a','#3aabb0','#e05c5c','#8e5be3',
  '#c0893a','#3a8fd4',
];

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getColor(userId) {
  return AVATAR_COLORS[(userId || 0) % AVATAR_COLORS.length];
}

function yearLabel(y) {
  if (!y) return '—';
  const str = String(y).replace(/year\s*/i, '').trim();
  const labels = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
  return labels[str] || `Year ${str}`;
}

function yearNumber(y) {
  if (!y) return null;
  return String(y).replace(/year\s*/i, '').trim();
}

/* ── 3-Dot Menu — uses createPortal to render dropdown on
   document.body so it NEVER expands the table or gets clipped ── */
function ThreeDotMenu({ items }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const btnRef          = useRef(null);
  const dropRef         = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        btnRef.current  && !btnRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = (e) => {
    e.stopPropagation();
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top:   rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    });
    setOpen(o => !o);
  };

  return (
    <>
      <button ref={btnRef} className="mem-threedot-btn" onClick={handleOpen} title="Options">
        <span /><span /><span />
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          className="mem-threedot-dropdown"
          style={{ position: 'fixed', top: pos.top, right: pos.right, left: 'auto', zIndex: 99999 }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              className={`mem-threedot-item${item.danger ? ' danger' : ''}`}
              onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
            >
              <span className="mem-threedot-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

/* ── Profile Modal ── */
function ProfileModal({ member, onClose }) {
  if (!member) return null;
  return (
    <div className="mem-modal-overlay" onClick={onClose}>
      <div className="mem-modal" onClick={e => e.stopPropagation()}>
        <div className="mem-modal-header">
          <span className="mem-modal-title">Student Profile</span>
          <button className="mem-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mem-modal-avatar-wrap">
          <div className="mem-modal-avatar" style={{ background: getColor(member.user_id) }}>
            {getInitials(member.name)}
          </div>
          <div className="mem-modal-name">{member.name}</div>
        </div>
        <div className="mem-modal-fields">
          {[
            { label: 'STUDENT ID',         value: member.student_id || '—' },
            { label: 'EMAIL',              value: member.email || '—' },
            { label: 'COURSE',             value: member.course || member.department || '—' },
            { label: 'YEAR',               value: yearLabel(member.year) },
            { label: 'OVERALL ATTENDANCE', value: member.overall_pct != null ? `${member.overall_pct}%` : '—' },
          ].map(f => (
            <div className="mem-modal-field" key={f.label}>
              <span className="mem-modal-field-label">{f.label}</span>
              <span className="mem-modal-field-value">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdvisorMembers() {
  const [members, setMembers]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState('active');
  const [search, setSearch]               = useState('');
  const [selectedIds, setSelectedIds]     = useState([]);
  const [yearFilter, setYearFilter]       = useState('all');
  const [profileMember, setProfileMember] = useState(null);
  const [yearModal, setYearModal]         = useState(null);
  const [yearValue, setYearValue]         = useState('Year 1');
  const [yearSaving, setYearSaving]       = useState(false);

  const token   = sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/clubs/members', { headers });
      setMembers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const activeMembers   = members.filter(m => m.status === 'active');
  const inactiveMembers = members.filter(m => m.status === 'inactive');

  const filteredActive = activeMembers.filter(m => {
    const yearOk = yearFilter === 'all' || yearNumber(m.year) === yearFilter;
    const q = search.toLowerCase();
    const qOk = !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.student_id || '').toLowerCase().includes(q) ||
      (m.course || m.department || '').toLowerCase().includes(q);
    return yearOk && qOk;
  });

  const yearCount = (yr) => activeMembers.filter(m => yearNumber(m.year) === yr).length;

  const handleUpdateYear = async () => {
    if (!yearModal) return;
    setYearSaving(true);
    try {
      await axios.put(`/api/clubs/members/${yearModal.id}/year`, { year: yearValue }, { headers });
      setMembers(prev => prev.map(m => m.id === yearModal.id ? { ...m, year: yearValue } : m));
      setYearModal(null);
      Swal.fire({ title: 'Year Updated!', text: `${yearModal.name} is now ${yearValue}.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 1800, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to update year.', 'error'); }
    setYearSaving(false);
  };

  const handleRemove = async (id, name) => {
    const member = members.find(m => m.id === id);
    if (member?.role === 'secretary') {
      Swal.fire({ icon: 'warning', title: 'Cannot Remove Member', text: 'This member is currently assigned as a Secretary. Please remove their Secretary role first before removing them from the club.', confirmButtonColor: '#2d5be3' });
      return;
    }
    const result = await Swal.fire({ title: `Remove ${name}?`, text: `${name} will be moved to Inactive Members. You can restore them anytime.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e53e3e', cancelButtonColor: '#6b7f93', confirmButtonText: 'Yes, Remove', cancelButtonText: 'Cancel', customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' }, focusCancel: true });
    if (!result.isConfirmed) return;
    try {
      await axios.put(`/api/clubs/members/${id}/remove`, {}, { headers });
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'inactive' } : m));
      setSelectedIds(prev => prev.filter(x => x !== id));
      Swal.fire({ title: 'Moved to Inactive', text: `${name} has been moved to Inactive Members.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 2000, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to remove member.', 'error'); }
  };

  const handleBulkRemove = async () => {
    const hasSecretary = members.some(m => selectedIds.includes(m.id) && m.role === 'secretary');
    if (hasSecretary) { Swal.fire({ icon: 'warning', title: 'Cannot Remove', text: 'One or more selected members are currently assigned as Secretary. Please remove their Secretary role first.', confirmButtonColor: '#2d5be3' }); return; }
    const count = selectedIds.length;
    const result = await Swal.fire({ title: `Remove ${count} Member${count > 1 ? 's' : ''}?`, text: 'They will be moved to Inactive Members.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e53e3e', cancelButtonColor: '#6b7f93', confirmButtonText: 'Yes, Move to Inactive', cancelButtonText: 'Cancel', customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' }, focusCancel: true });
    if (!result.isConfirmed) return;
    try {
      await axios.put('/api/clubs/members/bulk-remove', { ids: selectedIds }, { headers });
      setMembers(prev => prev.map(m => selectedIds.includes(m.id) ? { ...m, status: 'inactive' } : m));
      setSelectedIds([]);
      Swal.fire({ title: 'Moved to Inactive', text: `${count} member${count > 1 ? 's have' : ' has'} been moved.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 2200, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to remove members.', 'error'); }
  };

  const handleRestore = async (id, name) => {
    const result = await Swal.fire({ title: `Restore ${name}?`, text: `${name} will be moved back to Active Members.`, icon: 'question', showCancelButton: true, confirmButtonColor: '#059669', cancelButtonColor: '#6b7f93', confirmButtonText: 'Yes, Restore', cancelButtonText: 'Cancel', customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' }, focusCancel: true });
    if (!result.isConfirmed) return;
    try {
      await axios.put(`/api/clubs/members/${id}/restore`, {}, { headers });
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'active' } : m));
      Swal.fire({ title: 'Restored!', text: `${name} has been restored to Active Members.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 2000, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to restore member.', 'error'); }
  };

  const handlePermDelete = async (id, name) => {
    const result = await Swal.fire({ title: `Permanently Delete ${name}?`, text: `This cannot be undone. ${name} will be permanently removed.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e53e3e', cancelButtonColor: '#6b7f93', confirmButtonText: 'Yes, Delete Permanently', cancelButtonText: 'Cancel', customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' }, focusCancel: true });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`/api/clubs/members/${id}`, { headers });
      setMembers(prev => prev.filter(m => m.id !== id));
      Swal.fire({ title: 'Permanently Deleted', text: `${name} has been permanently removed.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 2000, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to delete member.', 'error'); }
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll    = (e)  => setSelectedIds(e.target.checked ? filteredActive.map(m => m.id) : []);
  const allChecked   = filteredActive.length > 0 && filteredActive.every(m => selectedIds.includes(m.id));
  const someChecked  = selectedIds.length > 0 && !allChecked;

  const iconYear    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>;
  const iconRemove  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>;
  const iconRestore = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>;
  const iconDelete  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;

  if (loading) return <AdvisorLayout title="Members" subtitle="View and manage club members"><div className="mem-loading">Loading members...</div></AdvisorLayout>;

  return (
    <AdvisorLayout title="Members" subtitle="View and manage club members">

      {profileMember && <ProfileModal member={profileMember} onClose={() => setProfileMember(null)} />}

      <div className="mem-stats-row">
        {[
          { key: 'all', label: 'TOTAL',    value: activeMembers.length },
          { key: '1',   label: '1ST YEAR', value: yearCount('1') },
          { key: '2',   label: '2ND YEAR', value: yearCount('2') },
          { key: '3',   label: '3RD YEAR', value: yearCount('3') },
          { key: '4',   label: '4TH YEAR', value: yearCount('4') },
        ].map(s => (
          <div key={s.key} className={`mem-stat-card${yearFilter === s.key ? ' active' : ''}`} onClick={() => { setYearFilter(s.key); setSelectedIds([]); }}>
            <div className="mem-stat-label">{s.label}</div>
            <div className="mem-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mem-tabs">
        <button className={`mem-tab-btn${tab === 'active' ? ' active' : ''}`} onClick={() => { setTab('active'); setSelectedIds([]); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Active Members <span className="mem-tab-count">{activeMembers.length}</span>
        </button>
        <button className={`mem-tab-btn${tab === 'inactive' ? ' active' : ''}`} onClick={() => { setTab('inactive'); setSelectedIds([]); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>
          Inactive Members <span className="mem-tab-count inactive">{inactiveMembers.length}</span>
        </button>
      </div>

      {tab === 'active' && (
        <>
          <div className="mem-search-wrap">
            <svg className="mem-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" className="mem-search-input" placeholder="Search member by name, ID or course..." value={search} onChange={e => { setSearch(e.target.value); setSelectedIds([]); }} />
          </div>

          {selectedIds.length > 0 && (
            <div className="mem-bulk-banner">
              <span>{selectedIds.length} member{selectedIds.length > 1 ? 's' : ''} selected</span>
              <div className="mem-bulk-actions">
                <button className="mem-btn-clear" onClick={() => setSelectedIds([])}>Clear</button>
                <button className="mem-btn-delete-all" onClick={handleBulkRemove}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  Move All to Inactive
                </button>
              </div>
            </div>
          )}

          <div className="mem-table-wrap">
            <table className="mem-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" className="mem-check" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll} />
                  </th>
                  <th>MEMBER</th>
                  <th>STUDENT ID</th>
                  <th>COURSE</th>
                  <th>OVERALL ATTENDANCE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredActive.length === 0 ? (
                  <tr><td colSpan="6"><div className="mem-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p>No members found</p></div></td></tr>
                ) : filteredActive.map(m => {
                  const pct = m.overall_pct;
                  return (
                    <tr key={m.id} className={selectedIds.includes(m.id) ? 'row-selected' : ''}>
                      <td className="col-check"><input type="checkbox" className="mem-check" checked={selectedIds.includes(m.id)} onChange={() => toggleSelect(m.id)} /></td>
                      <td>
                        <div className="mem-member-cell">
                          <div className="mem-avatar mem-avatar-clickable" style={{ background: getColor(m.user_id) }} onClick={() => setProfileMember(m)} title="View profile">{getInitials(m.name)}</div>
                          <div><div className="mem-name">{m.name}</div><div className="mem-year">{yearLabel(m.year)}</div></div>
                        </div>
                      </td>
                      <td>{m.student_id || '—'}</td>
                      <td>{m.course || m.department || '—'}</td>
                      <td>
                        {pct != null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 5, background: '#e8eaf0', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? '#16a34a' : '#dc2626', borderRadius: 3 }} /></div>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: pct >= 75 ? '#16a34a' : '#dc2626', minWidth: 34 }}>{pct}%</span>
                          </div>
                        ) : <span style={{ fontSize: 12.5, color: '#9ca3af', fontWeight: 500 }}>No data</span>}
                      </td>
                      <td>
                        <ThreeDotMenu items={[
                          { label: 'Edit Year', icon: iconYear, danger: false, onClick: () => { setYearValue(m.year || 'Year 1'); setYearModal({ id: m.id, userId: m.user_id, name: m.name, year: m.year }); } },
                          { label: 'Remove Member', icon: iconRemove, danger: true, onClick: () => handleRemove(m.id, m.name) },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'inactive' && (
        <>
          <div className="mem-info-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Members listed here have been removed from the club. You can restore them or permanently delete them.
          </div>
          <div className="mem-table-wrap">
            <table className="mem-table">
              <thead><tr><th>MEMBER</th><th>STUDENT ID</th><th>COURSE</th><th>REMOVED ON</th><th>ACTION</th></tr></thead>
              <tbody>
                {inactiveMembers.length === 0 ? (
                  <tr><td colSpan="5"><div className="mem-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p>No inactive members</p></div></td></tr>
                ) : inactiveMembers.map(m => (
                  <tr key={m.id}>
                    <td><div className="mem-member-cell"><div className="mem-avatar mem-avatar-clickable" style={{ background: getColor(m.user_id) }} onClick={() => setProfileMember(m)} title="View profile">{getInitials(m.name)}</div><div className="mem-name">{m.name}</div></div></td>
                    <td>{m.student_id || '—'}</td>
                    <td>{m.course || m.department || '—'}</td>
                    <td><span className="mem-removed-date">{m.removed_at || '—'}</span></td>
                    <td>
                      <ThreeDotMenu items={[
                        { label: 'Restore Member', icon: iconRestore, danger: false, onClick: () => handleRestore(m.id, m.name) },
                        { label: 'Delete Permanently', icon: iconDelete, danger: true, onClick: () => handlePermDelete(m.id, m.name) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {yearModal && (
        <div className="mem-modal-overlay" onClick={() => setYearModal(null)}>
          <div className="mem-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <div className="mem-modal-header">
              <span className="mem-modal-title">Edit Year</span>
              <button className="mem-modal-close" onClick={() => setYearModal(null)}>×</button>
            </div>
            <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="mem-avatar" style={{ background: getColor(yearModal.userId), width: 44, height: 44, fontSize: 16 }}>{getInitials(yearModal.name)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{yearModal.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7a8d', marginTop: 2 }}>Current: {yearLabel(yearModal.year)}</div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Select Year</label>
                <select value={yearValue} onChange={e => setYearValue(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #d1d5db', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}>
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setYearModal(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f1f5f9', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Cancel</button>
                <button onClick={handleUpdateYear} disabled={yearSaving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#172D3D', color: '#c9a84c', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: yearSaving ? 0.6 : 1 }}>{yearSaving ? 'Saving...' : 'Save Year'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdvisorLayout>
  );
}