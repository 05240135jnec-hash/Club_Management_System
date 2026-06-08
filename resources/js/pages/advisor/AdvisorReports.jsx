import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AdvisorLayout from './components/AdvisorLayout';
import Swal from 'sweetalert2';
import '../../styles/advisor/report.css';

const API = '/api';
function getToken() { return sessionStorage.getItem('token'); }

function formatExt(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { label: 'PDF', cls: 'pdf' };
  if (['doc','docx'].includes(ext)) return { label: 'DOC', cls: 'doc' };
  if (['xls','xlsx'].includes(ext)) return { label: 'XLS', cls: 'xls' };
  return { label: 'FILE', cls: 'doc' };
}

export default function AdvisorReports() {
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [activeTab, setActiveTab]       = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const [auditEnabled, setAuditEnabled] = useState(false);
  const [openMenuId, setOpenMenuId]     = useState(null);
  const [menuPos, setMenuPos]           = useState({ top: 0, right: 0 });
  const [editModal, setEditModal]       = useState(false);
  const [editReport, setEditReport]     = useState(null);
  const [editForm, setEditForm]         = useState({ title: '', type: '', sent_to: 'dsa' });
  const [form, setForm]                 = useState({ title: '', type: '', sent_to: 'dsa' });
  const [feedbackModal, setFeedbackModal]   = useState(false);
  const [feedbackReport, setFeedbackReport] = useState(null);
  const [feedbacks, setFeedbacks]           = useState([]);
  const [loadingFb, setLoadingFb]           = useState(false);
  const [feedbackCounts, setFeedbackCounts] = useState({});
  const fileInputRef                    = useRef();

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (!e.target.closest('.rpt-menu-wrap') && !e.target.closest('.rpt-menu-dropdown')) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { setOpenMenuId(null); setEditModal(false); setFeedbackModal(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/reports`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const reportList = Array.isArray(data.reports) ? data.reports : [];
      setReports(reportList);
      setAuditEnabled(data.audit_report_enabled === true);
      const auditReports = reportList.filter(r => r.is_audit);
      fetchFeedbackCounts(auditReports);
    } catch { setReports([]); }
    setLoading(false);
  }

  async function fetchFeedbackCounts(auditReports) {
    const counts = {};
    await Promise.allSettled(
      auditReports.map(async r => {
        try {
          const res = await fetch(`${API}/audit-reports/${r.id}/feedback`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          const data = await res.json();
          counts[r.id] = data.total || 0;
        } catch { counts[r.id] = 0; }
      })
    );
    setFeedbackCounts(counts);
  }

  async function viewFeedbacks(report) {
    setOpenMenuId(null);
    setFeedbackReport(report);
    setFeedbackModal(true);
    setLoadingFb(true);
    try {
      const res = await fetch(`${API}/audit-reports/${report.id}/feedback`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
    } catch { setFeedbacks([]); }
    setLoadingFb(false);
  }

  function handleFileSelect(file) {
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowed.includes(file.type)) {
      Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Only PDF, Word and Excel files are allowed.' });
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

  const isAuditType = form.type === 'Audit Report';

  async function handleUpload() {
    if (!form.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing title', text: 'Please enter a report title.' });
      return;
    }
    if (!form.type) {
      Swal.fire({ icon: 'warning', title: 'Missing type', text: 'Please select a report type.' });
      return;
    }
    if (!selectedFile) {
      Swal.fire({ icon: 'warning', title: 'No file', text: 'Please select a file to upload.' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',     selectedFile);
      fd.append('title',    form.title);
      fd.append('type',     form.type);
      fd.append('is_audit', isAuditType ? '1' : '0');
      if (!isAuditType) fd.append('sent_to', form.sent_to);
      const res  = await fetch(`${API}/reports`, {
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

  function openEdit(r) {
    setOpenMenuId(null);
    setEditReport(r);
    setEditForm({ title: r.title, type: r.type, sent_to: r.sent_to || 'dsa' });
    setEditModal(true);
  }

  async function saveEdit() {
    if (!editForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing title', text: 'Please enter a report title.' });
      return;
    }
    if (!editForm.type) {
      Swal.fire({ icon: 'warning', title: 'Missing type', text: 'Please select a report type.' });
      return;
    }
    setSaving(true);
    try {
      const isEditAudit = editForm.type === 'Audit Report';
      const res = await fetch(`${API}/reports/${editReport.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title:   editForm.title,
          type:    editForm.type,
          sent_to: isEditAudit ? 'dsa' : editForm.sent_to,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
        setEditModal(false);
        fetchReports();
      } else {
        Swal.fire({ icon: 'error', title: 'Update failed', text: data.message || 'Something went wrong.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' });
    }
    setSaving(false);
  }

  async function handleForward(id, title) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: 'Forward to DSA?',
      html: `Forward <strong>${title}</strong> to DSA office?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d5be3',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Forward',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/reports/${id}/forward`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Forwarded!', timer: 1800, showConfirmButton: false });
        fetchReports();
      }
    } catch {}
  }

  async function handleDelete(id, title) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: 'Delete Report?',
      html: `Delete <strong>${title}</strong>? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
        fetchReports();
      }
    } catch {}
  }

  function openMenu(e, id) {
    e.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4;
    setMenuPos({ top, right: window.innerWidth - rect.right });
    setOpenMenuId(id);
  }

  function filteredReports() {
    if (activeTab === 'all')       return reports.filter(r =>
      (r.role === 'advisor') ||
      (r.role === 'secretary' && (r.sent_to === 'advisor' || r.is_audit))
    );
    if (activeTab === 'me')        return reports.filter(r => r.sent_to === 'me' && !r.forwarded_to_dsa && r.role === 'advisor');
    if (activeTab === 'dsa')       return reports.filter(r => r.forwarded_to_dsa && !r.is_audit);
    if (activeTab === 'secretary') return reports.filter(r => r.role === 'secretary' && r.sent_to === 'advisor');
    if (activeTab === 'audit')     return reports.filter(r => r.is_audit);
    return reports;
  }

  const SEND_TO_HINTS = {
    dsa: 'Submitted officially to DSA office for review',
    me:  'Saved privately — only visible to you',
  };

  const tabs = [
    { key: 'all',       label: 'All Files' },
    { key: 'me',        label: 'Only Me' },
    { key: 'dsa',       label: 'Submitted to DSA' },
    { key: 'secretary', label: 'Submitted by Secretary' },
    ...(auditEnabled ? [{ key: 'audit', label: 'Audit Report', isAudit: true }] : []),
  ];

  const REPORT_TYPES = [
    'Annual Report', 'Event Report',
    'Activity Report',
    ...(auditEnabled ? ['Audit Report'] : []),
  ];

  const currentReport = reports.find(r => r.id === openMenuId);

  return (
    <AdvisorLayout title="Upload Reports" subtitle="Submit club reports">
      <div className="rpt-page">

        {/* UPLOAD CARD */}
        <div className="rpt-card">
          <div className="rpt-card-title">Upload New Report</div>
          <div className="rpt-card-sub">Fill in the details and upload a file to submit your report.</div>

          <div className="rpt-form-row">
            <div className="rpt-form-group">
              <label className="rpt-label">Report Title <span className="rpt-label-required">*</span></label>
              <input
                className="rpt-input"
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="rpt-form-group">
              <label className="rpt-label">Report Type <span className="rpt-label-required">*</span></label>
              <select
                className="rpt-input"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select type...</option>
                {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

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
              <div className="rpt-drop-sub">PDF, Word, Excel</div>
              <div className="rpt-drop-limit">MAX FILE SIZE: 30MB</div>
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
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            style={{ display: 'none' }}
            onChange={e => handleFileSelect(e.target.files[0])}
          />

          {selectedFile && !isAuditType && (
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

          {isAuditType && selectedFile && (
            <div className="rpt-audit-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              This audit report will be visible to all logged in users.
            </div>
          )}

          <div className="rpt-upload-row">
            <button className="rpt-upload-btn" onClick={handleUpload} disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              {uploading ? 'Uploading...' : 'Upload Report'}
            </button>
          </div>
        </div>

        {/* REPORTS TABLE CARD */}
        <div className="rpt-card rpt-table-card">
          <div className="rpt-table-header">
            <div className="rpt-card-title">Club Reports</div>
          </div>

          <div className="rpt-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`rpt-tab${activeTab === tab.key ? ' active' : ''}${tab.isAudit ? ' audit-tab' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
                    {activeTab === 'audit' && <th>Feedbacks</th>}
                    <th style={{ width: 52 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports().map(r => {
                    const ext = formatExt(r.file_name);
                    const fbCount = feedbackCounts[r.id] || 0;
                    return (
                      <tr
                        key={r.id}
                        className="rpt-clickable-row"
                        onClick={() => window.open(r.file_url, '_blank')}
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
                          {r.is_audit ? (
                            <span className="rpt-badge audit">Student</span>
                          ) : (
                            <span className={`rpt-badge ${r.forwarded_to_dsa ? 'dsa' : 'me'}`}>
                              {r.forwarded_to_dsa ? 'DSA' : 'Only Me'}
                            </span>
                          )}
                        </td>
                        {activeTab === 'audit' && (
                          <td onClick={e => e.stopPropagation()}>
                            <button
                              className="rpt-fb-count-btn"
                              onClick={() => viewFeedbacks(r)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                              {fbCount} {fbCount === 1 ? 'feedback' : 'feedbacks'}
                            </button>
                          </td>
                        )}
                        <td onClick={e => e.stopPropagation()}>
                          <div className="rpt-menu-wrap">
                            <button className="rpt-menu-btn" onClick={e => openMenu(e, r.id)}>
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
      {openMenuId && currentReport && createPortal(
        <div className="rpt-menu-dropdown" style={{ top: menuPos.top, right: menuPos.right, position: 'fixed' }}>
          <a href={currentReport.file_url} target="_blank" rel="noreferrer"
            className="rpt-menu-item" onClick={() => setOpenMenuId(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View
          </a>
          {currentReport.is_audit && (
            <button className="rpt-menu-item" onClick={() => viewFeedbacks(currentReport)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              View Feedbacks
            </button>
          )}
          <button className="rpt-menu-item" onClick={() => openEdit(currentReport)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          {!currentReport.is_audit && !currentReport.forwarded_to_dsa && (
            <button className="rpt-menu-item forward" onClick={() => handleForward(currentReport.id, currentReport.title)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <polyline points="15 17 20 12 15 7"/>
                <path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
              </svg>
              Forward to DSA
            </button>
          )}
          <button className="rpt-menu-item delete" onClick={() => handleDelete(currentReport.id, currentReport.title)}>
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
      {editModal && editReport && createPortal(
        <div className="rpt-modal-backdrop" onClick={() => setEditModal(false)}>
          <div className="rpt-modal" onClick={e => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h3 className="rpt-modal-title">Edit Report</h3>
              <button className="rpt-modal-close" onClick={() => setEditModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="rpt-modal-body">
              <div className="rpt-form-group">
                <label className="rpt-label">Report Title <span className="rpt-label-required">*</span></label>
                <input
                  className="rpt-input"
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="rpt-form-group">
                <label className="rpt-label">Report Type <span className="rpt-label-required">*</span></label>
                <select
                  className="rpt-input"
                  value={editForm.type}
                  onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                >
                  <option value="">Select type...</option>
                  {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {editForm.type !== 'Audit Report' && (
                <div className="rpt-form-group">
                  <label className="rpt-label">Send To</label>
                  <select
                    className="rpt-input"
                    value={editForm.sent_to}
                    onChange={e => setEditForm({ ...editForm, sent_to: e.target.value })}
                    disabled={editReport.forwarded_to_dsa}
                  >
                    <option value="dsa">DSA</option>
                    <option value="me">Only Me</option>
                  </select>
                </div>
              )}
            </div>
            <div className="rpt-modal-footer">
              <button className="rpt-btn-cancel" onClick={() => setEditModal(false)}>Cancel</button>
              <button className="rpt-btn-save" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FEEDBACK MODAL */}
      {feedbackModal && feedbackReport && createPortal(
        <div className="rpt-modal-backdrop" onClick={() => setFeedbackModal(false)}>
          <div className="rpt-modal rpt-fb-modal" onClick={e => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <div>
                <h3 className="rpt-modal-title">Student Feedbacks</h3>
                <div className="rpt-fb-modal-sub">{feedbackReport.title}</div>
              </div>
              <button className="rpt-modal-close" onClick={() => setFeedbackModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="rpt-fb-modal-body">
              {loadingFb ? (
                <div className="rpt-fb-loading">Loading feedbacks...</div>
              ) : feedbacks.length === 0 ? (
                <div className="rpt-fb-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  No feedbacks yet from students.
                </div>
              ) : (
                <div className="rpt-fb-list">
                  {feedbacks.map((fb, i) => (
                    <div key={fb.id} className="rpt-fb-item">
                      <div className="rpt-fb-item-header">
                        <div className="rpt-fb-avatar">{i + 1}</div>
                        <div className="rpt-fb-item-meta">
                          <span className="rpt-fb-name">Anonymous Student</span>
                          <span className="rpt-fb-date">{fb.created_at}</span>
                        </div>
                      </div>
                      <div className="rpt-fb-text">{fb.feedback}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rpt-modal-footer">
              <div className="rpt-fb-total">
                {feedbacks.length} {feedbacks.length === 1 ? 'feedback' : 'feedbacks'} received
              </div>
              <button className="rpt-btn-cancel" onClick={() => setFeedbackModal(false)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </AdvisorLayout>
  );
}