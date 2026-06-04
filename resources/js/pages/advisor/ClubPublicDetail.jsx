import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/advisor.css';
import '../../styles/advisor/club-detail.css';

export default function ClubPublicDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [club, setClub] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // { album, imgIdx }

  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropLeft, setDropLeft] = useState(0);
  const dropCloseTimer = useRef(null);
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
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/clubs', { headers });
      const list = res.data.data || res.data || [];
      const found = list.find(c => String(c.id) === String(id));
      setClub(found || null);
      setLoading(false);
      if (found) fetchAlbums(found, headers);
    } catch (err) {
      console.error('Failed to fetch club:', err);
      setLoading(false);
    }
  };

  const fetchAlbums = async (clubData, headers) => {
    try {
      const res = await axios.get('/api/albums', { headers });
      const allAlbums = res.data.albums || res.data || [];
      setAlbums(allAlbums);
    } catch {
      setAlbums([]);
    } finally {
      setAlbumsLoading(false);
    }
  };

  const fetchNavData = async () => {
    try {
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
      await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
    sessionStorage.clear();
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
  const openLightbox = (album, imgIdx) => setLightbox({ album, imgIdx });
  const closeLightbox = () => setLightbox(null);
  const lightboxNext = () => {
    if (!lightbox) return;
    const imgs = lightbox.album.images || [];
    if (lightbox.imgIdx < imgs.length - 1) setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx + 1 });
  };
  const lightboxPrev = () => {
    if (!lightbox) return;
    if (lightbox.imgIdx > 0) setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx - 1 });
  };

  const TopBar = () => (
    <div className="top-announcement-bar">
      <div className="tab-left">
        <a href="#" className="tab-link">Announcements</a>
        <span className="tab-sep">|</span>
        <a href="#" className="tab-link">About Us</a>
        <span className="tab-sep">|</span>
        <a href="#" className="tab-link">Audit Report</a>
      </div>
    </div>
  );

  if (loading) return (
    <div className="advisor-page">
      <TopBar />
      <div className="cd-loading">
        <div className="cd-spinner" />
        <p>Loading club...</p>
      </div>
    </div>
  );

  if (!club) return (
    <div className="advisor-page">
      <TopBar />
      <div className="cd-loading">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <p style={{ color: '#888' }}>Club not found.</p>
        <button
          onClick={() => navigate('/advisor/dashboard')}
          style={{ marginTop: 16, padding: '8px 18px', borderRadius: 9, border: '0.5px solid #ddd', background: '#fff', cursor: 'pointer' }}
        >
          ← Back to Directory
        </button>
      </div>
    </div>
  );

  const objectives = parseObjectives(club.objectives);
  const catName = club.category || '';

  return (
    <div className="advisor-page">

      {/* ══ BAR 1: Thin white announcement bar ══ */}
      <TopBar />

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
          {categories.map(cat => {
            const isOpen = openDropdown === cat.id;
            const catClubs = clubs.filter(c => c.category === cat.name);
            return (
              <div
                className="nav-cat-item"
                key={cat.id}
                onMouseEnter={(e) => {
                  if (dropCloseTimer.current) clearTimeout(dropCloseTimer.current);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropLeft(rect.left);
                  setOpenDropdown(cat.id);
                }}
                onMouseLeave={() => {
                  dropCloseTimer.current = setTimeout(() => setOpenDropdown(null), 120);
                }}
              >
                <button className={`nav-cat-btn${isOpen ? ' open' : ''}`}>
                  {cat.name} <span className="arr">▾</span>
                </button>
                <div
                  className="cat-dropdown"
                  style={{ display: isOpen ? 'block' : 'none', position: 'fixed', top: '82px', left: dropLeft + 'px', zIndex: 999999 }}
                  onMouseEnter={() => { if (dropCloseTimer.current) clearTimeout(dropCloseTimer.current); }}
                  onMouseLeave={() => { dropCloseTimer.current = setTimeout(() => setOpenDropdown(null), 120); }}
                >
                  {catClubs.map(c => (
                    <div className="cat-dd-item" key={c.id} onClick={() => goToClub(c.id)}>{c.name}</div>
                  ))}
                  {catClubs.length === 0 && (
                    <div className="cat-dd-item" style={{ color: '#bbb', cursor: 'default' }}>No clubs yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="nav-mobile-search">
          <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 15 }}>⌕</span>
          <input type="text" placeholder="Search clubs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="nav-right">
          <div className="nav-search">
            <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 15 }}>⌕</span>
            <input type="text" placeholder="Search clubs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
          <button className={`hamburger${menuOpen ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => { setOpenDropdown(null); setMenuOpen(false); }} />
      )}

      {/* ══ CLUB DETAIL CONTENT ══ */}
      <div className="cd-page">

        {/* BREADCRUMB */}
        <div className="cd-breadcrumb">
          <button className="cd-bc-link" onClick={() => navigate('/advisor/dashboard')}>Dashboard</button>
          <span className="cd-bc-sep">›</span>
          <button className="cd-bc-link" onClick={() => navigate('/advisor/dashboard')}>{catName || 'Clubs'}</button>
          <span className="cd-bc-sep">›</span>
          <span className="cd-bc-cur">{club.name}</span>
        </div>

        {/* DARK BANNER */}
        <div className="cd-banner">
          <div className="cd-banner-bg" />
          <div className="cd-banner-overlay" />
          <div className="cd-banner-content">
            {/* Avatar */}
            <div className="cd-banner-avatar">{club.name.charAt(0).toUpperCase()}</div>

            {/* Info */}
            <div className="cd-banner-info">
              <span className="cd-banner-cat">{catName}</span>
              <h1 className="cd-banner-name">{club.name}</h1>
              <div className="cd-banner-meta">
                <span>{club.members_count || 0} members</span>
                {club.advisor?.name && (
                  <><span className="cd-meta-dot">·</span><span>Advisor: {club.advisor.name}</span></>
                )}
                {club.secretary && (
                  <><span className="cd-meta-dot">·</span><span>Secretary: {club.secretary}</span></>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FULL WIDTH SECTIONS */}
        <div className="cd-body">
          {club.aim && (
            <div className="cd-section">
              <div className="cd-section-label">AIM</div>
              <div className="cd-section-divider" />
              <p className="cd-section-text">{club.aim}</p>
            </div>
          )}

          {club.description && (
            <div className="cd-section">
              <div className="cd-section-label">DESCRIPTION</div>
              <div className="cd-section-divider" />
              <p className="cd-section-text">{club.description}</p>
            </div>
          )}

          {objectives.length > 0 && (
            <div className="cd-section">
              <div className="cd-section-label">OBJECTIVES</div>
              <div className="cd-section-divider" />
              <ul className="cd-objectives">
                {objectives.map((obj, i) => (
                  <li key={i} className="cd-obj-item">
                    <span className="cd-obj-num">{i + 1}</span>
                    <span className="cd-obj-text">{typeof obj === 'string' ? obj : obj.objective || obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CLUB ACTIVITIES */}
          <div className="cd-albums-section">
            <div className="cd-albums-header">
              <div className="cd-albums-title">Club Activities</div>
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
                {albums.map((album) => (
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
                    {album.caption && <p className="cd-album-caption">{album.caption}</p>}
                    {album.images && album.images.length > 0 && (
                      <div className="cd-album-images">
                        {album.images.map((img, imgIdx) => (
                          <div
                            key={img.id}
                            className="cd-album-img-wrap"
                            onClick={() => openLightbox(album, imgIdx)}
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

      <footer className="footer">
        <span className="ft-l">© JNEC Club Directory</span>
        <span className="ft-r">Jigme Namgyel Engineering College</span>
      </footer>

      {/* LIGHTBOX MODAL — same as student */}
      {lightbox && lightbox.album && (
        <div className="cd-lightbox-overlay" onClick={closeLightbox}>
          <div className="cd-lightbox-modal" onClick={e => e.stopPropagation()}>

            {/* TOP BAR */}
            <div className="cd-lb-topbar">
              <div className="cd-lb-info">
                <div className="cd-lb-album-title">{lightbox.album.uploaded_by || lightbox.album.title}</div>
                <div className="cd-lb-album-meta">{lightbox.album.created_at} · {lightbox.album.images?.length || 0} photos</div>
              </div>
              <button className="cd-lb-close" onClick={closeLightbox}>Close</button>
            </div>

            {/* IMAGE */}
            <div className="cd-lb-img-area">
              <button className="cd-lb-prev" onClick={lightboxPrev} style={{ opacity: lightbox.imgIdx === 0 ? 0.3 : 1 }}>‹</button>
              <img src={lightbox.album.images[lightbox.imgIdx]?.url} alt="Activity" className="cd-lb-img" />
              <button className="cd-lb-next" onClick={lightboxNext} style={{ opacity: lightbox.imgIdx === (lightbox.album.images.length - 1) ? 0.3 : 1 }}>›</button>
            </div>

            {/* CAPTION + COUNTER */}
            <div className="cd-lb-caption-row">
              <span className="cd-lb-caption">{lightbox.album.caption || ''}</span>
              <span className="cd-lb-counter">{lightbox.imgIdx + 1} / {lightbox.album.images.length}</span>
            </div>

            {/* THUMBNAILS */}
            <div className="cd-lb-thumbs">
              {lightbox.album.images.map((img, idx) => (
                <div
                  key={img.id}
                  className={`cd-lb-thumb${idx === lightbox.imgIdx ? ' active' : ''}`}
                  onClick={() => setLightbox({ ...lightbox, imgIdx: idx })}
                >
                  <img src={img.url} alt="" />
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
