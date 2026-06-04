import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SecretaryLayout from './components/SecretaryLayout';
import Swal from 'sweetalert2';
import '../../styles/secretary/upload_image.css';

const API = '/api';
function getToken() { return sessionStorage.getItem('token'); }

export default function SecretaryUploadImage() {
  const [albums, setAlbums]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [uploading, setUploading]         = useState(false);
  const [title, setTitle]                 = useState('');
  const [caption, setCaption]             = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews]           = useState([]);
  const [dragOver, setDragOver]           = useState(false);
  const [search, setSearch]               = useState('');
  const [sort, setSort]                   = useState('newest');
  const [openMenuId, setOpenMenuId]       = useState(null);
  const fileInputRef                      = useRef();

  const [lightbox, setLightbox] = useState(null);

  const [editAlbum, setEditAlbum]             = useState(null);
  const [editTitle, setEditTitle]             = useState('');
  const [editCaption, setEditCaption]         = useState('');
  const [editNewFiles, setEditNewFiles]       = useState([]);
  const [editNewPreviews, setEditNewPreviews] = useState([]);
  const [editRemoveIds, setEditRemoveIds]     = useState([]);
  const [editDragOver, setEditDragOver]       = useState(false);
  const editFileInputRef                      = useRef();

  useEffect(() => {
    fetchAlbums();
    const handler = e => {
      if (!e.target.closest('.img-menu-wrap')) setOpenMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (!lightbox) return;
      if (e.key === 'ArrowLeft')  setLightbox(lb => ({ ...lb, index: Math.max(0, lb.index - 1) }));
      if (e.key === 'ArrowRight') setLightbox(lb => ({ ...lb, index: Math.min(lb.images.length - 1, lb.index + 1) }));
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  async function fetchAlbums() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/image-albums`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setAlbums(Array.isArray(data.albums) ? data.albums : []);
    } catch { setAlbums([]); }
    setLoading(false);
  }

  function buildPreviews(files, setter) {
    const results = [];
    let done = 0;
    if (!files.length) { setter([]); return; }
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = e => {
        results[i] = e.target.result;
        done++;
        if (done === files.length) setter([...results]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleFiles(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    const merged = [...selectedFiles];
    imgs.forEach(f => {
      if (!merged.find(x => x.name === f.name && x.size === f.size)) merged.push(f);
    });
    if (merged.length > 10) {
      Swal.fire({ icon: 'warning', title: 'Maximum 10 images', text: 'You can only upload up to 10 images per album.' });
      const limited = merged.slice(0, 10);
      setSelectedFiles(limited);
      buildPreviews(limited, setPreviews);
      return;
    }
    setSelectedFiles(merged);
    buildPreviews(merged, setPreviews);
  }

  function removeFile(i) {
    const updated = selectedFiles.filter((_, idx) => idx !== i);
    setSelectedFiles(updated);
    buildPreviews(updated, setPreviews);
  }

  async function handleUpload() {
    if (!title.trim() || !caption.trim() || !selectedFiles.length) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please fill in title, caption and select images.' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('caption', caption);
      selectedFiles.forEach(f => fd.append('images[]', f));
      const res  = await fetch(`${API}/image-albums`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Uploaded!', text: 'Album created successfully.', timer: 1800, showConfirmButton: false });
        setTitle(''); setCaption(''); setSelectedFiles([]); setPreviews([]);
        fetchAlbums();
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: data.message || 'Upload failed.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' });
    }
    setUploading(false);
  }

  async function handleDeleteAlbum(id, albumTitle) {
    const result = await Swal.fire({
      title: 'Delete Album?',
      html: `Delete <strong>${albumTitle}</strong> and all its images?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API}/image-albums/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
        fetchAlbums();
      }
    } catch {}
  }

  function openEdit(album) {
    setEditAlbum(album);
    setEditTitle(album.title);
    setEditCaption(album.caption);
    setEditNewFiles([]);
    setEditNewPreviews([]);
    setEditRemoveIds([]);
    setOpenMenuId(null);
  }

  function handleEditFiles(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    const merged = [...editNewFiles];
    imgs.forEach(f => {
      if (!merged.find(x => x.name === f.name && x.size === f.size)) merged.push(f);
    });
    const existingCount = editAlbum
      ? editAlbum.images.filter(img => !editRemoveIds.includes(img.id)).length
      : 0;
    const total = existingCount + merged.length;
    if (total > 10) {
      Swal.fire({ icon: 'warning', title: 'Maximum 10 images', text: 'Total images cannot exceed 10.' });
      const allowed = merged.slice(0, Math.max(0, 10 - existingCount));
      setEditNewFiles(allowed);
      buildPreviews(allowed, setEditNewPreviews);
      return;
    }
    setEditNewFiles(merged);
    buildPreviews(merged, setEditNewPreviews);
  }

  function toggleRemoveImage(imgId) {
    setEditRemoveIds(prev =>
      prev.includes(imgId) ? prev.filter(x => x !== imgId) : [...prev, imgId]
    );
  }

  async function handleEditSave() {
    if (!editTitle.trim() || !editCaption.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Title and caption are required.' });
      return;
    }
    const remaining = editAlbum.images.filter(img => !editRemoveIds.includes(img.id));
    if (remaining.length + editNewFiles.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No images', text: 'Album must have at least one image.' });
      return;
    }
    try {
      const fd = new FormData();
      fd.append('title',   editTitle);
      fd.append('caption', editCaption);
      editRemoveIds.forEach(id => fd.append('remove_image_ids[]', id));
      editNewFiles.forEach(f => fd.append('new_images[]', f));
      fd.append('_method', 'PUT');
      const res  = await fetch(`${API}/image-albums/${editAlbum.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
        setEditAlbum(null);
        fetchAlbums();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Update failed.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect to server.' });
    }
  }

  function getFiltered() {
    let result = [...albums];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) || a.caption?.toLowerCase().includes(q)
      );
    }
    if (sort === 'oldest') result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }

  const filtered = getFiltered();

  return (
    <SecretaryLayout title="Upload Image" subtitle="Upload club images">
      <div className="img-page">

        {/* UPLOAD CARD */}
        <div className="img-upload-card">
          <div className="img-upload-header">
            <div>
              <div className="img-card-title">Upload Club Images</div>
              <div className="img-card-sub">Fill in all fields and select images to enable upload.</div>
            </div>
          </div>

          <div className="img-form-row">
            <div className="img-form-group">
              <label className="img-label">Title <span className="img-required">*</span></label>
              <input className="img-input" type="text" value={title}
                onChange={e => setTitle(e.target.value)} maxLength={80} />
            </div>
            <div className="img-form-group">
              <label className="img-label">Caption <span className="img-required">*</span></label>
              <textarea className="img-textarea" value={caption}
                onChange={e => setCaption(e.target.value)} maxLength={240} rows={2} />
            </div>
          </div>

          <div
            className={`img-drop-zone${dragOver ? ' dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          >
            <div className="img-drop-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="img-drop-text">Click or drag &amp; drop images here</div>
            <div className="img-drop-hint">Max 10 images · JPG, PNG, GIF, WEBP</div>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

          {previews.length > 0 && (
            <div className="img-preview-strip">
              <div className="img-preview-header">
                <span className="img-preview-label">{previews.length} image{previews.length > 1 ? 's' : ''} selected</span>
                <button className="img-clear-btn" onClick={() => { setSelectedFiles([]); setPreviews([]); }}>Clear all</button>
              </div>
              <div className="img-preview-grid">
                {previews.map((src, i) => (
                  <div key={i} className="img-preview-item">
                    <img src={src} alt="" />
                    <button className="img-preview-remove"
                      onClick={e => { e.stopPropagation(); removeFile(i); }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="img-upload-btn-row">
            <button className="img-submit-btn" onClick={handleUpload} disabled={uploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* GALLERY CARD */}
        <div className="img-gallery-card">
          <div className="img-gallery-header">
            <div className="img-gallery-header-left">
              <div className="img-gallery-title">Club Gallery</div>
              <span className="img-photo-badge">{albums.length} album{albums.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="img-gallery-controls">
              <div className="img-search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input className="img-search" type="text" value={search}
                  onChange={e => setSearch(e.target.value)} placeholder="Search albums..." />
              </div>
              <select className="img-sort" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">New to Old</option>
                <option value="oldest">Old to New</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="img-empty"><p>Loading...</p></div>
          ) : filtered.length === 0 ? (
            <div className="img-empty">
              <div className="img-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="30" height="30">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="img-empty-text">{albums.length === 0 ? 'No images uploaded yet' : 'No results found'}</p>
              <p className="img-empty-hint">{albums.length === 0 ? 'Upload images above.' : 'Try a different search term.'}</p>
            </div>
          ) : (
            <div className="img-album-grid">
              {filtered.map(album => (
                <div key={album.id} className="img-album-card">
                  <div className="img-album-thumb"
                    onClick={() => setLightbox({ album, images: album.images, index: 0 })}>
                    <img src={album.images[0]?.url} alt={album.title} />
                    <div className="img-album-count">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      {album.images.length} photo{album.images.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="img-album-info">
                    <div className="img-album-info-row">
                      {/* ── Title #1a1a2e ── */}
                      <div className="img-album-title" style={{ color: '#1a1a2e' }}>{album.title}</div>
                      <div className="img-menu-wrap" onClick={e => e.stopPropagation()}>
                        <button className="img-menu-btn"
                          onClick={() => setOpenMenuId(openMenuId === album.id ? null : album.id)}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                            <circle cx="12" cy="5" r="1.6"/>
                            <circle cx="12" cy="12" r="1.6"/>
                            <circle cx="12" cy="19" r="1.6"/>
                          </svg>
                        </button>
                        {openMenuId === album.id && (
                          <div className="img-menu-dropdown">
                            <button className="img-menu-item edit" onClick={() => openEdit(album)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>
                            <div className="img-menu-divider"/>
                            <button className="img-menu-item delete"
                              onClick={() => handleDeleteAlbum(album.id, album.title)}>
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

                    {/* ── Caption #1a1a2e ── */}
                    <div className="img-album-caption" style={{ color: '#1a1a2e' }}>{album.caption}</div>

                    {/* ── Date #1a1a2e ── */}
                    <div className="img-album-meta" style={{ color: '#1a1a2e' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {album.created_at}
                    </div>

                    {/* ── Posted by / Last edited by #1a1a2e ── */}
                    <div style={{ fontSize: 12, color: '#1a1a2e', marginTop: 4 }}>
                      Posted by: <strong style={{ color: '#1a1a2e' }}>{album.uploaded_by || '—'}</strong>
                      {album.updated_by && (
                        <span> Last edited by: <strong style={{ color: '#1a1a2e' }}>{album.updated_by}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* LIGHTBOX PORTAL */}
      {lightbox && createPortal(
        <div className="img-lightbox" onClick={() => setLightbox(null)}>
          <div className="img-lightbox-panel" onClick={e => e.stopPropagation()}>
            <div className="img-lb-topbar">
              <div className="img-lb-topbar-info">
                <div className="img-lb-title">{lightbox.album.title}</div>
                <div className="img-lb-meta">
                  {lightbox.album.created_at} · {lightbox.images.length} photo{lightbox.images.length !== 1 ? 's' : ''}
                </div>
                <div className="img-lb-caption">{lightbox.album.caption}</div>
              </div>
              <button className="img-lb-close" onClick={() => setLightbox(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Close
              </button>
            </div>
            <div className="img-lb-img-wrap">
              {lightbox.index > 0 && (
                <button className="img-lb-arrow left"
                  onClick={() => setLightbox(lb => ({ ...lb, index: lb.index - 1 }))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
              )}
              <img className="img-lb-img" src={lightbox.images[lightbox.index]?.url} alt="" />
              {lightbox.index < lightbox.images.length - 1 && (
                <button className="img-lb-arrow right"
                  onClick={() => setLightbox(lb => ({ ...lb, index: lb.index + 1 }))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              )}
              <div className="img-lb-counter">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            </div>
            <div className="img-lb-thumbs">
              {lightbox.images.map((img, i) => (
                <button key={i}
                  className={`img-lb-thumb${i === lightbox.index ? ' active' : ''}`}
                  onClick={() => setLightbox(lb => ({ ...lb, index: i }))}>
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT MODAL PORTAL */}
      {editAlbum && createPortal(
        <div className="img-edit-backdrop" onClick={() => setEditAlbum(null)}>
          <div className="img-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="img-edit-header">
              <span className="img-edit-title">Edit Album</span>
              <button className="img-edit-close" onClick={() => setEditAlbum(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="img-edit-body">
              <div className="img-form-group">
                <label className="img-label">Title <span className="img-required">*</span></label>
                <input className="img-input" type="text" value={editTitle}
                  onChange={e => setEditTitle(e.target.value)} maxLength={80} autoFocus />
              </div>
              <div className="img-form-group">
                <label className="img-label">Caption <span className="img-required">*</span></label>
                <textarea className="img-textarea" value={editCaption}
                  onChange={e => setEditCaption(e.target.value)} maxLength={240} rows={2} />
              </div>
              <div className="img-label" style={{ marginBottom: 8 }}>Existing Images</div>
              <div className="img-edit-existing-grid">
                {editAlbum.images.map(img => (
                  <div key={img.id}
                    className={`img-edit-existing-item${editRemoveIds.includes(img.id) ? ' marked-remove' : ''}`}>
                    <img src={img.url} alt="" />
                    <button className="img-edit-remove-img" onClick={() => toggleRemoveImage(img.id)}>
                      {editRemoveIds.includes(img.id) ? '↩' : '✕'}
                    </button>
                    {editRemoveIds.includes(img.id) && (
                      <div className="img-remove-overlay">Remove</div>
                    )}
                  </div>
                ))}
              </div>
              <div
                className={`img-edit-drop${editDragOver ? ' dragover' : ''}`}
                onClick={() => editFileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setEditDragOver(true); }}
                onDragLeave={() => setEditDragOver(false)}
                onDrop={e => { e.preventDefault(); setEditDragOver(false); handleEditFiles(e.dataTransfer.files); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  width="22" height="22" style={{ color: '#2d5be3' }}>
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <span className="img-edit-drop-text">Click or drag to add more images</span>
              </div>
              <input ref={editFileInputRef} type="file" multiple accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { handleEditFiles(e.target.files); e.target.value = ''; }} />
              {editNewPreviews.length > 0 && (
                <div className="img-preview-grid" style={{ marginTop: 10 }}>
                  {editNewPreviews.map((src, i) => (
                    <div key={i} className="img-preview-item">
                      <img src={src} alt="" />
                      <button className="img-preview-remove" onClick={() => {
                        const f = editNewFiles.filter((_, idx) => idx !== i);
                        setEditNewFiles(f);
                        buildPreviews(f, setEditNewPreviews);
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="img-edit-footer">
              <button className="img-edit-cancel" onClick={() => setEditAlbum(null)}>Cancel</button>
              <button className="img-edit-save" onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </SecretaryLayout>
  );
}