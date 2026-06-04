import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import SuperAdminLayout from './components/SuperAdminLayout';
import Swal from 'sweetalert2';
import '../../styles/superadmin/allclubs.css';

const API = '/api/superadmin';
const getToken = () => sessionStorage.getItem('token');

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AllClubs() {
  const navigate = useNavigate();
  const [clubs,         setClubs]         = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('active');
  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState('');
  const [totalActive,   setTotalActive]   = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const [openMenuId,    setOpenMenuId]    = useState(null);
  const [menuPos,       setMenuPos]       = useState({ top:0, left:0 });

  const [editModal,       setEditModal]       = useState(false);
  const [editClub,        setEditClub]        = useState(null);
  const [editName,        setEditName]        = useState('');
  const [editCategory,    setEditCategory]    = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving,      setEditSaving]      = useState(false);

  const [createModal,    setCreateModal]    = useState(false);
  const [createName,     setCreateName]     = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createAdvisor,  setCreateAdvisor]  = useState('');
  const [createSaving,   setCreateSaving]   = useState(false);
  const [createErrors,   setCreateErrors]   = useState({});
  const [advisorSearch,  setAdvisorSearch]  = useState('');

  const [changeAdvisorModal,  setChangeAdvisorModal]  = useState(false);
  const [changeAdvisorClub,   setChangeAdvisorClub]   = useState(null);
  const [newAdvisorId,        setNewAdvisorId]        = useState('');
  const [changeAdvisorSearch, setChangeAdvisorSearch] = useState('');
  const [changeAdvisorSaving, setChangeAdvisorSaving] = useState(false);

  useEffect(() => {
    fetchClubs();
    fetchCategories();
    fetchUsers();
  }, [tab]);

  useEffect(() => {
    const handler = e => {
      if (!e.target.closest('.ac-menu-wrap')) setOpenMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  async function fetchClubs() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/clubs?status=${tab}`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      setClubs(data.clubs || []);
      setTotalActive(data.total_active || 0);
      setTotalInactive(data.total_inactive || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchCategories() {
    try {
      const res  = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      const list = data.categories || data.data || data || [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) { console.error(err); }
  }

  async function fetchUsers() {
    try {
      const res  = await fetch(`${API}/users`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      const list = data.users || data.data || data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) { console.error(err); }
  }

  function handleTabSwitch(t) {
    setTab(t); setSearch(''); setCategory(''); setOpenMenuId(null);
  }

  function openMenu(e, clubId) {
    e.stopPropagation();
    if (openMenuId === clubId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + window.scrollY + 4, left: rect.right - 148 });
    setOpenMenuId(clubId);
  }

  function openEdit(club) {
    setEditClub(club);
    setEditName(club.name);
    setEditCategory(club.category);
    setEditDescription(club.description || '');
    setEditModal(true);
    setOpenMenuId(null);
  }

  async function handleEditSave() {
    if (!editName.trim() || !editCategory.trim()) {
      Swal.fire({ icon:'warning', title:'Missing fields', text:'Name and category are required.' });
      return;
    }
    setEditSaving(true);
    try {
      const res  = await fetch(`${API}/clubs/${editClub.id}`, {
        method: 'PUT',
        headers: { Authorization:`Bearer ${getToken()}`, Accept:'application/json', 'Content-Type':'application/json' },
        body: JSON.stringify({ name:editName, category:editCategory, description:editDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon:'success', title:'Updated!', timer:1500, showConfirmButton:false });
        setEditModal(false); fetchClubs();
      } else {
        Swal.fire({ icon:'error', title:'Error', text:data.message || 'Update failed.' });
      }
    } catch {
      Swal.fire({ icon:'error', title:'Error', text:'Could not connect to server.' });
    }
    setEditSaving(false);
  }

  async function handleCreateClub() {
    const errors = {};
    if (!createName.trim())     errors.name     = true;
    if (!createCategory.trim()) errors.category = true;
    if (!createAdvisor)         errors.advisor  = true;
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setCreateSaving(true);
    try {
      const res  = await fetch(`${API}/clubs/create`, {
        method: 'POST',
        headers: { Authorization:`Bearer ${getToken()}`, Accept:'application/json', 'Content-Type':'application/json' },
        body: JSON.stringify({ name: createName, category: createCategory, advisor_id: createAdvisor }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon:'success', title:'Club Created!', text:`${createName} has been created and advisor has been notified by email.`, timer:2500, showConfirmButton:false });
        setCreateModal(false);
        setCreateName(''); setCreateCategory(''); setCreateAdvisor(''); setAdvisorSearch('');
        fetchClubs();
      } else {
        Swal.fire({ icon:'error', title:'Error', text:data.message || 'Failed to create club.' });
      }
    } catch {
      Swal.fire({ icon:'error', title:'Error', text:'Could not connect to server.' });
    }
    setCreateSaving(false);
  }

  function openChangeAdvisor(club) {
    setChangeAdvisorClub(club);
    setNewAdvisorId('');
    setChangeAdvisorSearch('');
    setChangeAdvisorModal(true);
    setOpenMenuId(null);
  }

  async function handleChangeAdvisor() {
    if (!newAdvisorId) { Swal.fire({ icon:'warning', title:'Please select a new advisor' }); return; }
    setChangeAdvisorSaving(true);
    try {
      const res  = await fetch(`${API}/clubs/${changeAdvisorClub.id}/change-advisor`, {
        method: 'PUT',
        headers: { Authorization:`Bearer ${getToken()}`, Accept:'application/json', 'Content-Type':'application/json' },
        body: JSON.stringify({ advisor_id: newAdvisorId }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon:'success', title:'Advisor Changed!', text:'New advisor has been notified by email.', timer:2000, showConfirmButton:false });
        setChangeAdvisorModal(false);
        fetchClubs();
      } else {
        Swal.fire({ icon:'error', title:'Error', text:data.message || 'Failed to change advisor.' });
      }
    } catch {
      Swal.fire({ icon:'error', title:'Error', text:'Could not connect to server.' });
    }
    setChangeAdvisorSaving(false);
  }

  const filteredChangeUsers = users.filter(u => {
    const q = changeAdvisorSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });
  const selectedNewAdvisor = users.find(u => String(u.id) === String(newAdvisorId));

  async function handleDeactivate(club) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title:`Deactivate ${club.name}?`, text:'Club will be moved to Inactive. You can restore it anytime.',
      icon:'warning', showCancelButton:true, confirmButtonColor:'#e53e3e',
      cancelButtonColor:'#6b7280', confirmButtonText:'Yes, Deactivate',
    });
    if (!result.isConfirmed) return;
    try {
      const res  = await fetch(`${API}/clubs/${club.id}/deactivate`, {
        method:'PUT', headers:{ Authorization:`Bearer ${getToken()}`, Accept:'application/json' },
      });
      const data = await res.json();
      if (res.ok) { Swal.fire({ icon:'success', title:'Deactivated!', text:data.message, timer:1800, showConfirmButton:false }); fetchClubs(); }
      else Swal.fire({ icon:'error', title:'Error', text:data.message });
    } catch { Swal.fire({ icon:'error', title:'Error', text:'Could not connect.' }); }
  }

  async function handleRestore(club) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title:`Restore ${club.name}?`, text:'Club will be moved back to Active.',
      icon:'question', showCancelButton:true, confirmButtonColor:'#16a34a',
      cancelButtonColor:'#6b7280', confirmButtonText:'Yes, Restore',
    });
    if (!result.isConfirmed) return;
    try {
      const res  = await fetch(`${API}/clubs/${club.id}/restore`, {
        method:'PUT', headers:{ Authorization:`Bearer ${getToken()}`, Accept:'application/json' },
      });
      const data = await res.json();
      if (res.ok) { Swal.fire({ icon:'success', title:'Restored!', text:data.message, timer:1800, showConfirmButton:false }); fetchClubs(); }
      else Swal.fire({ icon:'error', title:'Error', text:data.message });
    } catch { Swal.fire({ icon:'error', title:'Error', text:'Could not connect.' }); }
  }

  async function handleDelete(club) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title:`Permanently Delete ${club.name}?`, text:'This cannot be undone.',
      icon:'warning', showCancelButton:true, confirmButtonColor:'#e53e3e',
      cancelButtonColor:'#6b7280', confirmButtonText:'Yes, Delete Forever',
    });
    if (!result.isConfirmed) return;
    try {
      const res  = await fetch(`${API}/clubs/${club.id}`, {
        method:'DELETE', headers:{ Authorization:`Bearer ${getToken()}`, Accept:'application/json' },
      });
      const data = await res.json();
      if (res.ok) { Swal.fire({ icon:'success', title:'Deleted!', text:data.message, timer:1800, showConfirmButton:false }); fetchClubs(); }
      else Swal.fire({ icon:'error', title:'Error', text:data.message });
    } catch { Swal.fire({ icon:'error', title:'Error', text:'Could not connect.' }); }
  }

  const filtered = clubs.filter(c => {
    const q = search.toLowerCase();
    const matchSearch   = c.name.toLowerCase().includes(q) || (c.advisor?.name||'').toLowerCase().includes(q);
    const matchCategory = !category || c.category === category;
    return matchSearch && matchCategory;
  });

  const filteredUsers = users.filter(u => {
    const q = advisorSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const selectedAdvisor = users.find(u => String(u.id) === String(createAdvisor));

  return (
    <SuperAdminLayout title="All Clubs" subtitle="Browse and manage clubs">
      <div className="ac-page">
        <div className="ac-card">

          {/* TABS */}
          <div className="ac-tabs">
            <button className={`ac-tab ${tab==='active'?'active':''}`} onClick={() => handleTabSwitch('active')}>
              Active Clubs <span className="ac-tab-count">{totalActive}</span>
            </button>
            <button className={`ac-tab ${tab==='inactive'?'active':''}`} onClick={() => handleTabSwitch('inactive')}>
              Inactive Clubs <span className="ac-tab-count inactive">{totalInactive}</span>
            </button>
          </div>

          {/* TOOLBAR */}
          <div className="ac-toolbar">
            <div className="ac-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search clubs or advisor..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="ac-toolbar-right">
              <div className="ac-select-wrap">
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id || c.name} value={c.name || c}>{c.name || c}</option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <button className="ac-create-btn" onClick={() => { setCreateModal(true); setCreateErrors({}); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Club
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="ac-table-wrap">
            <table className="ac-table">
              <thead>
                <tr>
                  <th className="ac-col-name">Club Name</th>
                  <th>Category</th>
                  <th>Members</th>
                  <th>Advisor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="ac-empty">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="ac-empty">{tab==='inactive'?'No inactive clubs':'No clubs found'}</td></tr>
                ) : filtered.map(club => (
                  <tr key={club.id} className={`ac-row ${tab==='inactive'?'inactive':''}`}
                    onClick={() => navigate(`/superadmin/clubs/${club.id}`)}>
                    <td className="ac-col-name">
                      <div className="ac-club-name-wrap">
                        <div className="ac-club-avatar">{getInitials(club.name)}</div>
                        <span className="ac-club-name">{club.name}</span>
                      </div>
                    </td>
                    <td><span className="ac-cat-badge">{club.category}</span></td>
                    <td className="ac-members">{club.member_count} member{club.member_count!==1?'s':''}</td>
                    <td className="ac-advisor">{club.advisor?.name || '—'}</td>
                    <td className="ac-actions-cell" onClick={e => e.stopPropagation()}>
                      <div className="ac-menu-wrap">
                        <button className="ac-menu-btn" onClick={e => openMenu(e, club.id)}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ac-footer">
            <span>Showing {filtered.length} club{filtered.length!==1?'s':''}</span>
          </div>
        </div>
      </div>

      {/* 3 DOT DROPDOWN PORTAL */}
      {openMenuId && createPortal(
        <div className="ac-dropdown" style={{ top:menuPos.top, left:menuPos.left }} onClick={e => e.stopPropagation()}>
          <button className="ac-dd-item view" onClick={() => { setOpenMenuId(null); navigate(`/superadmin/clubs/${openMenuId}`); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View Club
          </button>
          <button className="ac-dd-item edit" onClick={() => { const club = clubs.find(c => c.id===openMenuId); if (club) openEdit(club); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Club
          </button>
          <button className="ac-dd-item change-advisor" onClick={() => { const club = clubs.find(c => c.id===openMenuId); if (club) openChangeAdvisor(club); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Change Advisor
          </button>
          <div className="ac-dd-divider"/>
          {tab==='active' ? (
            <button className="ac-dd-item deactivate" onClick={() => { const club = clubs.find(c => c.id===openMenuId); if (club) handleDeactivate(club); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Deactivate
            </button>
          ) : (
            <>
              <button className="ac-dd-item restore" onClick={() => { const club = clubs.find(c => c.id===openMenuId); if (club) handleRestore(club); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Restore
              </button>
              <div className="ac-dd-divider"/>
              <button className="ac-dd-item delete" onClick={() => { const club = clubs.find(c => c.id===openMenuId); if (club) handleDelete(club); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Delete Forever
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {/* EDIT MODAL */}
      {editModal && createPortal(
        <div className="ac-modal-backdrop" onClick={() => setEditModal(false)}>
          <div className="ac-modal" onClick={e => e.stopPropagation()}>
            <div className="ac-modal-header">
              <span className="ac-modal-title">Edit Club</span>
              <button className="ac-modal-close" onClick={() => setEditModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-form-group">
                <label className="ac-form-label">Club Name <span style={{color:'#ef4444'}}>*</span></label>
                <input className="ac-form-input" type="text" value={editName} onChange={e => setEditName(e.target.value)} maxLength={255} />
              </div>
              <div className="ac-form-group">
                <label className="ac-form-label">Category <span style={{color:'#ef4444'}}>*</span></label>
                <select className="ac-form-input" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                  <option value="">— Select category —</option>
                  {categories.map(c => <option key={c.id||c.name} value={c.name||c}>{c.name||c}</option>)}
                </select>
              </div>
              <div className="ac-form-group">
                <label className="ac-form-label">Description</label>
                <textarea className="ac-form-textarea" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4} />
              </div>
            </div>
            <div className="ac-modal-footer">
              <button className="ac-modal-cancel" onClick={() => setEditModal(false)}>Cancel</button>
              <button className="ac-modal-save" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE CLUB MODAL */}
      {createModal && createPortal(
        <div className="ac-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ac-modal" onClick={e => e.stopPropagation()}>
            <div className="ac-modal-header">
              <span className="ac-modal-title">Create Club</span>
              <button className="ac-modal-close" onClick={() => setCreateModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-form-group">
                <label className="ac-form-label">Club Name <span style={{color:'#ef4444'}}>*</span></label>
                <input className={`ac-form-input ${createErrors.name?'ac-input-error':''}`} type="text" placeholder="e.g. Media Club" value={createName} onChange={e => setCreateName(e.target.value)} />
                {createErrors.name && <span className="ac-field-error">Club name is required</span>}
              </div>
              <div className="ac-form-group">
                <label className="ac-form-label">Category <span style={{color:'#ef4444'}}>*</span></label>
                <select className={`ac-form-input ${createErrors.category?'ac-input-error':''}`} value={createCategory} onChange={e => setCreateCategory(e.target.value)}>
                  <option value="">— Select category —</option>
                  {categories.map(c => <option key={c.id||c.name} value={c.name||c}>{c.name||c}</option>)}
                </select>
                {createErrors.category && <span className="ac-field-error">Category is required</span>}
              </div>
              <div className="ac-form-group">
                <label className="ac-form-label">Assign Advisor <span style={{color:'#ef4444'}}>*</span></label>
                <div className={`ac-advisor-search-wrap ${createErrors.advisor?'ac-input-error':''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search by name or email..." value={advisorSearch} onChange={e => { setAdvisorSearch(e.target.value); setCreateAdvisor(''); }} />
                </div>
                {createErrors.advisor && <span className="ac-field-error">Please select an advisor</span>}
                {selectedAdvisor && (
                  <div className="ac-selected-advisor">
                    <div className="ac-sa-avatar">{selectedAdvisor.name?.charAt(0).toUpperCase()}</div>
                    <div className="ac-sa-info">
                      <span className="ac-sa-name">{selectedAdvisor.name}</span>
                      <span className="ac-sa-email">{selectedAdvisor.email}</span>
                    </div>
                    <button className="ac-sa-remove" onClick={() => { setCreateAdvisor(''); setAdvisorSearch(''); }}>✕</button>
                  </div>
                )}
                {advisorSearch && !selectedAdvisor && (
                  <div className="ac-advisor-dropdown">
                    {filteredUsers.length === 0 ? (
                      <div className="ac-advisor-dd-empty">No users found</div>
                    ) : filteredUsers.slice(0,8).map(u => (
                      <div key={u.id} className="ac-advisor-dd-item" onClick={() => { setCreateAdvisor(String(u.id)); setAdvisorSearch(''); }}>
                        <div className="ac-sa-avatar" style={{width:30,height:30,fontSize:12}}>{u.name?.charAt(0).toUpperCase()}</div>
                        <div className="ac-sa-info">
                          <span className="ac-sa-name">{u.name}</span>
                          <span className="ac-sa-email">{u.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="ac-create-note">
                📌 The assigned advisor will receive an email notification. Their role will automatically change to <strong>Advisor</strong>. The club will appear on the public page once the advisor adds aim and description.
              </div>
            </div>
            <div className="ac-modal-footer">
              <button className="ac-modal-cancel" onClick={() => setCreateModal(false)}>Cancel</button>
              <button className="ac-modal-save" onClick={handleCreateClub} disabled={createSaving}>
                {createSaving ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CHANGE ADVISOR MODAL */}
      {changeAdvisorModal && createPortal(
        <div className="ac-modal-backdrop" onClick={() => setChangeAdvisorModal(false)}>
          <div className="ac-modal" onClick={e => e.stopPropagation()}>
            <div className="ac-modal-header">
              <span className="ac-modal-title">Change Advisor — {changeAdvisorClub?.name}</span>
              <button className="ac-modal-close" onClick={() => setChangeAdvisorModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="ac-modal-body">
              {changeAdvisorClub?.advisor && (
                <div className="ac-current-advisor">
                  <span className="ac-ca-label">Current Advisor:</span>
                  <span className="ac-ca-name">{changeAdvisorClub.advisor.name}</span>
                  <span className="ac-ca-email">{changeAdvisorClub.advisor.email}</span>
                </div>
              )}
              <div className="ac-form-group" style={{marginTop:16}}>
                <label className="ac-form-label">Select New Advisor <span style={{color:'#ef4444'}}>*</span></label>
                <div className="ac-advisor-search-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search by name or email..." value={changeAdvisorSearch} onChange={e => { setChangeAdvisorSearch(e.target.value); setNewAdvisorId(''); }} />
                </div>
                {selectedNewAdvisor && (
                  <div className="ac-selected-advisor">
                    <div className="ac-sa-avatar">{selectedNewAdvisor.name?.charAt(0).toUpperCase()}</div>
                    <div className="ac-sa-info">
                      <span className="ac-sa-name">{selectedNewAdvisor.name}</span>
                      <span className="ac-sa-email">{selectedNewAdvisor.email}</span>
                    </div>
                    <button className="ac-sa-remove" onClick={() => { setNewAdvisorId(''); setChangeAdvisorSearch(''); }}>✕</button>
                  </div>
                )}
                {changeAdvisorSearch && !selectedNewAdvisor && (
                  <div className="ac-advisor-dropdown">
                    {filteredChangeUsers.length === 0 ? (
                      <div className="ac-advisor-dd-empty">No users found</div>
                    ) : filteredChangeUsers.slice(0,8).map(u => (
                      <div key={u.id} className="ac-advisor-dd-item" onClick={() => { setNewAdvisorId(String(u.id)); setChangeAdvisorSearch(''); }}>
                        <div className="ac-sa-avatar" style={{width:30,height:30,fontSize:12}}>{u.name?.charAt(0).toUpperCase()}</div>
                        <div className="ac-sa-info">
                          <span className="ac-sa-name">{u.name}</span>
                          <span className="ac-sa-email">{u.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="ac-create-note" style={{marginTop:14}}>
                📌 The old advisor's role will change back to <strong>Student</strong>. The new advisor will be notified by email.
              </div>
            </div>
            <div className="ac-modal-footer">
              <button className="ac-modal-cancel" onClick={() => setChangeAdvisorModal(false)}>Cancel</button>
              <button className="ac-modal-save" onClick={handleChangeAdvisor} disabled={changeAdvisorSaving}>
                {changeAdvisorSaving ? 'Changing...' : 'Change Advisor'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </SuperAdminLayout>
  );
}