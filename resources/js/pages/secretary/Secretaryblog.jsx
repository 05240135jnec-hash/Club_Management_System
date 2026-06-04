import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SecretaryLayout from './components/SecretaryLayout';
import Swal from 'sweetalert2';
import '../../styles/secretary/blog.css';

const API = '/api';
function getToken() { return sessionStorage.getItem('token'); }

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SecretaryBlog() {
  const [blogs, setBlogs]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [publishing, setPublishing]   = useState(false);
  const [search, setSearch]           = useState('');
  const [sort, setSort]               = useState('newest');
  const [openMenuId, setOpenMenuId]   = useState(null);
  const [viewBlog, setViewBlog]       = useState(null);
  const [editBlog, setEditBlog]       = useState(null);

  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [coverFile, setCoverFile]     = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef                  = useRef();

  const [editTitle, setEditTitle]         = useState('');
  const [editContent, setEditContent]     = useState('');
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const editCoverInputRef               = useRef();

  useEffect(() => {
    fetchBlogs();
    const handler = e => {
      if (!e.target.closest('.blog-menu-wrap')) setOpenMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { setViewBlog(null); setEditBlog(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function fetchBlogs() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/blogs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setBlogs(Array.isArray(data.blogs) ? data.blogs : []);
    } catch { setBlogs([]); }
    setLoading(false);
  }

  function handleCoverFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!allowed.includes(file.type)) {
      Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Only JPG, PNG, WebP or GIF allowed.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'Too large', text: 'Max cover image size is 5MB.' });
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = e => setCoverPreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function removeCover() {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handlePublish() {
    if (!title.trim() || !coverFile || !content.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Title, Cover Image and Content are all required.' });
      return;
    }
    setPublishing(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('content', content);
      fd.append('cover_image', coverFile);
      const res  = await fetch(`${API}/blogs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Published!', text: 'Blog published successfully.', timer: 1800, showConfirmButton: false });
        setTitle(''); setContent(''); removeCover();
        fetchBlogs();
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: data.message || 'Could not publish blog.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' });
    }
    setPublishing(false);
  }

  async function handleDelete(id, blogTitle) {
    const result = await Swal.fire({
      title: 'Delete Blog?',
      html: `Delete <strong>${blogTitle}</strong>? This cannot be undone.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
        fetchBlogs();
      }
    } catch {}
  }

  function openEdit(blog) {
    setEditBlog(blog);
    setEditTitle(blog.title);
    setEditContent(blog.content || '');
    setEditCoverFile(null);
    setEditCoverPreview(blog.cover_image || null);
    setOpenMenuId(null);
  }

  function handleEditCoverFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!allowed.includes(file.type)) return;
    setEditCoverFile(file);
    const reader = new FileReader();
    reader.onload = e => setEditCoverPreview(e.target.result);
    reader.readAsDataURL(file);
  }

  async function handleEditSave() {
    if (!editTitle.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Title is required.' });
      return;
    }
    try {
      const fd = new FormData();
      fd.append('title',   editTitle);
      fd.append('content', editContent);
      if (editCoverFile) fd.append('cover_image', editCoverFile);
      fd.append('_method', 'PUT');
      const res  = await fetch(`${API}/blogs/${editBlog.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
        setEditBlog(null);
        fetchBlogs();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Update failed.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' });
    }
  }

  function getFiltered() {
    let result = [...blogs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.uploaded_by?.toLowerCase().includes(q) ||
        b.content?.toLowerCase().includes(q)
      );
    }
    if (sort === 'oldest') result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }

  const filtered = getFiltered();

  return (
    <SecretaryLayout title="Upload Blog" subtitle="Publish club blog posts">
      <div className="blog-page">

        {/* ══ UPLOAD CARD ══ */}
        <div className="blog-upload-card">
          <div className="blog-card-title">Publish Club Blog</div>
          <div className="blog-card-sub">Share articles, stories and updates with your club community.</div>

          <div className="blog-fields">

            {/* BLOG TITLE — full width */}
            <div className="blog-field-group">
              <label className="blog-label">Blog Title <span className="blog-required">*</span></label>
              <input className="blog-input" type="text" value={title}
                onChange={e => setTitle(e.target.value)} maxLength={150} />
            </div>

            {/* COVER IMAGE */}
            <div className="blog-field-group">
              <label className="blog-label">Cover Image <span className="blog-required">*</span></label>
              {!coverPreview ? (
                <div
                  className={`blog-drop-zone${dragOver ? ' dragover' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleCoverFile(e.dataTransfer.files[0]); }}
                >
                  <div className="blog-drop-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="24" height="24">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <div className="blog-drop-text">Drag and drop a cover image here</div>
                  <div className="blog-drop-hint">JPG, PNG, WebP, GIF · Max 5MB</div>
                  <button className="blog-browse-btn" type="button"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Browse Image
                  </button>
                </div>
              ) : (
                <div className="blog-cover-preview">
                  <img src={coverPreview} alt="Cover" className="blog-cover-thumb" />
                  <div className="blog-cover-info">
                    <div className="blog-cover-name">{coverFile?.name}</div>
                    <div className="blog-cover-size">
                      {coverFile ? (coverFile.size / 1024).toFixed(1) + ' KB' : ''}
                    </div>
                  </div>
                  <button className="blog-cover-remove" onClick={removeCover}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={e => { handleCoverFile(e.target.files[0]); e.target.value = ''; }} />
            </div>

            {/* CONTENT */}
            <div className="blog-field-group">
              <label className="blog-label">Content <span className="blog-required">*</span></label>
              <textarea className="blog-textarea" value={content}
                onChange={e => setContent(e.target.value)} rows={8} />
            </div>
          </div>

          <div className="blog-publish-row">
            <button className="blog-publish-btn" onClick={handlePublish} disabled={publishing}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              {publishing ? 'Publishing...' : 'Publish Blog'}
            </button>
          </div>
        </div>

        {/* ══ GALLERY CARD ══ */}
        <div className="blog-gallery-card">
          <div className="blog-gallery-header">
            <div className="blog-gallery-title">Club Blog Gallery</div>
            <div className="blog-gallery-controls">
              <div className="blog-search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input className="blog-search" type="text" value={search}
                  onChange={e => setSearch(e.target.value)} placeholder="Search blogs..." />
              </div>
              <select className="blog-sort" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">New to Old</option>
                <option value="oldest">Old to New</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="blog-empty"><p>Loading...</p></div>
          ) : filtered.length === 0 ? (
            <div className="blog-empty">
              <div className="blog-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="30" height="30">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <p className="blog-empty-text">
                {blogs.length === 0 ? 'No blogs published yet' : 'No blogs match your search'}
              </p>
              <p className="blog-empty-sub">
                {blogs.length === 0 ? 'Publish your first blog post using the form above.' : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <div className="blog-grid">
              {filtered.map(b => (
                <div key={b.id} className="blog-card-item" onClick={() => setViewBlog(b)}>
                  {b.cover_image && (
                    <div className="blog-card-cover">
                      <img src={b.cover_image} alt={b.title} />
                    </div>
                  )}
                  <div className="blog-card-body">
                    <div className="blog-card-title-row">
                      <div className="blog-card-name">{b.title}</div>
                      <div className="blog-menu-wrap" onClick={e => e.stopPropagation()}>
                        <button className="blog-menu-btn"
                          onClick={() => setOpenMenuId(openMenuId === b.id ? null : b.id)}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                            <circle cx="12" cy="5" r="1.5"/>
                            <circle cx="12" cy="12" r="1.5"/>
                            <circle cx="12" cy="19" r="1.5"/>
                          </svg>
                        </button>
                        {openMenuId === b.id && (
                          <div className="blog-dropdown">
                            <button className="blog-dd-item view"
                              onClick={() => { setViewBlog(b); setOpenMenuId(null); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              View Blog
                            </button>
                            <button className="blog-dd-item edit" onClick={() => openEdit(b)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit Details
                            </button>
                            <div className="blog-dd-divider"/>
                            <button className="blog-dd-item delete"
                              onClick={() => handleDelete(b.id, b.title)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="blog-card-author-row">
                      <div className="blog-card-avatar">{getInitials(b.uploaded_by)}</div>
                      <span className="blog-card-author">{b.uploaded_by}</span>
                    </div>
                    {b.content && (
                      <p className="blog-card-excerpt">
                        {b.content.length > 120 ? b.content.slice(0, 120) + '...' : b.content}
                      </p>
                    )}
                    <div className="blog-card-footer">
                      <span className="blog-card-date">{b.created_at}</span>
                      <span className="blog-card-date">Posted by: {b.uploaded_by || '—'}</span>
                      <span className="blog-read-more">Read more</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ══ VIEW MODAL PORTAL ══ */}
      {viewBlog && createPortal(
        <div className="blog-modal-backdrop" onClick={() => setViewBlog(null)}>
          <div className="blog-view-modal" onClick={e => e.stopPropagation()}>
            <div className="blog-view-topbar">
              <span className="blog-view-label">Blog Post</span>
              <button className="blog-view-close-btn" onClick={() => setViewBlog(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {viewBlog.cover_image ? (
              <div className="blog-view-cover">
                <img src={viewBlog.cover_image} alt="Cover" />
              </div>
            ) : (
              <div className="blog-view-cover-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
            <div className="blog-view-body">
              <div className="blog-view-content">
                <h2 className="blog-view-title">{viewBlog.title}</h2>
                <div className="blog-view-author-row">
                  <div className="blog-view-avatar">{getInitials(viewBlog.uploaded_by)}</div>
                  <span className="blog-view-author-name">{viewBlog.uploaded_by}</span>
                  <span className="blog-view-sep">·</span>
                  <span className="blog-view-date">{viewBlog.created_at}</span>
                </div>
                <div style={{display:'flex', gap:24, marginTop:8, fontSize:13, color:'#6b7280'}}>
                  <span>Posted by: <strong>{viewBlog.uploaded_by || '—'}</strong></span>
                  {viewBlog.updated_by && (
                    <span>Last edited by: <strong>{viewBlog.updated_by}</strong></span>
                  )}
                </div>
                {viewBlog.content
                  ? <div className="blog-view-text">{viewBlog.content}</div>
                  : <p className="blog-view-no-content">No content written for this blog post.</p>
                }
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══ EDIT MODAL PORTAL ══ */}
      {editBlog && createPortal(
        <div className="blog-modal-backdrop" onClick={() => setEditBlog(null)}>
          <div className="blog-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="blog-modal-header">
              <span className="blog-modal-title">Edit Blog Post</span>
              <button className="blog-modal-close" onClick={() => setEditBlog(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="blog-edit-cover-section">
              {editCoverPreview ? (
                <div className="blog-edit-cover-wrap"
                  onClick={() => editCoverInputRef.current?.click()}>
                  <img src={editCoverPreview} alt="Cover" className="blog-edit-cover-img" />
                  <div className="blog-edit-cover-change">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Replace Cover Image
                  </div>
                </div>
              ) : (
                <div className="blog-edit-cover-placeholder"
                  onClick={() => editCoverInputRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span style={{ fontSize:'13.5px', fontWeight:700 }}>Click to add cover image</span>
                  <span style={{ fontSize:'12px', color:'#9ca3af' }}>JPG, PNG, WebP, GIF</span>
                </div>
              )}
              <input ref={editCoverInputRef} type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display:'none' }}
                onChange={e => { handleEditCoverFile(e.target.files[0]); e.target.value=''; }} />
            </div>
            <div className="blog-edit-body">
              <div className="blog-field-group">
                <label className="blog-label">Blog Title <span className="blog-required">*</span></label>
                <input className="blog-input" type="text" value={editTitle}
                  onChange={e => setEditTitle(e.target.value)} maxLength={150} autoFocus />
              </div>
              <div className="blog-field-group">
                <label className="blog-label">Content <span className="blog-required">*</span></label>
                <textarea className="blog-textarea" value={editContent}
                  onChange={e => setEditContent(e.target.value)} rows={6} />
              </div>
            </div>
            <div className="blog-edit-footer">
              <button className="blog-edit-cancel" onClick={() => setEditBlog(null)}>Cancel</button>
              <button className="blog-edit-save" onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </SecretaryLayout>
  );
}