import { useState, useEffect, useRef } from 'react';
import AdvisorLayout from './components/AdvisorLayout';
import Swal from 'sweetalert2';
import '../../styles/advisor/workplan.css';

const API = 'http://127.0.0.1:8000/api';
function getToken() { return localStorage.getItem('token'); }

function formatExt(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { label: 'PDF', cls: 'pdf' };
  if (['doc','docx'].includes(ext)) return { label: 'DOC', cls: 'doc' };
  return { label: 'FILE', cls: 'doc' };
}

export default function AdvisorWorkPlan() {
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [title, setTitle]         = useState('');
  const fileInputRef              = useRef();

  useEffect(() => { fetchPlans(); }, []);

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
    if (!selectedFile) {
      Swal.fire({ icon: 'warning', title: 'No file', text: 'Please select a file to upload.' });
      return;
    }
    if (!title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing title', text: 'Please enter a work plan title.' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',  selectedFile);
      fd.append('title', title);
      const res = await fetch(`${API}/work-plans`, {
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

  async function handleDelete(id, planTitle) {
    const result = await Swal.fire({
      title: 'Delete Work Plan?',
      html: `Are you sure you want to delete <strong>${planTitle}</strong>?<br>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/work-plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Work plan deleted.', timer: 1500, showConfirmButton: false });
        fetchPlans();
      }
    } catch {}
  }

  return (
    <AdvisorLayout title="Upload Work Plan" subtitle="Submit club work plans">
      <div className="wp-page">

        {/* ── UPLOAD CARD ── */}
        <div className="wp-card">
          <div className="wp-card-title">Upload New Work Plan</div>
          <div className="wp-card-sub">Upload your work plan file. It will be visible to all club members.</div>

          {/* DROP ZONE */}
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
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

          {/* TITLE INPUT */}
          <div className="wp-form-group">
            <label className="wp-label">Work Plan Title</label>
            <input
              className="wp-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* VISIBILITY BANNER */}
          <div className="wp-visibility-banner">
            <div className="wp-banner-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="wp-banner-text">
              <span className="wp-banner-title">Visible to all club members</span>
              <span className="wp-banner-sub">Once uploaded, all students in your club can view this work plan</span>
            </div>
          </div>

          {/* UPLOAD BUTTON */}
          <div className="wp-upload-row">
            <button className="wp-upload-btn" onClick={handleUpload} disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              {uploading ? 'Uploading…' : 'Upload Work Plan'}
            </button>
          </div>
        </div>

        {/* ── TABLE CARD ── */}
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
                    <th>Visible To</th>
                    <th>Action</th>
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
                              <span className="wp-file-date">{p.created_at}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="wp-visible-badge">Club Members</span>
                        </td>
                        <td>
                          <button
                            className="wp-delete-btn"
                            onClick={e => { e.stopPropagation(); handleDelete(p.id, p.title); }}
                          >
                            Delete
                          </button>
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
    </AdvisorLayout>
  );
}