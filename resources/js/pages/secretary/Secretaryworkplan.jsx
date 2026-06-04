import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SecretaryLayout from './components/SecretaryLayout';
import Swal from 'sweetalert2';
import '../../styles/secretary/workplan.css';

const API = '/api';
function getToken() { return sessionStorage.getItem('token'); }

function formatExt(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { label: 'PDF', cls: 'pdf' };
  if (['doc','docx'].includes(ext)) return { label: 'DOC', cls: 'doc' };
  return { label: 'FILE', cls: 'doc' };
}

export default function SecretaryWorkPlan() {
  const [plans, setPlans]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const [title, setTitle]               = useState('');
  const [openMenuId, setOpenMenuId]     = useState(null);
  const [menuPos, setMenuPos]           = useState({ top: 0, right: 0 });
  const [editModal, setEditModal]       = useState(false);
  const [editPlan, setEditPlan]         = useState(null);
  const [editTitle, setEditTitle]       = useState('');
  const fileInputRef                    = useRef();

  useEffect(() => { fetchPlans(); }, []);

  useEffect(() => {
    function handler(e) {
      if (!e.target.closest('.wp-menu-wrap') && !e.target.closest('.wp-menu-dropdown')) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { setOpenMenuId(null); setEditModal(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function fetchPlans() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/work-plans`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setPlans(Array.isArray(data.work_plans) ? data.work_plans : []);
    } catch { setPlans([]); }
    setLoading(false);
  }

  function handleFileSelect(file) {
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Only PDF and Word files are allowed.' });
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'File too large', text: 'Max file size is 30MB.' });
      return;
    }
    setSelectedFile(file);
  }

  function removeFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function formatSize(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  async function handleUpload() {
    if (!title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing title', text: 'Please enter a work plan title.' });
      return;
    }
    if (!selectedFile) {
      Swal.fire({ icon: 'warning', title: 'No file', text: 'Please select a file to upload.' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',  selectedFile);
      fd.append('title', title);
      const res  = await fetch(`${API}/work-plans`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Uploaded!', text: 'Work plan uploaded successfully.', timer: 1800, showConfirmButton: false });
        setTitle('');
        removeFile();
        fetchPlans();
      } else {
        Swal.fire({ icon: 'error', title: 'Upload failed', text: data.message || 'Something went wrong.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' });
    }
    setUploading(false);
  }

  function openMenu(e, id) {
    e.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 130;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4;
    setMenuPos({ top, right: window.innerWidth - rect.right });
    setOpenMenuId(id);
  }

  function openEdit(plan) {
    setOpenMenuId(null);
    setEditPlan(plan);
    setEditTitle(plan.title);
    setEditModal(true);
  }

  async function saveEdit() {
    if (!editTitle.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing title', text: 'Please enter a title.' });
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`${API}/work-plans/${editPlan.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ title: editTitle }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
        setEditModal(false);
        fetchPlans();
      } else {
        Swal.fire({ icon: 'error', title: 'Update failed', text: data.message || 'Something went wrong.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' });
    }
    setSaving(false);
  }

  async function handleDelete(id, planTitle) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: 'Delete Work Plan?',
      html: `Delete <strong>${planTitle}</strong>? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/work-plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
        fetchPlans();
      }
    } catch {}
  }

  const currentPlan = plans.find(p => p.id === openMenuId);

  return (
    <SecretaryLayout title="Upload Work Plan" subtitle="Submit club work plans">
      <div className="wp-page">

        {/* UPLOAD CARD */}
        <div className="wp-card">
          <div className="wp-card-title">Upload New Work Plan</div>
          <div className="wp-card-sub">Fill in the details and upload a file.</div>

          <div className="wp-form-group">
            <label className="wp-label">Work Plan Title</label>
            <input
              className="wp-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {!selectedFile ? (
            <div
              className={`wp-drop-zone${dragOver ? ' dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
            >
              <div className="wp-drop-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
              </div>
              <div className="wp-drop-title">Click to upload or drag &amp; drop</div>
              <div className="wp-drop-sub">PDF or Word files</div>
              <div className="wp-drop-limit">MAX FILE SIZE: 30MB</div>
            </div>
          ) : (
            <div className="wp-file-preview">
              <div className={`wp-file-icon ${formatExt(selectedFile.name).cls}`}>
                {formatExt(selectedFile.name).label}
              </div>
              <div className="wp-file-info">
                <span className="wp-file-name">{selectedFile.name}</span>
                <span className="wp-file-size">{formatSize(selectedFile.size)}</span>
              </div>
              <button className="wp-file-remove" onClick={removeFile}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={e => handleFileSelect(e.target.files[0])}
          />

          <div className="wp-upload-row">
            <button className="wp-upload-btn" onClick={handleUpload} disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              {uploading ? 'Uploading...' : 'Upload Work Plan'}
            </button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="wp-card wp-table-card">
          <div className="wp-table-header">
            <div className="wp-card-title" style={{ marginBottom: 0 }}>Uploaded Work Plans</div>
          </div>
          <div className="wp-table-wrap">
            {loading ? (
              <div className="wp-empty">Loading...</div>
            ) : plans.length === 0 ? (
              <div className="wp-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                No work plans uploaded yet.
              </div>
            ) : (
              <table className="wp-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Posted By</th>
                    <th>Date</th>
                    <th style={{ width: 52 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(p => {
                    const ext = formatExt(p.file_name);
                    return (
                      <tr
                        key={p.id}
                        className="wp-clickable-row"
                        onClick={() => window.open(p.file_url, '_blank')}
                      >
                        <td>
                          <div className="wp-file-cell">
                            <div className={`wp-tbl-icon ${ext.cls}`}>{ext.label}</div>
                            <div className="wp-file-meta">
                              <span className="wp-file-title">{p.title}</span>
                              <span className="wp-file-fname">{p.file_name} · {p.file_size}</span>
                              {p.updated_by && (
                                <span className="wp-file-edited">Edited by: {p.updated_by}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="wp-col-text">{p.uploaded_by || '—'}</span>
                        </td>
                        <td>
                          <span className="wp-col-text">{p.created_at}</span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="wp-menu-wrap">
                            <button
                              className="wp-menu-btn"
                              onClick={e => openMenu(e, p.id)}
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <circle cx="12" cy="5" r="1.5"/>
                                <circle cx="12" cy="12" r="1.5"/>
                                <circle cx="12" cy="19" r="1.5"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* 3 DOT MENU PORTAL */}
      {openMenuId && currentPlan && createPortal(
        <div
          className="wp-menu-dropdown"
          style={{ top: menuPos.top, right: menuPos.right, position: 'fixed' }}
        >
          <button
            className="wp-menu-item"
            onClick={() => { window.open(currentPlan.file_url, '_blank'); setOpenMenuId(null); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View
          </button>
          <button
            className="wp-menu-item"
            onClick={() => openEdit(currentPlan)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button
            className="wp-menu-item wp-menu-delete"
            onClick={() => handleDelete(currentPlan.id, currentPlan.title)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
            </svg>
            Delete
          </button>
        </div>,
        document.body
      )}

      {/* EDIT MODAL */}
      {editModal && editPlan && createPortal(
        <div className="wp-modal-backdrop" onClick={() => setEditModal(false)}>
          <div className="wp-modal" onClick={e => e.stopPropagation()}>
            <div className="wp-modal-header">
              <h3 className="wp-modal-title">Edit Work Plan</h3>
              <button className="wp-modal-close" onClick={() => setEditModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="wp-modal-body">
              <div className="wp-form-group" style={{ marginBottom: 0 }}>
                <label className="wp-label">Work Plan Title</label>
                <input
                  className="wp-input"
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="wp-modal-footer">
              <button className="wp-btn-cancel" onClick={() => setEditModal(false)}>Cancel</button>
              <button className="wp-btn-save" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </SecretaryLayout>
  );
}