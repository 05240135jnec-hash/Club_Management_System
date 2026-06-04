import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AdvisorLayout from './components/AdvisorLayout';
import Swal from 'sweetalert2';
import '../../styles/advisor/announcement.css';

const API = '/api';
function getToken() { return sessionStorage.getItem('token'); }

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileName(url) {
  if (!url) return 'Attachment';
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1]) || 'Attachment';
  } catch {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]) || 'Attachment';
  }
}

function getRecipientLabel(recipients) {
  if (recipients === 'students') return 'To: All Students';
  if (recipients === 'both') return 'To: Members & Students';
  return 'To: Members';
}

function getTypeBadgeClass(type) {
  if (type === 'event')    return 'type-badge event';
  if (type === 'reminder') return 'type-badge reminder';
  return 'type-badge general';
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

export default function AdvisorAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [posting, setPosting]             = useState(false);
  const [search, setSearch]               = useState('');
  const [openMenuId, setOpenMenuId]       = useState(null);
  const [viewItem, setViewItem]           = useState(null);
  const [editItem, setEditItem]           = useState(null);
  const [selectedFile, setSelectedFile]   = useState(null);
  const [dragOver, setDragOver]           = useState(false);
  const [viewMenuOpen, setViewMenuOpen]   = useState(false);
  const fileInputRef                      = useRef();
  const scrollPosRef                      = useRef(0);

  const [editAttachFile, setEditAttachFile] = useState(null);
  const [editKeepAttach, setEditKeepAttach] = useState(true);
  const editFileInputRef                    = useRef();

  const [form, setForm] = useState({
    title: '', type: 'general', content: '', recipients: 'members',
  });
  const [editForm, setEditForm] = useState({
    title: '', type: 'general', content: '', recipients: 'members',
  });

  useEffect(() => {
    fetchAnnouncements();
    const handler = e => {
      if (!e.target.closest('.dot-menu-wrap')) setOpenMenuId(null);
      if (!e.target.closest('.ann-view-menu-wrap')) setViewMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setEditItem(null); setViewMenuOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const list = data.announcements || data.data || (Array.isArray(data) ? data : []);
      setAnnouncements(list);
    } catch { setAnnouncements([]); }
    setLoading(false);
  }

  function handleFileSelect(file) {
    if (!file) return;
    setSelectedFile(file);
  }

  function removeFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function openView(item) {
    scrollPosRef.current = window.scrollY || document.documentElement.scrollTop;
    setViewItem(item);
    window.scrollTo(0, 0);
  }

  function handleBack() {
    setViewItem(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosRef.current);
    });
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Title and content are required.' });
      return;
    }
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('title',      form.title);
      fd.append('type',       form.type);
      fd.append('content',    form.content);
      fd.append('recipients', form.recipients);
      if (selectedFile) fd.append('attachment', selectedFile);
      const res = await fetch(`${API}/announcements`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Posted!', timer: 1500, showConfirmButton: false });
        setForm({ title: '', type: 'general', content: '', recipients: 'members' });
        removeFile();
        fetchAnnouncements();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to post.' });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' }); }
    setPosting(false);
  }

  async function handleDelete(id) {
    setOpenMenuId(null);
    setViewMenuOpen(false);
    const result = await Swal.fire({
      title: 'Delete Announcement?',
      text: 'This action cannot be undone.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
        if (viewItem?.id === id) handleBack();
        fetchAnnouncements();
      }
    } catch {}
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editItem) return;
    try {
      const fd = new FormData();
      fd.append('title',      editForm.title);
      fd.append('type',       editForm.type);
      fd.append('content',    editForm.content);
      fd.append('recipients', editForm.recipients);
      fd.append('_method', 'PUT');
      if (!editKeepAttach) fd.append('remove_attachment', '1');
      if (editAttachFile)  fd.append('attachment', editAttachFile);
      const res = await fetch(`${API}/announcements/${editItem.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
        const updatedItem = {
          ...editItem,
          title:      editForm.title,
          type:       editForm.type,
          content:    editForm.content,
          recipients: editForm.recipients,
          attachment: editAttachFile
            ? editItem.attachment
            : editKeepAttach ? editItem.attachment : null,
        };
        try {
          const json = await res.clone().json();
          if (json?.announcement?.attachment !== undefined) updatedItem.attachment = json.announcement.attachment;
          if (json?.data?.attachment !== undefined) updatedItem.attachment = json.data.attachment;
        } catch (_) {}
        setViewItem(updatedItem);
        setEditItem(null);
        fetchAnnouncements();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update.' });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
  }

  function openEdit(item) {
    setEditItem(item);
    setEditForm({
      title:      item.title      || '',
      type:       item.type       || 'general',
      content:    item.content    || '',
      recipients: item.recipients || 'members',
    });
    setEditAttachFile(null);
    setEditKeepAttach(true);
    setOpenMenuId(null);
    setViewMenuOpen(false);
  }

  const filtered = announcements.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── EDIT MODAL ── */
  const EditModal = editItem ? createPortal(
    <div className="ann-modal-backdrop" onClick={() => setEditItem(null)}>
      <div className="ann-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="ann-edit-header">
          <span className="ann-edit-title">Edit Announcement</span>
          <button className="ann-edit-close" onClick={() => setEditItem(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleEdit} className="ann-edit-body">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={editForm.type}
              onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
              <option value="general">General</option>
              <option value="event">Event</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea className="form-textarea" value={editForm.content}
              onChange={e => setEditForm({ ...editForm, content: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">
              Attachment <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11.5 }}>(optional)</span>
            </label>
            {editItem.attachment && editKeepAttach && !editAttachFile && (
              <div className="ann-edit-attach-current">
                <PaperclipIcon/>
                <span className="ann-edit-attach-name">{getFileName(editItem.attachment)}</span>
                <a href={editItem.attachment} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                  Open
                </a>
              </div>
            )}
            {editAttachFile && (
              <div className="ann-edit-attach-current">
                <PaperclipIcon/>
                <span className="ann-edit-attach-name">{editAttachFile.name}</span>
              </div>
            )}
            <div className="ann-edit-attach-actions">
              <button type="button" className="ann-edit-img-change"
                onClick={() => editFileInputRef.current?.click()}>
                {editItem.attachment || editAttachFile ? 'Replace File' : 'Add File'}
              </button>
              {(editItem.attachment || editAttachFile) && (
                <button type="button" className="ann-edit-img-remove"
                  onClick={() => {
                    setEditAttachFile(null);
                    setEditKeepAttach(false);
                    if (editFileInputRef.current) editFileInputRef.current.value = '';
                  }}>
                  Remove
                </button>
              )}
            </div>
            <input ref={editFileInputRef} type="file" accept="image/*,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={e => { setEditAttachFile(e.target.files[0]); setEditKeepAttach(true); e.target.value = ''; }}/>
          </div>
          <div className="send-to-wrap" style={{ marginBottom: 18 }}>
            <span className="send-to-label">Send to:</span>
            {['members', 'students', 'both'].map(v => (
              <label key={v} className="radio-wrap">
                <input type="radio" name="edit-recipients" value={v}
                  checked={editForm.recipients === v}
                  onChange={() => setEditForm({ ...editForm, recipients: v })}/>
                <span className="radio-circle"/>
                {v === 'members' ? 'Members only' : v === 'students' ? 'All Students' : 'Both'}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="cfbtn-s" onClick={() => setEditItem(null)}>Cancel</button>
            <button type="submit" className="post-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  /* ── VIEW PAGE ── */
  if (viewItem) {
    return (
      <AdvisorLayout title="Announcements" subtitle="Manage and post club announcements">

        {/* Back button row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <button className="ann-back-btn" onClick={handleBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Announcements
          </button>
          <div className="ann-view-menu-wrap">
            <button className="ann-view-menu-btn" onClick={() => setViewMenuOpen(!viewMenuOpen)}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <circle cx="12" cy="5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {viewMenuOpen && (
              <div className="ann-view-dropdown">
                <button className="ann-view-dd-item edit" onClick={() => openEdit(viewItem)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <div className="ann-view-dd-divider"/>
                <button className="ann-view-dd-item delete" onClick={() => handleDelete(viewItem.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
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

        {/* ── Curved view card — uses .ann-view-card from CSS ── */}
        <div className="ann-view-card">

          {/* Badge + Title + Date row */}
          <div className="ann-view-meta-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              <span className={getTypeBadgeClass(viewItem.type)}>
                {(viewItem.type || 'general').toUpperCase()}
              </span>
              <h1 className="ann-view-title">
                {viewItem.title}
              </h1>
            </div>
            <span className="ann-view-date">
              {viewItem.date_sent || formatDate(viewItem.created_at)}
            </span>
          </div>

          {/* Recipient */}
          <div className="ann-view-recipient">
            {getRecipientLabel(viewItem.recipients)}
          </div>

          {/* Posted by / Last edited by */}
          <div className="ann-view-authors">
            <span>
              Posted by: <strong>{viewItem.created_by || viewItem.posted_by || '—'}</strong>
            </span>
            {(viewItem.updated_by || viewItem.last_edited_by) && (
              <span>
                Last edited by: <strong>{viewItem.updated_by || viewItem.last_edited_by}</strong>
              </span>
            )}
          </div>

          <div className="ann-view-divider"/>

          {/* Content */}
          <div className="ann-view-content">{viewItem.content}</div>

          {/* Attachment */}
          {viewItem.attachment && (
            <a
              href={viewItem.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="ann-view-attachment"
            >
              <PaperclipIcon/>
              View Attachment
              <OpenIcon/>
            </a>
          )}

        </div>

        {EditModal}
      </AdvisorLayout>
    );
  }

  /* ── LIST PAGE ── */
  return (
    <AdvisorLayout title="Announcements" subtitle="Manage and post club announcements">
      <div className="ann-page">
        <div className="announce-card">
          <div className="card-title">Post Announcement</div>
          <form onSubmit={handlePost}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Type</label>
                <select className="form-input" value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea className="form-textarea" value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })} required />
            </div>
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
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
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
                  <div className="file-icon-box"><PaperclipIcon/></div>
                  <div className="file-selected-info">
                    <span className="file-selected-name">{selectedFile.name}</span>
                    <span className="file-selected-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button type="button" className="file-remove-btn" onClick={removeFile}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files[0])}/>
            </div>
            <div className="form-bottom">
              <div className="send-to-wrap">
                <span className="send-to-label">Send to:</span>
                {['members', 'students', 'both'].map(v => (
                  <label key={v} className="radio-wrap">
                    <input type="radio" name="recipients" value={v}
                      checked={form.recipients === v}
                      onChange={() => setForm({ ...form, recipients: v })}/>
                    <span className="radio-circle"/>
                    {v === 'members' ? 'Members only' : v === 'students' ? 'All Students' : 'Both'}
                  </label>
                ))}
              </div>
              <button type="submit" className="post-btn" disabled={posting}>
                {posting ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </form>
        </div>

        <div className="announce-card">
          <div className="history-header">
            <div className="card-title" style={{ marginBottom: 0 }}>Announcement History</div>
            <div className="history-search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search announcements..." value={search}
                onChange={e => setSearch(e.target.value)}/>
            </div>
          </div>
          {loading ? (
            <div className="ann-empty">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="ann-empty">No announcements yet.</div>
          ) : (
            <div className="ann-card-list">
              {filtered.map(item => (
                <div key={item.id} className="ann-history-card" onClick={() => openView(item)}>
                  <div className="ann-hcard-main">
                    <div className="ann-hcard-title">{item.title}</div>
                    <div className="ann-hcard-desc">
                      {item.content?.length > 100 ? item.content.slice(0, 100) + '...' : item.content}
                    </div>
                    <div className="ann-hcard-bottom-row">
                      <div className="ann-hcard-footer">
                        <span className={getTypeBadgeClass(item.type)}>
                          {(item.type || 'general').toUpperCase()}
                        </span>
                        <div className="ann-hcard-meta">
                          <span className="ann-hcard-recipient">{getRecipientLabel(item.recipients)}</span>
                          <span className="ann-hcard-date">{item.date_sent || formatDate(item.created_at)}</span>
                          <span className="ann-hcard-date">Posted by: {item.created_by || '—'}</span>
                        </div>
                        {item.attachment && (
                          <span className="ann-hcard-attach-tag">
                            <PaperclipIcon/>
                            Attachment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="dot-menu-wrap" onClick={e => e.stopPropagation()}>
                    <button className="dot-menu-btn"
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <circle cx="12" cy="5" r="1.5"/>
                        <circle cx="12" cy="12" r="1.5"/>
                        <circle cx="12" cy="19" r="1.5"/>
                      </svg>
                    </button>
                    {openMenuId === item.id && (
                      <div className="dot-menu-dropdown">
                        <button className="dot-menu-item edit" onClick={() => openEdit(item)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </button>
                        <button className="dot-menu-item delete"
                          onClick={() => { setOpenMenuId(null); handleDelete(item.id); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
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
      </div>
      {EditModal}
    </AdvisorLayout>
  );
}