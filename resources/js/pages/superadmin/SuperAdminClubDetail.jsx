import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import SuperAdminLayout from './components/SuperAdminLayout';
import Swal from 'sweetalert2';
import '../../styles/club-detail.css';
import '../../styles/superadmin/allclubs.css';

const API = '/api/superadmin';
const getToken = () => sessionStorage.getItem('token');

const CAT_AVATAR_BG = {
  Volunteering:     '#0a4a36',
  Maintenance:      '#2c2c2a',
  'Social Service': '#5a1e0a',
  Entrepreneurship: '#4a2a04',
  Entertainment:    '#4a2a04',
  Sports:           '#0a3060',
  Cultural:         '#3a0a4a',
};

const CATEGORIES = [
  'Volunteer', 'Maintenance', 'Social Service',
  'Entrepreneurship', 'Entertainment', 'Sports', 'Cultural',
];

export default function SuperAdminClubDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [club, setClub]                   = useState(null);
  const [albums, setAlbums]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [error, setError]                 = useState('');
  const [lightbox, setLightbox]           = useState(null); // { album, imgIdx }
  const [menuOpen, setMenuOpen]           = useState(false);
  const [membersModal, setMembersModal]   = useState(false);

  const [editModal, setEditModal]             = useState(false);
  const [editName, setEditName]               = useState('');
  const [editCategory, setEditCategory]       = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving]           = useState(false);

  useEffect(() => {
    fetchClub();
    const handler = e => {
      if (!e.target.closest('.sa-cd-menu-wrap')) setMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [id]);

  // ADD this useEffect
useEffect(() => {
  if (lightbox) {
    document.body.classList.add('lightbox-open');
  } else {
    document.body.classList.remove('lightbox-open');
  }
  return () => document.body.classList.remove('lightbox-open');
}, [lightbox]);

  async function fetchClub() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/clubs/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Club not found.'); setLoading(false); return; }
      setClub(data.club);
      fetchAlbums(data.club.id);
    } catch { setError('Failed to load club.'); }
    finally  { setLoading(false); }
  }

  async function fetchAlbums(clubId) {
    setAlbumsLoading(true);
    try {
      const res  = await fetch(`${API}/clubs/${clubId}/albums`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      const allAlbums = data.albums ?? data ?? [];
      setAlbums(Array.isArray(allAlbums) ? allAlbums : []);
    } catch { setAlbums([]); }
    finally  { setAlbumsLoading(false); }
  }

  function openEdit() {
    setEditName(club.name);
    setEditCategory(club.category);
    setEditDescription(club.description || '');
    setEditModal(true);
    setMenuOpen(false);
  }

  async function handleEditSave() {
    if (!editName.trim() || !editCategory.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Name and category are required.' });
      return;
    }
    setEditSaving(true);
    try {
      const res  = await fetch(`${API}/clubs/${club.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName, category: editCategory, description: editDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
        setEditModal(false);
        fetchClub();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' });
    }
    setEditSaving(false);
  }

  async function handleDeactivate() {
    setMenuOpen(false);
    const result = await Swal.fire({
      title: `Deactivate ${club.name}?`,
      text: 'Club will be moved to Inactive. You can restore it anytime.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e53e3e', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Deactivate',
    });
    if (!result.isConfirmed) return;
    try {
      const res  = await fetch(`${API}/clubs/${club.id}/deactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deactivated!', timer: 1500, showConfirmButton: false });
        navigate('/superadmin/all-clubs');
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
  }

  async function handleRestore() {
    setMenuOpen(false);
    const result = await Swal.fire({
      title: `Restore ${club.name}?`,
      text: 'Club will be moved back to Active.',
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#16a34a', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Restore',
    });
    if (!result.isConfirmed) return;
    try {
      const res  = await fetch(`${API}/clubs/${club.id}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Restored!', timer: 1500, showConfirmButton: false });
        fetchClub();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
  }

  async function handleDelete() {
    setMenuOpen(false);
    const result = await Swal.fire({
      title: `Permanently Delete ${club.name}?`,
      text: 'This cannot be undone. The club will be removed forever.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e53e3e', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete Forever',
    });
    if (!result.isConfirmed) return;
    try {
      const res  = await fetch(`${API}/clubs/${club.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
        navigate('/superadmin/all-clubs');
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
  }

  /* ── lightbox helpers ── */
  const openLightbox = (album, imgIdx) => setLightbox({ album, imgIdx });
  const closeLightbox = () => setLightbox(null);
  const lightboxNext = () => {
    if (!lightbox) return;
    const imgs = lightbox.album.images ?? lightbox.album.album_images ?? [];
    if (lightbox.imgIdx < imgs.length - 1)
      setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx + 1 });
  };
  const lightboxPrev = () => {
    if (!lightbox) return;
    if (lightbox.imgIdx > 0)
      setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx - 1 });
  };

  /* ── objectives parser ── */
  const parseObjectives = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : raw.split('\n').filter(Boolean);
    } catch { return raw.split('\n').filter(Boolean); }
  };

  const avatarBg = club ? (CAT_AVATAR_BG[club.category] ?? '#0c1b33') : '#0c1b33';

  /* ── loading / error states ── */
  if (loading) return (
    <SuperAdminLayout title="Club Detail" subtitle="Loading...">
      <div className="sacd-loading">
        <div className="sacd-spinner" />
        <p>Loading club...</p>
      </div>
    </SuperAdminLayout>
  );

  if (error) return (
    <SuperAdminLayout title="Club Detail" subtitle="">
      <div className="sacd-loading">
        <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
        <button className="sacd-back-btn-plain"
          onClick={() => navigate('/superadmin/all-clubs')}>
          ← Back to All Clubs
        </button>
      </div>
    </SuperAdminLayout>
  );

  const objectives = parseObjectives(club.objectives);

  return (
    <SuperAdminLayout title={club.name} subtitle={club.category}>
      <div className="sacd-wrap">

        {/* ── BACK + 3-DOT ROW ── */}
        <div className="sa-cd-toprow">
          <button className="sa-cd-back" onClick={() => navigate('/superadmin/all-clubs')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to All Clubs
          </button>

          <div className="sa-cd-menu-wrap">
            <button className="sa-cd-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <circle cx="12" cy="5"  r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="sa-cd-dropdown">
                <button className="ac-dd-item edit" onClick={openEdit}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Club
                </button>
                <div className="ac-dd-divider" />

                {club.status === 'active' ? (
                  <button className="ac-dd-item deactivate" onClick={handleDeactivate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    Deactivate
                  </button>
                ) : (
                  <>
                    <button className="ac-dd-item restore" onClick={handleRestore}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      Restore
                    </button>
                    <div className="ac-dd-divider" />
                    <button className="ac-dd-item delete" onClick={handleDelete}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                      Delete Forever
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── INACTIVE BANNER ── */}
        {club.status === 'inactive' && (
          <div className="sa-cd-inactive-banner">
            ⚠️ This club is currently <strong>Inactive</strong>. Restore it to make it active again.
          </div>
        )}

        {/* ── CLUB BANNER ── */}
        <div className="sacd-banner">
          <div className="sacd-banner-bg" style={club.cover_photo ? {backgroundImage:`url('/storage/${club.cover_photo}')`} : {}} />
          <div className="sacd-banner-overlay" />
          <div className="sacd-banner-content">
            <div className="sacd-banner-avatar" style={{ background: avatarBg }}>
              {club.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sacd-banner-info">
              <span className="sacd-banner-cat">{club.category}</span>
              <h1 className="sacd-banner-name">{club.name}</h1>
              <div className="sacd-banner-meta" style={{ color:'rgba(255,255,255,0.9)' }}>
                {/* ✅ Clickable members pill */}
                <button
                  onClick={() => setMembersModal(true)}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    background:'rgba(255,255,255,0.15)',
                    border:'1px solid rgba(255,255,255,0.3)',
                    borderRadius:20, padding:'3px 12px',
                    color:'#fff', fontSize:12.5, fontWeight:700,
                    cursor:'pointer', fontFamily:'inherit',
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {club.member_count ?? 0} members
                </button>

                {club.advisor?.name && (
                  <><span className="sacd-meta-dot" style={{color:'rgba(255,255,255,0.4)'}}>·</span>
                  <span style={{color:'rgba(255,255,255,0.85)'}}>Advisor: <strong style={{color:'#fff'}}>{club.advisor.name}</strong></span></>
                )}
                {club.co_advisors?.length > 0 && (
                  <><span className="sacd-meta-dot" style={{color:'rgba(255,255,255,0.4)'}}>·</span>
                  <span style={{color:'rgba(255,255,255,0.85)'}}>Co-Advisor: <strong style={{color:'#fff'}}>{club.co_advisors.map(ca => ca.name).join(', ')}</strong></span></>
                )}
                {club.secretaries?.length > 0 && (
                  <><span className="sacd-meta-dot" style={{color:'rgba(255,255,255,0.4)'}}>·</span>
                  <span style={{color:'rgba(255,255,255,0.85)'}}>Secretary: <strong style={{color:'#fff'}}>{club.secretaries.map(s => s.name).join(', ')}</strong></span></>
                )}
                <span className="sacd-meta-dot" style={{color:'rgba(255,255,255,0.4)'}}>·</span>
                <span className={`sacd-status-pill ${club.status === 'active' ? 'active' : 'inactive'}`}>
                  {club.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FULL-WIDTH BODY ── */}
        <div className="sacd-body">

          {/* AIM */}
          {club.aim && (
            <div className="sacd-section">
              <div className="sacd-section-label">AIM</div>
              <div className="sacd-section-divider" />
              <p className="sacd-section-text">{club.aim}</p>
            </div>
          )}

          {/* OBJECTIVES */}
          {objectives.length > 0 && (
            <div className="sacd-section">
              <div className="sacd-section-label">OBJECTIVES</div>
              <div className="sacd-section-divider" />
              <ul className="sacd-objectives">
                {objectives.map((obj, i) => (
                  <li key={i} className="sacd-obj-item">
                    <span className="sacd-obj-num">{i + 1}</span>
                    <span className="sacd-obj-text">
                      {typeof obj === 'string' ? obj : obj.objective ?? obj}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* DESCRIPTION */}
          {club.description && (
            <div className="sacd-section">
              <div className="sacd-section-label">DESCRIPTION</div>
              <div className="sacd-section-divider" />
              <p className="sacd-section-text">{club.description}</p>
            </div>
          )}

          {/* CLUB ACTIVITIES — album cards */}
          <div className="sacd-albums-section">
            <div className="sacd-albums-header">
              <div className="sacd-albums-title">Club Activities</div>
              <p className="sacd-albums-sub">Work programs and activities posted by the advisor</p>
            </div>

            {albumsLoading ? (
              <div className="sacd-albums-loading">
                <div className="sacd-spinner" />
                <p>Loading activities...</p>
              </div>
            ) : albums.length === 0 ? (
              <div className="sacd-no-albums">
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <p>No activities posted yet.</p>
                <span>No work program images uploaded yet.</span>
              </div>
            ) : (
              <div className="sacd-albums-list">
                {albums.map((album) => {
                  const imgs = album.images ?? album.album_images ?? [];
                  return (
                    <div className="sacd-album-card" key={album.id}>
                      <div className="sacd-album-header">
                        <div>
                          <div className="sacd-album-title">{album.title ?? album.name}</div>
                          <div className="sacd-album-meta">
                            <span>By {album.uploaded_by ?? '—'}</span>
                            <span className="sacd-album-dot">·</span>
                            <span>{album.created_at}</span>
                          </div>
                        </div>
                        <span className="sacd-album-count">{imgs.length} photos</span>
                      </div>

                      {album.caption && (
                        <p className="sacd-album-caption">{album.caption}</p>
                      )}

                      {imgs.length > 0 && (
                        <div className="sacd-album-images">
                          {imgs.map((img, imgIdx) => {
                            const src = img.url ?? img.image_url ?? img.path ?? '';
                            return (
                              <div key={img.id ?? imgIdx} className="sacd-album-img-wrap"
                                onClick={() => openLightbox(album, imgIdx)}>
                                <img
                                  src={src}
                                  alt={img.caption ?? img.file_name ?? `Photo ${imgIdx + 1}`}
                                  className="sacd-album-img"
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                                <div className="sacd-img-overlay">
                                  <svg width="20" height="20" viewBox="0 0 24 24"
                                    fill="none" stroke="white" strokeWidth="2">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                  </svg>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>{/* end sacd-body */}
      </div>{/* end sacd-wrap */}

      {/* ── MEMBERS MODAL ── */}
      {membersModal && createPortal(
        <div className="ac-modal-backdrop" onClick={() => setMembersModal(false)}>
          <div className="ac-modal" onClick={e => e.stopPropagation()} style={{maxWidth:600}}>
            <div className="ac-modal-header">
              <span className="ac-modal-title">Club Members ({club.members?.length ?? 0})</span>
              <button className="ac-modal-close" onClick={() => setMembersModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div style={{ overflowY:'auto', maxHeight:'60vh' }}>
              {!club.members || club.members.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8', fontSize:14 }}>
                  No members found.
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
                      <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px' }}>Name</th>
                      <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px' }}>Student ID</th>
                      <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px' }}>Course</th>
                      <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px' }}>Year</th>
                      <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px' }}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {club.members.map((m, i) => (
                      <tr key={m.id ?? i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'12px 16px', fontWeight:600, color:'#0f172a' }}>{m.name}</td>
                        <td style={{ padding:'12px 16px', color:'#475569' }}>{m.student_id || '—'}</td>
                        <td style={{ padding:'12px 16px', color:'#475569' }}>{m.course || '—'}</td>
                        <td style={{ padding:'12px 16px', color:'#475569' }}>{m.year || '—'}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{
                            padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700,
                            background: m.role === 'secretary' ? '#eef1fd' : '#f0fdf4',
                            color: m.role === 'secretary' ? '#2d5be3' : '#16a34a',
                          }}>{m.role || 'member'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="ac-modal-footer">
              <button className="ac-modal-cancel" onClick={() => setMembersModal(false)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── LIGHTBOX ── */}
      {lightbox && lightbox.album && createPortal((() => {
        const imgs = lightbox.album.images ?? lightbox.album.album_images ?? [];
        const img  = imgs[lightbox.imgIdx];
        const src  = img?.url ?? img?.image_url ?? img?.path ?? '';
        return (
          <div className="sacd-lightbox-overlay" onClick={closeLightbox}>
            <div className="sacd-lightbox-modal" onClick={e => e.stopPropagation()}>

              <div className="sacd-lb-topbar">
                <div className="sacd-lb-info">
                  <div className="sacd-lb-album-title">
                    {lightbox.album.title ?? lightbox.album.uploaded_by}
                  </div>
                  <div className="sacd-lb-album-meta">
                    {lightbox.album.created_at} · {imgs.length} photos
                  </div>
                </div>
                <button className="sacd-lb-close" onClick={closeLightbox}>Close</button>
              </div>

              <div className="sacd-lb-img-area">
                <button className="sacd-lb-prev" onClick={lightboxPrev}
                  style={{ opacity: lightbox.imgIdx === 0 ? 0.3 : 1 }}>‹</button>
                <img src={src} alt="Activity" className="sacd-lb-img" />
                <button className="sacd-lb-next" onClick={lightboxNext}
                  style={{ opacity: lightbox.imgIdx === imgs.length - 1 ? 0.3 : 1 }}>›</button>
              </div>

              <div className="sacd-lb-caption-row">
                <span className="sacd-lb-caption">{img?.caption || lightbox.album.caption || ''}</span>
                <span className="sacd-lb-counter">{lightbox.imgIdx + 1} / {imgs.length}</span>
              </div>

              <div className="sacd-lb-thumbs">
                {imgs.map((im, idx) => {
                  const ts = im.url ?? im.image_url ?? im.path ?? '';
                  return (
                    <div key={im.id ?? idx}
                      className={`sacd-lb-thumb${idx === lightbox.imgIdx ? ' active' : ''}`}
                      onClick={() => setLightbox({ ...lightbox, imgIdx: idx })}>
                      <img src={ts} alt="" />
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        );
      })(), document.body)}

      {/* ── EDIT MODAL ── */}
      {editModal && createPortal(
        <div className="ac-modal-backdrop" onClick={() => setEditModal(false)}>
          <div className="ac-modal" onClick={e => e.stopPropagation()}>
            <div className="ac-modal-header">
              <span className="ac-modal-title">Edit Club</span>
              <button className="ac-modal-close" onClick={() => setEditModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-form-group">
                <label className="ac-form-label">
                  Club Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input className="ac-form-input" type="text" value={editName}
                  onChange={e => setEditName(e.target.value)} maxLength={255} />
              </div>
              <div className="ac-form-group">
                <label className="ac-form-label">
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select className="ac-form-input" value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="ac-form-group">
                <label className="ac-form-label">Description</label>
                <textarea className="ac-form-textarea" value={editDescription}
                  onChange={e => setEditDescription(e.target.value)} rows={4} />
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

    </SuperAdminLayout>
  );
}