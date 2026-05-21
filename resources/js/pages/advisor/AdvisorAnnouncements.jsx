import { useState, useEffect, useRef } from 'react';
import AdvisorLayout from './components/AdvisorLayout';
import Swal from 'sweetalert2';
import '../../styles/advisor/announcement.css';

const API = 'http://127.0.0.1:8000/api';

function getToken() {
  return localStorage.getItem('token');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isImageFile(url) {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname;
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(pathname);
  } catch(e) {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
  }
}

function getRecipientLabel(recipients) {
  if (recipients === 'students') return 'To: All Students';
  if (recipients === 'both') return 'To: Members & Students';
  return 'To: Members';
}

export default function AdvisorAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  // recipients: 'members' | 'students' | 'both'
  const [form, setForm] = useState({
    title: '', type: 'general', content: '', recipients: 'members',
  });

  const [editForm, setEditForm] = useState({
    title: '', type: 'general', content: '', recipients: 'members',
  });

  useEffect(() => {
    fetchAnnouncements();
    const handler = (e) => {
      if (!e.target.closest('.dot-menu-wrap')) setOpenMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      // backend returns { announcements: [...], total: n }
      const list = data.announcements || data.data || (Array.isArray(data) ? data : []);
      setAnnouncements(list);
    } catch (e) {
      setAnnouncements([]);
    }
    setLoading(false);
  }

  function handleFileSelect(file) {
    if (!file) return;
    setSelectedFile(file);
    if (isImageFile(file.name)) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  function removeFile() {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('type', form.type);
      fd.append('content', form.content);
      fd.append('recipients', form.recipients); // 'members' | 'students' | 'both'
      if (selectedFile) fd.append('attachment', selectedFile);

      const res = await fetch(`${API}/announcements`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (res.ok) {
        setForm({ title: '', type: 'general', content: '', recipients: 'members' });
        removeFile();
        fetchAnnouncements();
      } else {
        const err = await res.json();
        console.error('Post error:', err);
      }
    } catch (e) {
      console.error(e);
    }
    setPosting(false);
  }

  async function handleDelete(id) {
    const result = await Swal.fire({
      title: 'Delete Announcement?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Announcement has been deleted.', timer: 1500, showConfirmButton: false });
        fetchAnnouncements();
      }
    } catch (e) {}
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editItem) return;
    try {
      const res = await fetch(`${API}/announcements/${editItem.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          type: editForm.type,
          content: editForm.content,
          recipients: editForm.recipients,
        }),
      });
      if (res.ok) {
        setEditItem(null);
        fetchAnnouncements();
        Swal.fire({ icon: 'success', title: 'Updated!', text: 'Announcement updated successfully.', timer: 1500, showConfirmButton: false });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update announcement.' });
      }
    } catch (e) {}
  }

  function openEdit(item) {
    setEditItem(item);
    setEditForm({
      title: item.title || '',
      type: item.type || 'general',
      content: item.content || '',
      recipients: item.recipients || 'members',
    });
    setOpenMenuId(null);
  }

  function getTypeBadgeClass(type) {
    if (type === 'event') return 'type-badge event';
    if (type === 'reminder') return 'type-badge reminder';
    return 'type-badge general';
  }

  const filtered = announcements.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdvisorLayout title="Announcements" subtitle="Manage and post club announcements">
      <div className="ann-page">

        {/* ── POST FORM ── */}
        <div className="announce-card">
          <div className="card-title">Post Announcement</div>
          <form onSubmit={handlePost}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                className="form-textarea"
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>

            {/* FILE UPLOAD */}
            <div className="form-group">
              <label className="form-label">
                Attachment <span className="label-optional">(optional)</span>
              </label>
              {!selectedFile ? (
                <div
                  className={`file-drop-zone${dragOver ? ' dragover' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileSelect(f);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4"/>
                  </svg>
                  <span className="drop-text">
                    Drag & drop or <span className="browse-link">browse</span>
                  </span>
                  <span className="drop-hint">JPG, PNG, PDF, DOCX up to 10MB</span>
                </div>
              ) : (
                <div className="file-selected-preview">
                  {filePreview ? (
                    <img src={filePreview} alt="preview" className="file-thumb-preview" />
                  ) : (
                    <div className="file-icon-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                  )}
                  <div className="file-selected-info">
                    <span className="file-selected-name">{selectedFile.name}</span>
                    <span className="file-selected-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button type="button" className="file-remove-btn" onClick={removeFile}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files[0])}
              />
            </div>

            {/* SEND TO */}
            <div className="form-bottom">
              <div className="send-to-wrap">
                <span className="send-to-label">Send to:</span>
                <label className="radio-wrap">
                  <input
                    type="radio"
                    name="recipients"
                    value="members"
                    checked={form.recipients === 'members'}
                    onChange={() => setForm({ ...form, recipients: 'members' })}
                  />
                  <span className="radio-circle" />
                  Members only
                </label>
                <label className="radio-wrap">
                  <input
                    type="radio"
                    name="recipients"
                    value="students"
                    checked={form.recipients === 'students'}
                    onChange={() => setForm({ ...form, recipients: 'students' })}
                  />
                  <span className="radio-circle" />
                  All Students
                </label>
                <label className="radio-wrap">
                  <input
                    type="radio"
                    name="recipients"
                    value="both"
                    checked={form.recipients === 'both'}
                    onChange={() => setForm({ ...form, recipients: 'both' })}
                  />
                  <span className="radio-circle" />
                  Both
                </label>
              </div>
              <button type="submit" className="post-btn" disabled={posting}>
                {posting ? 'Posting…' : 'Post Announcement'}
              </button>
            </div>
          </form>
        </div>

        {/* ── HISTORY ── */}
        <div className="announce-card">
          <div className="history-header">
            <div className="card-title" style={{ marginBottom: 0 }}>Announcement History</div>
            <div className="history-search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Search announcements..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="ann-empty">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="ann-empty">No announcements yet.</div>
          ) : (
            <div className="ann-card-list">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="ann-history-card"
                  onClick={() => setViewItem(item)}
                >
                  <div className="ann-hcard-main">
                    <div className="ann-hcard-title">{item.title}</div>
                    <div className="ann-hcard-desc">
                      {item.content?.length > 100
                        ? item.content.slice(0, 100) + '…'
                        : item.content}
                    </div>
                    <div className="ann-hcard-bottom-row">
                      <div className="ann-hcard-footer">
                        <span className={getTypeBadgeClass(item.type)}>
                          {(item.type || 'general').toUpperCase()}
                        </span>
                        <div className="ann-hcard-meta">
                          <span className="ann-hcard-recipient">
                            {getRecipientLabel(item.recipients)}
                          </span>
                          <span className="ann-hcard-date">{item.date_sent || formatDate(item.created_at)}</span>
                        </div>
                      </div>
                      {item.attachment && isImageFile(item.attachment) && (
                        <div className="ann-hcard-thumb">
                          <img src={item.attachment} alt="attachment" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="dot-menu-wrap" onClick={e => e.stopPropagation()}>
                    <button
                      className="dot-menu-btn"
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                    >⋯</button>
                    {openMenuId === item.id && (
                      <div className="dot-menu-dropdown">
                        <button className="dot-menu-item edit" onClick={() => openEdit(item)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </button>
                        <button
                          className="dot-menu-item delete"
                          onClick={() => { setOpenMenuId(null); handleDelete(item.id); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── VIEW POPUP ── */}
        {viewItem && (
          <div className="ann-modal-backdrop" onClick={() => setViewItem(null)}>
            <div className="ann-view-modal" onClick={e => e.stopPropagation()}>
              {viewItem.attachment && isImageFile(viewItem.attachment) && (
                <div className="ann-view-img-wrap">
                  <img src={viewItem.attachment} alt="attachment" className="ann-view-img" />
                </div>
              )}
              <div className="ann-view-body">
                <div className="ann-view-meta-row">
                  <span className={getTypeBadgeClass(viewItem.type)}>
                    {(viewItem.type || 'general').toUpperCase()}
                  </span>
                  <span className="ann-view-date">{viewItem.date_sent || formatDate(viewItem.created_at)}</span>
                </div>
                <div className="ann-view-title">{viewItem.title}</div>
                <div className="ann-view-divider" />
                <div className="ann-view-content">{viewItem.content}</div>
                {viewItem.attachment && !isImageFile(viewItem.attachment) && (
                  <a
                    href={viewItem.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="ann-view-download"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Attachment
                  </a>
                )}
              </div>
              <button className="ann-view-close" onClick={() => setViewItem(null)}>✕</button>
            </div>
          </div>
        )}

        {/* ── EDIT MODAL ── */}
        {editItem && (
          <div className="ann-modal-backdrop" onClick={() => setEditItem(null)}>
            <div className="ann-edit-modal" onClick={e => e.stopPropagation()}>
              <div className="ann-edit-header">
                <span className="ann-edit-title">Edit Announcement</span>
                <button className="ann-edit-close" onClick={() => setEditItem(null)}>✕</button>
              </div>
              <form onSubmit={handleEdit} className="ann-edit-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    className="form-input"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-textarea"
                    value={editForm.content}
                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                    required
                  />
                </div>
                <div className="send-to-wrap" style={{ marginBottom: 18 }}>
                  <span className="send-to-label">Send to:</span>
                  <label className="radio-wrap">
                    <input type="radio" name="edit-recipients" value="members"
                      checked={editForm.recipients === 'members'}
                      onChange={() => setEditForm({ ...editForm, recipients: 'members' })}
                    />
                    <span className="radio-circle" /> Members only
                  </label>
                  <label className="radio-wrap">
                    <input type="radio" name="edit-recipients" value="students"
                      checked={editForm.recipients === 'students'}
                      onChange={() => setEditForm({ ...editForm, recipients: 'students' })}
                    />
                    <span className="radio-circle" /> All Students
                  </label>
                  <label className="radio-wrap">
                    <input type="radio" name="edit-recipients" value="both"
                      checked={editForm.recipients === 'both'}
                      onChange={() => setEditForm({ ...editForm, recipients: 'both' })}
                    />
                    <span className="radio-circle" /> Both
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="cfbtn-s" onClick={() => setEditItem(null)}>Cancel</button>
                  <button type="submit" className="post-btn">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}



      </div>
    </AdvisorLayout>
  );
}