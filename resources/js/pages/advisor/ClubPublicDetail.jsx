import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/advisor.css';
import '../../styles/advisor/club-detail.css';

const CAT_BG = {
  'Sports': '#e6f1fb', 'Volunteering': '#e1f5ee', 'Technology': '#eeedfe',
  'Arts & Culture': '#fbeaf0', 'Entertainment': '#faeeda',
  'Maintenance': '#f1efe8', 'Social Service': '#faece7',
};
const CAT_TC = {
  'Sports': '#0c447c', 'Volunteering': '#085041', 'Technology': '#3c3489',
  'Arts & Culture': '#72243e', 'Entertainment': '#633806',
  'Maintenance': '#2c2c2a', 'Social Service': '#712b13',
};

export default function ClubPublicDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [club, setClub] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // { albumIdx, imgIdx }

  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMobileCat, setOpenMobileCat] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClub();
    fetchNavData();
    const onScroll = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [id]);

  const fetchClub = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      // Fetch all clubs and find by id
      const res = await axios.get('/api/clubs', { headers });
      const list = res.data.data || res.data || [];
      const found = list.find(c => String(c.id) === String(id));
      setClub(found || null);
      setLoading(false);
      // Now fetch albums for this club's advisor
      if (found) fetchAlbums(found, headers);
    } catch (err) {
      console.error('Failed to fetch club:', err);
      setLoading(false);
    }
  };

  const fetchAlbums = async (clubData, headers) => {
    try {
      // Albums API uses advisor auth — fetch as current logged-in user
      // If viewing own club, this returns albums. For other clubs, advisor must be logged in.
      const res = await axios.get('/api/albums', { headers });
      const allAlbums = res.data.albums || res.data || [];
      setAlbums(allAlbums);
    } catch (err) {
      // If not the advisor of this club, albums may not load — that's okay
      setAlbums([]);
    } finally {
      setAlbumsLoading(false);
    }
  };

  const fetchNavData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [catsRes, clubsRes] = await Promise.allSettled([
        axios.get('/api/categories', { headers }),
        axios.get('/api/clubs', { headers }),
      ]);
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value.data.data || catsRes.value.data || []);
      if (clubsRes.status === 'fulfilled') setClubs(clubsRes.value.data.data || clubsRes.value.data || []);
    } catch (err) {
      console.error('Nav fetch error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
    localStorage.clear();
    navigate('/login');
  };

  const goToClub = (clubId) => {
    setOpenDropdown(null);
    setMenuOpen(false);
    navigate(`/advisor/clubs/${clubId}`);
  };

  const parseObjectives = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
  };

  // Lightbox navigation
  const openLightbox = (albumIdx, imgIdx) => setLightbox({ albumIdx, imgIdx });
  const closeLightbox = () => setLightbox(null);
  const lightboxNext = () => {
    if (!lightbox) return;
    const imgs = albums[lightbox.albumIdx]?.images || [];
    if (lightbox.imgIdx < imgs.length - 1) setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx + 1 });
  };
  const lightboxPrev = () => {
    if (!lightbox) return;
    if (lightbox.imgIdx > 0) setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx - 1 });
  };

  if (loading) {
    return (
      <div className="advisor-page">
        <div className="top-announcement-bar">
          <div className="tab-left">
            <a href="#" className="tab-link">Announcements</a>
            <span className="tab-sep">|</span>
            <a href="#" className="tab-link">About Us</a>
            <span className="tab-sep">|</span>
            <a href="#" className="tab-link">Audit Report</a>
          </div>
        </div>
        <div className="cd-loading">
          <div className="cd-spinner" />
          <p>Loading club...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="advisor-page">
        <div className="top-announcement-bar">
          <div className="tab-left">
            <a href="#" className="tab-link">Announcements</a>
            <span className="tab-sep">|</span>
            <a href="#" className="tab-link">About Us</a>
            <span className="tab-sep">|</span>
            <a href="#" className="tab-link">Audit Report</a>
          </div>
        </div>
        <div className="cd-loading">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ color: '#888' }}>Club not found.</p>
          <button className="cd-back-btn" onClick={() => navigate('/advisor/dashboard')} style={{ marginTop: 16 }}>
            ← Back to Directory
          </button>
        </div>
      </div>
    );
  }

  const objectives = parseObjectives(club.objectives);
  const catName = club.category || '';
  const catBg = CAT_BG[catName] || '#f3f4f6';
  const catTc = CAT_TC[catName] || '#555';

  return (
    <div className="advisor-page">

      {/* ══ BAR 1: Thin white announcement bar ══ */}
      <div className="top-announcement-bar">
        <div className="tab-left">
          <a href="#" className="tab-link">Announcements</a>
          <span className="tab-sep">|</span>
          <a href="#" className="tab-link">About Us</a>
          <span className="tab-sep">|</span>
          <a href="#" className="tab-link">Audit Report</a>
        </div>
      </div>

      {/* ══ BAR 2: Main dark navbar ══ */}
      <nav className={`nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="nav-left">
          <div className="nav-logo">
            <img src="/image/logo-removebg-preview.png" alt="JNEC Logo" />
          </div>
          <span className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/advisor/dashboard')}>
            JNEC Clubs
          </span>
        </div>

        <div className="nav-cats">
          {categories.map(cat => (
            <div className="nav-cat-item" key={cat.id}>
              <button
                className={`nav-cat-btn${openDropdown === cat.id ? ' open' : ''}`}
                onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === cat.id ? null : cat.id); }}
              >
                {cat.name} <span className="arr">▾</span>
              </button>
              <div className="cat-dropdown" style={{ display: openDropdown === cat.id ? 'block' : 'none', position: 'absolute', zIndex: 999999 }}>
                {clubs.filter(c => c.category === cat.name).map(c => (
                  <div className="cat-dd-item" key={c.id}
                    onClick={(e) => { e.stopPropagation(); goToClub(c.id); }}>
                    {c.name}
                  </div>
                ))}
                {clubs.filter(c => c.category === cat.name).length === 0 && (
                  <div className="cat-dd-item" style={{ color: '#bbb', cursor: 'default' }}>No clubs yet</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="nav-mobile-search">
          <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 15 }}>⌕</span>
          <input type="text" placeholder="Search clubs..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="nav-right">
          <div className="nav-search">
            <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 15 }}>⌕</span>
            <input type="text" placeholder="Search clubs..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
          <button className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="mobile-menu-inner">
          <div className="mobile-nav-links">
            <button className="mobile-nfl" onClick={() => setMenuOpen(false)}>Announcements</button>
            <button className="mobile-nfl" onClick={() => { navigate('/advisor/dashboard'); setMenuOpen(false); }}>Browse Clubs</button>
          </div>
          <div className="mobile-cats-title">Categories</div>
          <div className="mobile-cats">
            {categories.map(cat => (
              <div className={`mobile-cat-section${openMobileCat === cat.id ? ' expanded' : ''}`} key={cat.id}>
                <div className="mobile-cat-header" onClick={() => setOpenMobileCat(openMobileCat === cat.id ? null : cat.id)}>
                  {cat.name}
                </div>
                <div className="mobile-cat-list">
                  {clubs.filter(c => c.category === cat.name).map(c => (
                    <div className="mobile-cat-club" key={c.id} onClick={() => goToClub(c.id)}>{c.name}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(openDropdown || menuOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 299 }}
          onClick={() => { setOpenDropdown(null); setMenuOpen(false); }} />
      )}

      {/* ══ CLUB DETAIL CONTENT ══ */}
      <div className="cd-page">

        {/* Back button */}
        <div className="cd-breadcrumb">
          <button className="cd-back-btn" onClick={() => navigate('/advisor/dashboard')}>
            ← Back to Directory
          </button>
        </div>

        {/* Club Hero Banner */}
        <div className="cd-hero" style={{ background: catBg }}>
          <div className="cd-hero-avatar" style={{ background: catTc }}>
            {club.name.charAt(0).toUpperCase()}
          </div>
          <div className="cd-hero-info">
            <span className="cd-cat-pill" style={{ background: catBg, color: catTc, border: `1px solid ${catTc}33` }}>
              {catName}
            </span>
            <h1 className="cd-club-name">{club.name}</h1>
            <div className="cd-hero-meta">
              {club.advisor && (
                <span className="cd-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Advisor: {club.advisor?.name || '—'}
                </span>
              )}
              {club.secretary && (
                <span className="cd-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Secretary: {club.secretary}
                </span>
              )}
              <span className="cd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {club.members_count || 0} Members
              </span>
            </div>
          </div>
        </div>

        {/* Club Info Grid */}
        <div className="cd-body">
          <div className="cd-grid">

            {/* Left Column */}
            <div className="cd-left">
              {/* Aim */}
              {club.aim && (
                <div className="cd-section">
                  <div className="cd-section-label">🎯 Aim</div>
                  <p className="cd-section-text">{club.aim}</p>
                </div>
              )}

              {/* Description */}
              {club.description && (
                <div className="cd-section">
                  <div className="cd-section-label">📋 Description</div>
                  <p className="cd-section-text">{club.description}</p>
                </div>
              )}

              {/* Objectives */}
              {objectives.length > 0 && (
                <div className="cd-section">
                  <div className="cd-section-label">✅ Objectives</div>
                  <ul className="cd-objectives">
                    {objectives.map((obj, i) => (
                      <li key={i} className="cd-obj-item">
                        <span className="cd-obj-bullet" style={{ background: catTc }} />
                        <span>{typeof obj === 'string' ? obj : obj.objective || obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column - Quick Info */}
            <div className="cd-right">
              <div className="cd-info-card">
                <div className="cd-info-title">Club Info</div>
                <div className="cd-info-row">
                  <span className="cd-info-label">Category</span>
                  <span className="cd-info-val" style={{ color: catTc }}>{catName || '—'}</span>
                </div>
                <div className="cd-info-divider" />
                <div className="cd-info-row">
                  <span className="cd-info-label">Advisor</span>
                  <span className="cd-info-val">{club.advisor?.name || '—'}</span>
                </div>
                <div className="cd-info-divider" />
                <div className="cd-info-row">
                  <span className="cd-info-label">Secretary</span>
                  <span className="cd-info-val">{club.secretary || '—'}</span>
                </div>
                <div className="cd-info-divider" />
                <div className="cd-info-row">
                  <span className="cd-info-label">Members</span>
                  <span className="cd-info-val">{club.members_count || 0}</span>
                </div>
                <div className="cd-info-divider" />
                <div className="cd-info-row">
                  <span className="cd-info-label">Status</span>
                  <span className="cd-status-pill">{club.status || 'Active'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ ACTIVITIES / ALBUMS SECTION ══ */}
          <div className="cd-albums-section">
            <div className="cd-albums-header">
              <div className="cd-albums-title">📸 Club Activities</div>
              <p className="cd-albums-sub">Work programs and activities posted by the advisor</p>
            </div>

            {albumsLoading ? (
              <div className="cd-albums-loading">
                <div className="cd-spinner" />
                <p>Loading activities...</p>
              </div>
            ) : albums.length === 0 ? (
              <div className="cd-no-albums">
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <p>No activities posted yet.</p>
                <span>The advisor hasn't uploaded any work program images yet.</span>
              </div>
            ) : (
              <div className="cd-albums-list">
                {albums.map((album, albumIdx) => (
                  <div className="cd-album-card" key={album.id}>
                    <div className="cd-album-header">
                      <div>
                        <div className="cd-album-title">{album.title}</div>
                        <div className="cd-album-meta">
                          <span>By {album.uploaded_by}</span>
                          <span className="cd-album-dot">·</span>
                          <span>{album.created_at}</span>
                        </div>
                      </div>
                      <span className="cd-album-count">{album.images?.length || 0} photos</span>
                    </div>
                    {album.caption && (
                      <p className="cd-album-caption">{album.caption}</p>
                    )}
                    {album.images && album.images.length > 0 && (
                      <div className="cd-album-images">
                        {album.images.map((img, imgIdx) => (
                          <div
                            key={img.id}
                            className="cd-album-img-wrap"
                            onClick={() => openLightbox(albumIdx, imgIdx)}
                          >
                            <img src={img.url} alt={img.file_name} className="cd-album-img" />
                            <div className="cd-img-overlay">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightbox !== null && albums[lightbox.albumIdx] && (
        <div className="cd-lightbox" onClick={closeLightbox}>
          <div className="cd-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="cd-lb-close" onClick={closeLightbox}>✕</button>
            <button className="cd-lb-prev" onClick={lightboxPrev}
              style={{ opacity: lightbox.imgIdx === 0 ? 0.3 : 1 }}>‹</button>
            <img
              src={albums[lightbox.albumIdx].images[lightbox.imgIdx]?.url}
              alt="Activity"
              className="cd-lb-img"
            />
            <button className="cd-lb-next" onClick={lightboxNext}
              style={{ opacity: lightbox.imgIdx === (albums[lightbox.albumIdx].images.length - 1) ? 0.3 : 1 }}>›</button>
            <div className="cd-lb-caption">
              {lightbox.imgIdx + 1} / {albums[lightbox.albumIdx].images.length}
              {albums[lightbox.albumIdx].title && ` · ${albums[lightbox.albumIdx].title}`}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <span className="ft-l">© 2025 JNEC Club Directory</span>
        <span className="ft-r">Jigme Namgyel Engineering College</span>
      </footer>
    </div>
  );
}