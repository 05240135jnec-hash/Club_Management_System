import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SuperAdminLayout from './components/SuperAdminLayout';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../../styles/superadmin/usermanagement.css';

const getToken = () => sessionStorage.getItem('token');

const SYSTEM_FIELDS = [
  { key: 'name',       label: 'Full Name',   required: true  },
  { key: 'email',      label: 'Email',       required: true  },
  { key: 'student_id', label: 'Student ID',  required: false },
  { key: 'staff_id',   label: 'Staff ID',    required: false },
  { key: 'department', label: 'Department',  required: false },
  { key: 'course',     label: 'Course',      required: false },
  { key: 'year',       label: 'Year',        required: false },
];

export default function UserManagement() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [tab,          setTab]          = useState('active');
  const [toast,        setToast]        = useState({ msg:'', type:'' });
  const [uploadTab,    setUploadTab]    = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver,     setDragOver]     = useState(false);

  const [selected,     setSelected]     = useState([]);

  const [confirmModal,  setConfirmModal]  = useState(false);
  const [confirmMsg,    setConfirmMsg]    = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const [editModal,  setEditModal]  = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [editForm,   setEditForm]   = useState({ name:'', email:'', student_id:'', staff_id:'', department:'', course:'', year:'' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState('');

  const [addModal,  setAddModal]  = useState(false);
  const [addForm,   setAddForm]   = useState({ name:'', email:'', student_id:'', staff_id:'', department:'', course:'', year:'' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError,  setAddError]  = useState('');

  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos,    setMenuPos]    = useState({ top:0, left:0 });

  /* ── Reassign ── */
  const [reassignModal, setReassignModal] = useState(false);
  const [reassignUser,  setReassignUser]  = useState(null);
  const [allClubs,      setAllClubs]      = useState([]);
  const [selectedClub,  setSelectedClub]  = useState('');
  const [reassigning,   setReassigning]   = useState(false);

  const openMenu = (e, id) => {
    e.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + window.scrollY + 4, left: rect.right - 160 });
    setOpenMenuId(id);
  };

  const fileRef = useRef();

  useEffect(() => { fetchUsers(); setSelected([]); }, [tab]);

  useEffect(() => {
    const handler = e => { if (!e.target.closest('.um-menu-wrap')) setOpenMenuId(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res  = await axios.get(`/api/superadmin/users?status=${tab}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = res.data;
      const list = data.users || data.data || data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch { showToast('Failed to load users.', 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'' }), 3000);
  };

  const confirm = (msg, action) => {
    setConfirmMsg(msg);
    setConfirmAction(() => action);
    setConfirmModal(true);
  };

  const downloadExample = (e) => {
    e?.stopPropagation();
    const ws = XLSX.utils.aoa_to_sheet([
      ['name', 'email', 'student_id', 'staff_id', 'department', 'course', 'year'],
      ['Sonam Wangchuk', 'sonam@jnec.edu.bt', '02240001', '',     'Civil Engineering', 'BE Civil', '3'],
      ['Pema Lhamo',     'pema@jnec.edu.bt',  '02240002', '',     'IT Department',     'BSc IT',   '2'],
      ['Tashi Dorji',    'tashi@jnec.edu.bt', '',         'ST001','IT Department',     '',         ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'jnec_users_template.xlsx');
  };

  // ── FIXED: raw:false + cellText:true preserves leading zeros (e.g. 02240001)
  const processFile = async (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const data     = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (json.length < 2) { showToast('File is empty.', 'error'); return; }
      const headers = json[0].map(String);
      const rows    = json.slice(1).filter(r => r.some(c => c !== undefined && c !== ''));
      const autoMap = {};
      SYSTEM_FIELDS.forEach(sf => {
        const match = headers.find(h =>
          h.toLowerCase().replace(/[\s_-]/g,'') === sf.key.toLowerCase().replace(/[\s_-]/g,'') ||
          (sf.key === 'name'       && h.toLowerCase().includes('name')) ||
          (sf.key === 'email'      && (h.toLowerCase().includes('email') || h.toLowerCase().includes('mail'))) ||
          (sf.key === 'staff_id'   && (h.toLowerCase().includes('staff') || h.toLowerCase().includes('employee'))) ||
          (sf.key === 'student_id' && (h.toLowerCase().includes('student') || h.toLowerCase().includes('roll'))) ||
          (sf.key === 'department' && (h.toLowerCase().includes('dept') || h.toLowerCase().includes('department'))) ||
          (sf.key === 'course'     && (h.toLowerCase().includes('course') || h.toLowerCase().includes('program'))) ||
          (sf.key === 'year'       && (h.toLowerCase().includes('year') || h.toLowerCase().includes('semester')))
        );
        if (match) autoMap[sf.key] = match;
      });
      const mappedRows = rows.map(row => {
        const obj = {};
        SYSTEM_FIELDS.forEach(sf => {
          if (autoMap[sf.key]) {
            const idx = headers.indexOf(autoMap[sf.key]);
            obj[sf.key] = idx >= 0 ? String(row[idx] ?? '').trim() : '';
          } else { obj[sf.key] = ''; }
        });
        return obj;
      });
      setUploading(true);
      try {
        const res = await axios.post('/api/superadmin/users/bulk', { users: mappedRows }, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setUploadResult(res.data);
        showToast(`Imported ${res.data.imported || mappedRows.length} users!`);
        fetchUsers();
      } catch (err) {
        showToast(err.response?.data?.message || 'Upload failed.', 'error');
      } finally { setUploading(false); }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleFileChange = (e) => { processFile(e.target.files[0]); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); };

  const handleAddUser = async () => {
    if (!addForm.name.trim() || !addForm.email.trim()) { setAddError('Name and email are required.'); return; }
    setAddSaving(true); setAddError('');
    try {
      await axios.post('/api/superadmin/users', addForm, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast('User added!');
      setAddModal(false);
      setAddForm({ name:'', email:'', student_id:'', staff_id:'', department:'', course:'', year:'' });
      fetchUsers();
    } catch (e) { setAddError(e.response?.data?.message || 'Failed.'); }
    finally { setAddSaving(false); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name:u.name||'', email:u.email||'', student_id:u.student_id||'', staff_id:u.staff_id||'', department:u.department||'', course:u.course||'', year:u.year||'' });
    setEditError(''); setEditModal(true); setOpenMenuId(null);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) { setEditError('Name and email are required.'); return; }
    setEditSaving(true); setEditError('');
    try {
      await axios.put(`/api/superadmin/users/${editUser.id}`, editForm, { headers: { Authorization: `Bearer ${getToken()}` } });
      showToast('User updated!');
      setEditModal(false);
      fetchUsers();
    } catch (e) { setEditError(e.response?.data?.message || 'Failed.'); }
    finally { setEditSaving(false); }
  };

  const handleSoftDelete = (id) => {
    setOpenMenuId(null);
    confirm('Deactivate this user? They will be moved to Inactive.', async () => {
      try {
        await axios.put(`/api/superadmin/users/${id}/deactivate`, {}, { headers: { Authorization: `Bearer ${getToken()}` } });
        showToast('User deactivated.');
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch { showToast('Failed.', 'error'); }
    });
  };

  const handleRestore = (id) => {
    setOpenMenuId(null);
    confirm('Restore this user to Active?', async () => {
      try {
        await axios.put(`/api/superadmin/users/${id}/restore`, {}, { headers: { Authorization: `Bearer ${getToken()}` } });
        showToast('User restored!');
        setUsers(prev => prev.filter(u => u.id !== id));
        setSelected(prev => prev.filter(s => s !== id));
      } catch { showToast('Failed.', 'error'); }
    });
  };

  const handleHardDelete = (id) => {
    setOpenMenuId(null);
    confirm('Permanently delete this user? This cannot be undone!', async () => {
      try {
        await axios.delete(`/api/superadmin/users/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
        showToast('User deleted.');
        setUsers(prev => prev.filter(u => u.id !== id));
        setSelected(prev => prev.filter(s => s !== id));
      } catch { showToast('Failed.', 'error'); }
    });
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    confirm(`Permanently delete ${selected.length} selected user(s)?`, async () => {
      try {
        await Promise.all(selected.map(id =>
          axios.delete(`/api/superadmin/users/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } })
        ));
        showToast(`${selected.length} users deleted.`);
        setSelected([]);
        fetchUsers();
      } catch { showToast('Some deletions failed.', 'error'); }
    });
  };

  const openReassign = async (u) => {
    setOpenMenuId(null);
    setReassignUser(u);
    setSelectedClub('');
    try {
      const res = await axios.get('/api/clubs', { headers: { Authorization: `Bearer ${getToken()}` } });
      setAllClubs(res.data.clubs || res.data.data || res.data || []);
    } catch { setAllClubs([]); }
    setReassignModal(true);
  };

  const handleReassign = async () => {
    if (!selectedClub) return;
    setReassigning(true);
    try {
      await axios.put(`/api/superadmin/users/${reassignUser.id}/reassign-club`,
        { club_id: selectedClub },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      showToast('Club reassigned successfully!');
      setReassignModal(false);
      fetchUsers();
    } catch (e) {
      showToast(e.response?.data?.message || 'Reassign failed.', 'error');
    } finally { setReassigning(false); }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(u => u.id));

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const hasCheck = tab === 'inactive';

  return (
    <SuperAdminLayout title="User Management" subtitle="Upload and manage system users">

      <div className="um-tabs">
        <button className={`um-tab ${!uploadTab && tab==='active'?'active':''}`}   onClick={() => { setUploadTab(false); setTab('active'); }}>Active Users</button>
        <button className={`um-tab ${!uploadTab && tab==='inactive'?'active':''}`} onClick={() => { setUploadTab(false); setTab('inactive'); }}>Inactive Users</button>
        <button className={`um-tab ${uploadTab?'active':''}`}                      onClick={() => setUploadTab(true)}>Upload Users</button>
      </div>

      {!uploadTab && (
        <div className="um-card">
          <div className="um-toolbar">
            <div className="um-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              {tab === 'inactive' && selected.length > 0 && (
                <button className="um-bulk-del-btn" onClick={handleBulkDelete}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  Delete Selected ({selected.length})
                </button>
              )}
              {tab === 'active' && (
                <button className="um-add-btn" onClick={() => { setAddModal(true); setAddError(''); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add User
                </button>
              )}
            </div>
          </div>

          <div className="um-table-wrap">
            <table className="um-table">
              <thead>
                <tr>
                  {hasCheck && (
                    <th style={{width:44,paddingLeft:12,paddingRight:12}}>
                      <input type="checkbox" className="um-checkbox"
                        checked={filtered.length > 0 && selected.length === filtered.length}
                        onChange={toggleSelectAll} />
                    </th>
                  )}
                  <th className="um-col-name">Name</th>
                  <th className="um-col-email">Email</th>
                  <th className="um-col-role">Role</th>
                  <th className="um-col-id">ID</th>
                  <th className="um-col-dept">Department</th>
                  <th className="um-col-course">Course</th>
                  <th className="um-col-year">Year</th>
                  <th className="um-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={hasCheck ? 9 : 8} className="um-empty">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={hasCheck ? 9 : 8} className="um-empty">No users found.</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className={selected.includes(u.id) ? 'um-row-selected' : ''}>
                    {hasCheck && (
                      <td style={{paddingLeft:12,paddingRight:12}}>
                        <input type="checkbox" className="um-checkbox"
                          checked={selected.includes(u.id)}
                          onChange={() => toggleSelect(u.id)} />
                      </td>
                    )}
                    <td className="um-col-name">
                      <div className="um-name-wrap">
                        <div className="um-avatar">{u.name?.charAt(0).toUpperCase()}</div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="um-email um-col-email">{u.email}</td>
                    <td className="um-col-role"><span className="um-role-badge">{u.role}</span></td>
                    <td className="um-id um-col-id">{u.staff_id || u.student_id || '—'}</td>
                    <td className="um-dept um-col-dept">{u.department || '—'}</td>
                    <td className="um-dept um-col-course">{u.course || '—'}</td>
                    <td className="um-dept um-col-year">{u.year || '—'}</td>
                    <td className="um-col-actions" onClick={e => e.stopPropagation()}>
                      <div className="um-menu-wrap">
                        <button className="um-menu-btn" onClick={e => openMenu(e, u.id)}>
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
          <div className="um-footer">Showing {filtered.length} user{filtered.length!==1?'s':''}{selected.length>0?` · ${selected.length} selected`:''}</div>
        </div>
      )}

      {uploadTab && (
        <div className="um-upload-wrap">
          <div className="um-example-top">
            <span>Download the template to see the correct column format:</span>
            <button className="um-example-btn" onClick={downloadExample}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Example Excel
            </button>
          </div>
          <div className={`um-upload-zone ${dragOver?'drag-over':''} ${uploading?'uploading':''}`}
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={handleFileChange} />
            <div className="um-upload-icon">
              {uploading ? <div className="um-spinner-large"/> : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="52" height="52">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              )}
            </div>
            <div className="um-upload-title">{uploading ? 'Importing users...' : 'Click anywhere to upload'}</div>
            <div className="um-upload-sub">{uploading ? 'Please wait...' : 'or drag and drop your file here'}</div>
            <div className="um-upload-hint">Supported: .csv, .xlsx, .xls</div>
          </div>
          {uploadResult && (
            <div className="um-result-card">
              <div className="um-result-icon">✅</div>
              <div className="um-result-title">Import Complete!</div>
              <div className="um-result-stats">
                <span className="um-result-stat success">{uploadResult.imported || 0} imported</span>
                {uploadResult.skipped > 0 && <span className="um-result-stat warn">{uploadResult.skipped} skipped</span>}
                {uploadResult.errors  > 0 && <span className="um-result-stat error">{uploadResult.errors} errors</span>}
              </div>
              <button className="um-add-btn" onClick={() => { setUploadTab(false); setTab('active'); setUploadResult(null); }}>View Users →</button>
            </div>
          )}
        </div>
      )}

      {/* PORTAL DROPDOWN */}
      {openMenuId && createPortal(
        <div className="um-dropdown" style={{ position:'absolute', top:menuPos.top, left:menuPos.left }} onClick={e => e.stopPropagation()}>
          <button className="um-dd-item" onClick={() => { const u = users.find(x=>x.id===openMenuId); if(u) openEdit(u); setOpenMenuId(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          {tab === 'active' && users.find(x=>x.id===openMenuId)?.role === 'advisor' && (
            <button className="um-dd-item restore" onClick={() => { const u = users.find(x=>x.id===openMenuId); if(u) openReassign(u); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              Reassign Club
            </button>
          )}
          {tab === 'active' && (
            <button className="um-dd-item deactivate" onClick={() => handleSoftDelete(openMenuId)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Deactivate
            </button>
          )}
          {tab === 'inactive' && (
            <>
              <button className="um-dd-item restore" onClick={() => handleRestore(openMenuId)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Restore
              </button>
              <div className="um-dd-divider"/>
              <button className="um-dd-item delete" onClick={() => handleHardDelete(openMenuId)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Delete Forever
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {/* CONFIRM MODAL */}
      {confirmModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setConfirmModal(false)}>
          <div className="um-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="um-confirm-icon">⚠️</div>
            <div className="um-confirm-msg">{confirmMsg}</div>
            <div className="um-confirm-actions">
              <button className="um-modal-cancel" onClick={() => setConfirmModal(false)}>Cancel</button>
              <button className="um-confirm-ok" onClick={async () => { setConfirmModal(false); await confirmAction(); }}>Confirm</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT MODAL */}
      {editModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <span className="um-modal-title">Edit User</span>
              <button className="um-modal-close" onClick={() => setEditModal(false)}>✕</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form-row">
                <div className="um-form-group"><label>Full Name <span className="um-required">*</span></label><input type="text" value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} /></div>
                <div className="um-form-group"><label>Email <span className="um-required">*</span></label><input type="email" value={editForm.email} onChange={e => setEditForm(f=>({...f,email:e.target.value}))} /></div>
              </div>
              <div className="um-form-row">
                <div className="um-form-group"><label>Student ID</label><input type="text" value={editForm.student_id} onChange={e => setEditForm(f=>({...f,student_id:e.target.value}))} /></div>
                <div className="um-form-group"><label>Staff ID</label><input type="text" value={editForm.staff_id} onChange={e => setEditForm(f=>({...f,staff_id:e.target.value}))} /></div>
              </div>
              <div className="um-form-row">
                <div className="um-form-group"><label>Department</label><input type="text" value={editForm.department} onChange={e => setEditForm(f=>({...f,department:e.target.value}))} /></div>
                <div className="um-form-group"><label>Course</label><input type="text" value={editForm.course} onChange={e => setEditForm(f=>({...f,course:e.target.value}))} /></div>
              </div>
              <div className="um-form-row">
                <div className="um-form-group"><label>Year</label><input type="text" value={editForm.year} onChange={e => setEditForm(f=>({...f,year:e.target.value}))} /></div>
              </div>
              {editError && <div className="um-form-error">{editError}</div>}
            </div>
            <div className="um-modal-footer">
              <button className="um-modal-cancel" onClick={() => setEditModal(false)}>Cancel</button>
              <button className="um-modal-save" onClick={handleEditSave} disabled={editSaving}>{editSaving?'Saving...':'Save Changes'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD MODAL */}
      {addModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setAddModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <span className="um-modal-title">Add User</span>
              <button className="um-modal-close" onClick={() => setAddModal(false)}>✕</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form-row">
                <div className="um-form-group"><label>Full Name <span className="um-required">*</span></label><input type="text" value={addForm.name} onChange={e => setAddForm(f=>({...f,name:e.target.value}))} /></div>
                <div className="um-form-group"><label>Email <span className="um-required">*</span></label><input type="email" value={addForm.email} onChange={e => setAddForm(f=>({...f,email:e.target.value}))} /></div>
              </div>
              <div className="um-form-row">
                <div className="um-form-group"><label>Student ID</label><input type="text" value={addForm.student_id} onChange={e => setAddForm(f=>({...f,student_id:e.target.value}))} /></div>
                <div className="um-form-group"><label>Staff ID</label><input type="text" value={addForm.staff_id} onChange={e => setAddForm(f=>({...f,staff_id:e.target.value}))} /></div>
              </div>
              <div className="um-form-row">
                <div className="um-form-group"><label>Department</label><input type="text" value={addForm.department} onChange={e => setAddForm(f=>({...f,department:e.target.value}))} /></div>
                <div className="um-form-group"><label>Course</label><input type="text" value={addForm.course} onChange={e => setAddForm(f=>({...f,course:e.target.value}))} /></div>
              </div>
              <div className="um-form-row">
                <div className="um-form-group"><label>Year</label><input type="text" value={addForm.year} onChange={e => setAddForm(f=>({...f,year:e.target.value}))} /></div>
              </div>
              {addError && <div className="um-form-error">{addError}</div>}
            </div>
            <div className="um-modal-footer">
              <button className="um-modal-cancel" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="um-modal-save" onClick={handleAddUser} disabled={addSaving}>{addSaving?'Adding...':'Add User'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* REASSIGN MODAL */}
      {reassignModal && createPortal(
        <div className="um-modal-overlay" onClick={() => setReassignModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <span className="um-modal-title">Reassign Club — {reassignUser?.name}</span>
              <button className="um-modal-close" onClick={() => setReassignModal(false)}>✕</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form-group">
                <label>Select Club to Assign</label>
                <select style={{border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,color:'#1e293b',background:'#f8fafc',outline:'none',fontFamily:'inherit',width:'100%'}}
                  value={selectedClub} onChange={e => setSelectedClub(e.target.value)}>
                  <option value="">— Choose a club —</option>
                  {allClubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <p style={{fontSize:12,color:'#94a3b8',lineHeight:1.6,marginTop:8}}>
                This will reassign <strong>{reassignUser?.name}</strong> as advisor of the selected club.
              </p>
            </div>
            <div className="um-modal-footer">
              <button className="um-modal-cancel" onClick={() => setReassignModal(false)}>Cancel</button>
              <button className="um-modal-save" onClick={handleReassign} disabled={reassigning || !selectedClub}>
                {reassigning ? 'Reassigning...' : 'Reassign'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast.msg && <div className={`um-toast ${toast.type==='error'?'error':''}`}>{toast.msg}</div>}

    </SuperAdminLayout>
  );
}