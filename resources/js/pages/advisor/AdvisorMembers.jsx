import React, { useState, useEffect } from 'react';
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

// Handles "Year 2", "2", 2 → "2nd Year"
function yearLabel(y) {
  if (!y) return '—';
  const str = String(y).replace(/year\s*/i, '').trim();
  const labels = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
  return labels[str] || `Year ${str}`;
}

// Extract numeric string from "Year 2" or "2" or 2
function yearNumber(y) {
  if (!y) return null;
  return String(y).replace(/year\s*/i, '').trim();
}

export default function AdvisorMembers() {
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('active');
  const [search, setSearch]           = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [yearFilter, setYearFilter]   = useState('all');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://127.0.0.1:8000/api/clubs/members', { headers });
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
      (m.department || '').toLowerCase().includes(q);
    return yearOk && qOk;
  });

  const yearCount = (yr) =>
    activeMembers.filter(m => yearNumber(m.year) === yr).length;

  const handleRemove = async (id, name) => {
    const result = await Swal.fire({
      title: `Remove ${name}?`,
      text: `${name} will be moved to Inactive Members. You can restore them anytime.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#6b7f93',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' },
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    try {
      await axios.put(`http://127.0.0.1:8000/api/clubs/members/${id}/remove`, {}, { headers });
      await fetchMembers();
      Swal.fire({ title: 'Moved to Inactive', text: `${name} has been moved to Inactive Members.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 2000, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to remove member.', 'error'); }
  };

  const handleBulkRemove = async () => {
    const count = selectedIds.length;
    const result = await Swal.fire({
      title: `Remove ${count} Member${count > 1 ? 's' : ''}?`,
      text: 'They will be moved to Inactive Members. You can restore them anytime.',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#e53e3e', cancelButtonColor: '#6b7f93',
      confirmButtonText: 'Yes, Move to Inactive', cancelButtonText: 'Cancel',
      customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' }, focusCancel: true,
    });
    if (!result.isConfirmed) return;
    try {
      await axios.put('http://127.0.0.1:8000/api/clubs/members/bulk-remove', { ids: selectedIds }, { headers });
      setSelectedIds([]);
      await fetchMembers();
      Swal.fire({ title: 'Moved to Inactive', text: `${count} member${count > 1 ? 's have' : ' has'} been moved to Inactive Members.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 2200, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to remove members.', 'error'); }
  };

  const handleRestore = async (id, name) => {
    const result = await Swal.fire({
      title: `Restore ${name}?`, text: `${name} will be moved back to Active Members.`,
      icon: 'question', showCancelButton: true, confirmButtonColor: '#059669', cancelButtonColor: '#6b7f93',
      confirmButtonText: 'Yes, Restore', cancelButtonText: 'Cancel',
      customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' }, focusCancel: true,
    });
    if (!result.isConfirmed) return;
    try {
      await axios.put(`http://127.0.0.1:8000/api/clubs/members/${id}/restore`, {}, { headers });
      await fetchMembers();
      Swal.fire({ title: 'Restored!', text: `${name} has been restored to Active Members.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 2000, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to restore member.', 'error'); }
  };

  const handlePermDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Permanently Delete ${name}?`, text: `This cannot be undone. ${name} will be permanently removed from the club.`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#e53e3e', cancelButtonColor: '#6b7f93',
      confirmButtonText: 'Yes, Delete Permanently', cancelButtonText: 'Cancel',
      customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' }, focusCancel: true,
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/clubs/members/${id}`, { headers });
      await fetchMembers();
      Swal.fire({ title: 'Permanently Deleted', text: `${name} has been permanently removed.`, icon: 'success', confirmButtonColor: '#2d5be3', timer: 2000, timerProgressBar: true, customClass: { popup: 'swal-custom-popup', title: 'swal-custom-title' } });
    } catch { Swal.fire('Error', 'Failed to delete member.', 'error'); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = (e) => {
    setSelectedIds(e.target.checked ? filteredActive.map(m => m.id) : []);
  };
  const allChecked = filteredActive.length > 0 && filteredActive.every(m => selectedIds.includes(m.id));
  const someChecked = selectedIds.length > 0 && !allChecked;

  if (loading) {
    return (
      <AdvisorLayout title="Members" subtitle="View and manage club members">
        <div className="mem-loading">Loading members...</div>
      </AdvisorLayout>
    );
  }

  return (
    <AdvisorLayout title="Members" subtitle="View and manage club members">

      {/* Stats Row */}
      <div className="mem-stats-row">
        {[
          { key: 'all', label: 'TOTAL',    value: activeMembers.length },
          { key: '1',   label: '1ST YEAR', value: yearCount('1') },
          { key: '2',   label: '2ND YEAR', value: yearCount('2') },
          { key: '3',   label: '3RD YEAR', value: yearCount('3') },
          { key: '4',   label: '4TH YEAR', value: yearCount('4') },
        ].map(s => (
          <div key={s.key} className={`mem-stat-card${yearFilter === s.key ? ' active' : ''}`}
            onClick={() => { setYearFilter(s.key); setSelectedIds([]); }}>
            <div className="mem-stat-label">{s.label}</div>
            <div className="mem-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mem-tabs">
        <button className={`mem-tab-btn${tab === 'active' ? ' active' : ''}`} onClick={() => { setTab('active'); setSelectedIds([]); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Active Members
          <span className="mem-tab-count">{activeMembers.length}</span>
        </button>
        <button className={`mem-tab-btn${tab === 'inactive' ? ' active' : ''}`} onClick={() => { setTab('inactive'); setSelectedIds([]); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/>
          </svg>
          Inactive Members
          <span className="mem-tab-count inactive">{inactiveMembers.length}</span>
        </button>
      </div>

      {/* Active Tab */}
      {tab === 'active' && (
        <>
          <div className="mem-search-wrap">
            <svg className="mem-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" className="mem-search-input" placeholder="Search member by name, ID or department..."
              value={search} onChange={e => { setSearch(e.target.value); setSelectedIds([]); }} />
          </div>

          {selectedIds.length > 0 && (
            <div className="mem-bulk-banner">
              <span>{selectedIds.length} member{selectedIds.length > 1 ? 's' : ''} selected</span>
              <div className="mem-bulk-actions">
                <button className="mem-btn-clear" onClick={() => setSelectedIds([])}>Clear</button>
                <button className="mem-btn-delete-all" onClick={handleBulkRemove}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Move All to Inactive
                </button>
              </div>
            </div>
          )}

          {/* Active Table — STATUS column REMOVED */}
          <div className="mem-table-wrap">
            <table className="mem-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" className="mem-check" checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll} />
                  </th>
                  <th>MEMBER</th>
                  <th>STUDENT ID</th>
                  <th>DEPARTMENT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredActive.length === 0 ? (
                  <tr><td colSpan="5">
                    <div className="mem-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <p>No members found</p>
                    </div>
                  </td></tr>
                ) : filteredActive.map(m => (
                  <tr key={m.id} className={selectedIds.includes(m.id) ? 'row-selected' : ''}>
                    <td className="col-check">
                      <input type="checkbox" className="mem-check" checked={selectedIds.includes(m.id)} onChange={() => toggleSelect(m.id)} />
                    </td>
                    <td>
                      <div className="mem-member-cell">
                        <div className="mem-avatar" style={{ background: getColor(m.user_id) }}>{getInitials(m.name)}</div>
                        <div>
                          <div className="mem-name">{m.name}</div>
                          <div className="mem-year">{yearLabel(m.year)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{m.student_id || '—'}</td>
                    <td>{m.department || '—'}</td>
                    <td><button className="mem-btn-remove" onClick={() => handleRemove(m.id, m.name)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Inactive Tab — YEAR column REMOVED */}
      {tab === 'inactive' && (
        <>
          <div className="mem-info-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Members listed here have been removed from the club. You can restore them or permanently delete them.
          </div>
          <div className="mem-table-wrap">
            <table className="mem-table">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>STUDENT ID</th>
                  <th>DEPARTMENT</th>
                  <th>REMOVED ON</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {inactiveMembers.length === 0 ? (
                  <tr><td colSpan="5">
                    <div className="mem-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <p>No inactive members</p>
                    </div>
                  </td></tr>
                ) : inactiveMembers.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="mem-member-cell">
                        <div className="mem-avatar" style={{ background: getColor(m.user_id) }}>{getInitials(m.name)}</div>
                        <div className="mem-name">{m.name}</div>
                      </div>
                    </td>
                    <td>{m.student_id || '—'}</td>
                    <td>{m.department || '—'}</td>
                    <td><span className="mem-removed-date">{m.removed_at || '—'}</span></td>
                    <td>
                      <div className="mem-action-group">
                        <button className="mem-btn-restore" onClick={() => handleRestore(m.id, m.name)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                          </svg>
                          Restore
                        </button>
                        <button className="mem-btn-perm-delete" onClick={() => handlePermDelete(m.id, m.name)} title="Permanently Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </AdvisorLayout>
  );
}