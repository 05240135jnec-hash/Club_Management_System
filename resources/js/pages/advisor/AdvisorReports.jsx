import { useState, useEffect, useRef } from 'react';
import AdvisorLayout from './components/AdvisorLayout';
import Swal from 'sweetalert2';
import '../../styles/advisor/report.css';

const API = 'http://127.0.0.1:8000/api';
function getToken() { return localStorage.getItem('token'); }

function formatExt(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { label: 'PDF', cls: 'pdf' };
  if (['doc','docx'].includes(ext)) return { label: 'DOC', cls: 'doc' };
  return { label: 'FILE', cls: 'doc' };
}

export default function AdvisorReports() {
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [activeTab, setActiveTab]     = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [form, setForm]               = useState({ title: '', type: '', sent_to: 'dsa' });
  const fileInputRef                  = useRef();

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/reports`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch { setReports([]); }
    setLoading(false);
  }

  function handleFileSelect(file) {
    if (!file) return;
    const allowed = ['application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
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
    if (!form.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing title', text: 'Please enter a report title.' });
      return;
    }
    if (!form.type) {
      Swal.fire({ icon: 'warning', title: 'Missing type', text: 'Please select a report type.' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',    selectedFile);
      fd.append('title',   form.title);
      fd.append('type',    form.type);
      fd.append('sent_to', form.sent_to);
      const res = await fetch(`${API}/reports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Uploaded!', text: 'Report uploaded successfully.', timer: 1800, showConfirmButton: false });
        setForm({ title: '', type: '', sent_to: 'dsa' });
        removeFile();
        fetchReports();
      } else {
        Swal.fire({ icon: 'error', title: 'Upload failed', text: data.message || 'Something went wrong.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' });
    }
    setUploading(false);
  }

  async function handleForward(id, title) {
    const result = await Swal.fire({
      title: 'Forward to DSA?',
      html: `Are you sure you want to forward <strong>${title}</strong> to the DSA office?<br>This action cannot be undone.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d5be3',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Forward',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/reports/${id}/forward`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Forwarded!', text: 'Report forwarded to DSA.', timer: 1800, showConfirmButton: false });
        fetchReports();
      }
    } catch {}
  }

  async function handleDelete(id, title) {
    const result = await Swal.fire({
      title: 'Delete Report?',
      html: `Are you sure you want to delete <strong>${title}</strong>?<br>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Report deleted.', timer: 1500, showConfirmButton: false });
        fetchReports();
      }
    } catch {}
  }

  function filteredReports() {
    if (activeTab === 'all')       return reports;
    if (activeTab === 'me')        return reports.filter(r => r.sent_to === 'me' && !r.forwarded_to_dsa);
    if (activeTab === 'dsa')       return reports.filter(r => r.forwarded_to_dsa);
    if (activeTab === 'secretary') return reports.filter(r => r.role === 'secretary');
    return reports;
  }

  const SEND_TO_HINTS = {
    dsa: 'Submitted officially to DSA office for review',
    me:  'Saved privately — only visible to you',
  };

  return (
    <AdvisorLayout title="Upload Reports" subtitle="Submit club reports">
      <div className="rpt-page">

        {/* ── UPLOAD CARD ── */}
        <div className="rpt-card">
          <div className="rpt-card-title">Upload New Report</div>
          <div className="rpt-card-sub">Upload a file then choose who can see it.</div>

          {/* DROP ZONE */}
          {!selectedFile ? (
            <div
              className={`rpt-drop-zone${dragOver ? ' dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
            >
              <div className="rpt-drop-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
              </div>
              <div className="rpt-drop-title">Click to upload or drag &amp; drop</div>
              <div className="rpt-drop-sub">PDF or Word files</div>
            </div>
          ) : (
            <div className="rpt-file-preview">
              <div className={`rpt-file-icon ${formatExt(selectedFile.name).cls}`}>
                {formatExt(selectedFile.name).label}
              </div>
              <div className="rpt-file-info">
                <span className="rpt-file-name">{selectedFile.name}</span>
                <span className="rpt-file-size">{formatSize(selectedFile.size)}</span>
              </div>
              <button className="rpt-file-remove" onClick={removeFile}>
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

          {/* SEND TO */}
          {selectedFile && (
            <div className="rpt-send-row">
              <span className="rpt-send-label">Send To:</span>
              <select
                className="rpt-send-select"
                value={form.sent_to}
                onChange={e => setForm({ ...form, sent_to: e.target.value })}
              >
                <option value="dsa">DSA</option>
                <option value="me">Only Me</option>
              </select>
              <span className="rpt-send-hint">{SEND_TO_HINTS[form.sent_to]}</span>
            </div>
          )}

          {/* FORM ROW */}
          <div className="rpt-form-row">
            <div className="rpt-form-group">
              <label className="rpt-label">Report Title</label>
              <input
                className="rpt-input"
                type="text"
                placeholder=""
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="rpt-form-group">
              <label className="rpt-label">Report Type</label>
              <select
                className="rpt-input"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select type…</option>
                <option>Annual Report</option>
                <option>Semester Report</option>
                <option>Event Report</option>
                <option>Financial Report</option>
                <option>Activity Report</option>
              </select>
            </div>
          </div>

          <div className="rpt-upload-row">
            <button className="rpt-upload-btn" onClick={handleUpload} disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              {uploading ? 'Uploading…' : 'Upload Report'}
            </button>
          </div>
        </div>

        {/* ── REPORTS TABLE CARD ── */}
        <div className="rpt-card rpt-table-card">
          <div className="rpt-table-header">
            <div className="rpt-card-title" style={{ marginBottom: 0 }}>Club Reports</div>
          </div>

          {/* TABS */}
          <div className="rpt-tabs">
            {[
              { key: 'all',       label: 'All Files' },
              { key: 'me',        label: 'Only Me' },
              { key: 'dsa',       label: 'Submitted to DSA' },
              { key: 'secretary', label: 'Submitted by Secretary' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`rpt-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className="rpt-table-wrap">
            {loading ? (
              <div className="rpt-empty">Loading...</div>
            ) : filteredReports().length === 0 ? (
              <div className="rpt-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                No reports found in this category.
              </div>
            ) : (
              <table className="rpt-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Type</th>
                    <th>Sent To</th>
                    <th>Forward to DSA</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports().map(r => {
                    const ext = formatExt(r.file_name);
                    return (
                      <tr key={r.id}
                        className="rpt-clickable-row"
                        onClick={() => window.open(r.file_url, '_blank')}
                        style={{cursor:'pointer'}}
                      >
                        <td>
                          <div className="rpt-file-cell">
                            <div className={`rpt-tbl-icon ${ext.cls}`}>{ext.label}</div>
                            <div className="rpt-file-meta">
                              <span className="rpt-file-title">{r.title}</span>
                              <span className="rpt-file-fname">{r.file_name}</span>
                              <span className="rpt-file-date">{r.created_at}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="rpt-type-text">{r.type}</span></td>
                        <td>
                          <span className={`rpt-badge ${r.forwarded_to_dsa ? 'dsa' : 'me'}`}>
                            {r.forwarded_to_dsa ? 'DSA' : 'Only Me'}
                          </span>
                        </td>
                        <td>
                          {r.forwarded_to_dsa ? (
                            <button className="rpt-fwd-btn forwarded" disabled onClick={e => e.stopPropagation()}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <polyline points="15 17 20 12 15 7"/>
                                <path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
                              </svg>
                              Forwarded
                            </button>
                          ) : (
                            <button className="rpt-fwd-btn" onClick={e => { e.stopPropagation(); handleForward(r.id, r.title); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <polyline points="15 17 20 12 15 7"/>
                                <path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
                              </svg>
                              Forward
                            </button>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <a
                              href={r.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rpt-action-btn view"
                              onClick={e => e.stopPropagation()}
                            >
                              View
                            </a>
                            <button
                              className="rpt-action-btn delete"
                              onClick={e => { e.stopPropagation(); handleDelete(r.id, r.title); }}
                            >
                              Delete
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
    </AdvisorLayout>
  );
}