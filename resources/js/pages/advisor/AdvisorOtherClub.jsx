import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/advisor.css';
import '../../styles/advisor/advisorOtherClub.css';

const CAT_AVATAR_BG = {
  Volunteering:      '#0a4a36',
  Maintenance:       '#2c2c2a',
  'Social Service':  '#5a1e0a',
  Entrepreneurship:  '#4a2a04',
  Entertainment:     '#4a2a04',
  Sports:            '#0a3060',
};

export default function AdvisorOtherClub() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [club,          setClub]          = useState(null);
  const [albums,        setAlbums]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [error,         setError]         = useState('');
  const [lightbox,      setLightbox]      = useState(null);
  const [navScrolled,   setNavScrolled]   = useState(false);
  const [categories,    setCategories]    = useState([]);
  const [allClubs,      setAllClubs]      = useState([]);
  const [searchQuery,   setSearchQuery]   = useState('');

  /* hamburger */
  const [hamOpen,     setHamOpen]     = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const hamRef = useRef(null);

  useEffect(() => {
    fetchData();
    const onScroll = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [id]);

  /* close hamburger on outside click */
  useEffect(() => {
    const fn = (e) => {
      if (hamRef.current && !hamRef.current.contains(e.target)) {
        setHamOpen(false); setSelectedCat(null);
      }
    };
    if (hamOpen) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [hamOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const headers = { Authorization: `Bearer ${token}` };

      const [clubsRes, catsRes] = await Promise.allSettled([
        axios.get('/api/clubs',      { headers }),
        axios.get('/api/categories', { headers }),
      ]);

      const clubList = clubsRes.status === 'fulfilled'
        ? (clubsRes.value.data?.clubs ?? clubsRes.value.data?.data ?? clubsRes.value.data ?? []) : [];
      const catList  = catsRes.status === 'fulfilled'
        ? (catsRes.value.data?.data  ?? catsRes.value.data  ?? []) : [];

      setAllClubs(clubList);
      setCategories(catList);

      const found = clubList.find(c => String(c.id) === String(id));
      if (!found) { setError('Club not found.'); setLoading(false); return; }
      setClub(found);
      setLoading(false);

      try {
        const albumRes = await axios.get(`/api/student/clubs/${found.id}/albums`, { headers });
        setAlbums(albumRes.data?.albums ?? []);
      } catch {
        setAlbums([]);
      } finally {
        setAlbumsLoading(false);
      }
    } catch {
      setError('Failed to load club details.');
      setLoading(false);
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

  const triggerSearch = () => {
    if (searchQuery.trim())
      navigate(`/advisor/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
  };
  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') triggerSearch(); };

  const getCatName = c => c?.category?.name ?? c?.category ?? '';

  const parseObjectives = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return raw.split('\n').filter(Boolean); }
  };

  const openLightbox  = (album, imgIdx) => setLightbox({ album, imgIdx });
  const closeLightbox = () => setLightbox(null);
  const lightboxNext  = () => {
    if (!lightbox) return;
    const imgs = lightbox.album.images ?? lightbox.album.album_images ?? [];
    if (lightbox.imgIdx < imgs.length - 1) setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx + 1 });
  };
  const lightboxPrev  = () => {
    if (!lightbox) return;
    if (lightbox.imgIdx > 0) setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx - 1 });
  };

  const toggleHam = () => {
    if (hamOpen) { setHamOpen(false); setSelectedCat(null); }
    else {
      setHamOpen(true);
      if (categories.length > 0) setSelectedCat(categories[0].name ?? categories[0]);
    }
  };

  /* group clubs by category */
  const clubsByCategory = {};
  categories.forEach(cat => {
    const n = cat.name ?? cat;
    clubsByCategory[n] = allClubs.filter(c => getCatName(c) === n);
  });
  const panelClubs = selectedCat ? (clubsByCategory[selectedCat] ?? []) : [];

  const TopBar = () => (
    <div className="top-announcement-bar">
      <div className="tab-left">
        <a href="#" className="tab-link" onClick={e => { e.preventDefault(); navigate('/advisor/announcements'); }}>
          Announcements
        </a>
      </div>
      <div className="tab-right">
        <div className="tab-search">
          <span className="tab-search-icon">⌕</span>
          <input type="text" placeholder="Search clubs..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} />
          {searchQuery && <button className="tab-search-go" onClick={triggerSearch}>↵</button>}
        </div>
        <button className="tab-logout-btn" onClick={handleLogout}>Log out</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="advisor-page">
      <TopBar />
      <div className="aoc-loading">
        <div className="aoc-spinner" />
        <p>Loading club...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="advisor-page">
      <TopBar />
      <div className="aoc-loading">
        <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
        <p style={{ color:'#888' }}>{error}</p>
        <button onClick={() => navigate('/advisor/dashboard')}
          style={{ marginTop:16, padding:'8px 18px', borderRadius:9, border:'0.5px solid #ddd', background:'#fff', cursor:'pointer' }}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  const catName    = getCatName(club);
  const objectives = parseObjectives(club.objectives);
  const avatarBg   = CAT_AVATAR_BG[catName] ?? '#0c1b33';

  return (
    <div className="advisor-page">

      <TopBar />

      {/* ── BAR 2: No categories, logo clickable, white hamburger ── */}
      <nav className={`nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="nav-left">
          {/* LOGO — click goes back to advisor home */}
          <div className="nav-logo" style={{cursor:'pointer'}} onClick={() => navigate('/advisor/dashboard')}>
            <img src="/image/logo-removebg-preview.png" alt="JNEC Logo" />
          </div>
          <span className="nav-brand" style={{cursor:'pointer'}} onClick={() => navigate('/advisor/dashboard')}>
            JNEC Clubs
          </span>
          <div style={{marginLeft:10}}>
            <button style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'rgba(255,255,255,.55)',padding:'6px 12px',borderRadius:6}}
              onClick={() => navigate('/advisor/dashboard')}>Home</button>
          </div>
        </div>

        <div style={{flex:1}} />

        <div className="nav-mobile-search">
          <span style={{ color:'rgba(255,255,255,.35)', fontSize:15 }}>⌕</span>
          <input type="text" placeholder="Search clubs..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} />
        </div>

        <div className="nav-right">
          {/* WHITE HAMBURGER — same 2-panel */}
          <div className="pub-hamburger-wrap" ref={hamRef}>
            <button
              className={`pub-hamburger-btn ${hamOpen ? 'open' : ''}`}
              onClick={toggleHam}
              aria-label="Browse categories"
            >
              <span/><span/><span/>
            </button>

            {hamOpen && (
              <div className="pub-ham-panel">
                {/* LEFT: categories */}
                <div className="pub-ham-cats-side">
                  <div className="pub-ham-side-title">CATEGORIES</div>
                  {categories.map(cat => {
                    const cName = cat.name ?? cat;
                    const count = (clubsByCategory[cName] ?? []).length;
                    return (
                      <div
                        key={cName}
                        className={`pub-ham-cat-row ${selectedCat === cName ? 'active' : ''}`}
                        onClick={() => setSelectedCat(cName)}
                      >
                        <span className="pub-ham-cat-name">{cName}</span>
                        <span className="pub-ham-cat-badge">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pub-ham-divider" />

                {/* RIGHT: club cards */}
                <div className="pub-ham-clubs-side">
                  {selectedCat ? (
                    <>
                      <div className="pub-ham-side-title">{selectedCat}</div>
                      {panelClubs.length === 0 ? (
                        <div className="pub-ham-empty">No clubs in this category yet</div>
                      ) : (
                        <div className="pub-ham-clubs-list">
                          {panelClubs.map(c => (
                            <div
                              key={c.id}
                              className="pub-ham-club-card"
                              onClick={() => { navigate(`/advisor/clubs/${c.id}`); setHamOpen(false); setSelectedCat(null); }}
                            >
                              {c.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="pub-ham-empty">Select a category</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── FULL WIDTH PAGE ── */}
      <div className="aoc-page-wrap">

        <div className="aoc-breadcrumb">
          <span className="aoc-bc-link" onClick={() => navigate('/advisor/dashboard')}>Dashboard</span>
          <span className="aoc-bc-sep">›</span>
          <span className="aoc-bc-link" onClick={() => navigate('/advisor/dashboard')}>{catName || 'Clubs'}</span>
          <span className="aoc-bc-sep">›</span>
          <span className="aoc-bc-cur">{club.name}</span>
        </div>

        <div className="aoc-banner">
          <div className="aoc-banner-bg" style={club.cover_photo ? {backgroundImage:`url('/storage/${club.cover_photo}')`} : {}} />
          <div className="aoc-banner-overlay" />
          <div className="aoc-banner-content">
            <div className="aoc-banner-avatar" style={{ background: avatarBg }}>
              {club.name?.charAt(0).toUpperCase()}
            </div>
            <div className="aoc-banner-info">
              <span className="aoc-banner-cat">{catName}</span>
              <h1 className="aoc-banner-name">{club.name}</h1>
              <div className="aoc-banner-meta">
                <span>{club.members_count ?? club.members ?? 0} members</span>
                {club.advisor?.name && <><span className="aoc-meta-dot">·</span><span>Advisor: {club.advisor.name}</span></>}
                {club.co_advisors?.length > 0 && <><span className="aoc-meta-dot">·</span><span>Co-Advisor: {club.co_advisors.map(ca=>ca.name).join(', ')}</span></>}
                {club.secretaries?.length > 0 && <><span className="aoc-meta-dot">·</span><span>Secretary: {club.secretaries.map(s=>s.name).join(', ')}</span></>}
              </div>
            </div>
          </div>
        </div>

        <div className="aoc-body">
          {club.aim && (
            <div className="aoc-section">
              <div className="aoc-section-label">AIM</div>
              <div className="aoc-section-divider" />
              <p className="aoc-section-text">{club.aim}</p>
            </div>
          )}
          {club.description && (
            <div className="aoc-section">
              <div className="aoc-section-label">DESCRIPTION</div>
              <div className="aoc-section-divider" />
              <p className="aoc-section-text">{club.description}</p>
            </div>
          )}
          {objectives.length > 0 && (
            <div className="aoc-section">
              <div className="aoc-section-label">OBJECTIVES</div>
              <div className="aoc-section-divider" />
              <ul className="aoc-objectives">
                {objectives.map((obj, i) => (
                  <li key={i} className="aoc-obj-item">
                    <span className="aoc-obj-num">{i + 1}</span>
                    <span className="aoc-obj-text">{typeof obj === 'string' ? obj : obj.objective ?? obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="aoc-albums-section">
            <div className="aoc-albums-header">
              <div className="aoc-albums-title">Club Activities</div>
              <p className="aoc-albums-sub">Work programs and activities posted by the advisor</p>
            </div>
            {albumsLoading ? (
              <div className="aoc-albums-loading">
                <div className="aoc-spinner" />
                <p>Loading activities...</p>
              </div>
            ) : albums.length === 0 ? (
              <div className="aoc-no-albums">
                <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
                <p>No activities posted yet.</p>
                <span>No work program images uploaded yet.</span>
              </div>
            ) : (
              <div className="aoc-albums-list">
                {albums.map((album) => {
                  const imgs = album.images ?? album.album_images ?? [];
                  return (
                    <div className="aoc-album-card" key={album.id}>
                      <div className="aoc-album-header">
                        <div>
                          <div className="aoc-album-title">{album.title ?? album.name}</div>
                          <div className="aoc-album-meta">
                            <span>By {album.uploaded_by ?? album.advisor ?? '—'}</span>
                            <span className="aoc-album-dot">·</span>
                            <span>{album.created_at}</span>
                          </div>
                        </div>
                        <span className="aoc-album-count">{imgs.length} photos</span>
                      </div>
                      {album.caption && <p className="aoc-album-caption">{album.caption}</p>}
                      {imgs.length > 0 && (
                        <div className="aoc-album-images">
                          {imgs.map((img, imgIdx) => {
                            const src = img.image_url ?? img.url ?? img.path ?? '';
                            return (
                              <div key={img.id ?? imgIdx} className="aoc-album-img-wrap"
                                onClick={() => openLightbox(album, imgIdx)}>
                                <img src={src} alt={img.caption ?? img.file_name ?? `Photo ${imgIdx + 1}`}
                                  className="aoc-album-img"
                                  onError={e => { e.target.style.display = 'none'; }} />
                                <div className="aoc-img-overlay">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
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
        </div>
      </div>

      <footer className="footer">
        <span className="ft-l">© 2025 JNEC Club Directory</span>
        <span className="ft-r">Jigme Namgyel Engineering College</span>
      </footer>

      {/* LIGHTBOX */}
      {lightbox && lightbox.album && (() => {
        const imgs = lightbox.album.images ?? lightbox.album.album_images ?? [];
        const img  = imgs[lightbox.imgIdx];
        const src  = img?.image_url ?? img?.url ?? img?.path ?? '';
        return (
          <div className="aoc-lightbox-overlay" onClick={closeLightbox}>
            <div className="aoc-lightbox-modal" onClick={e => e.stopPropagation()}>
              <div className="aoc-lb-topbar">
                <div className="aoc-lb-info">
                  <div className="aoc-lb-album-title">{lightbox.album.title ?? lightbox.album.name}</div>
                  <div className="aoc-lb-album-meta">{lightbox.album.created_at} · {imgs.length} photos</div>
                </div>
                <button className="aoc-lb-close" onClick={closeLightbox}>Close</button>
              </div>
              <div className="aoc-lb-img-area">
                <button className="aoc-lb-prev" onClick={lightboxPrev} style={{ opacity: lightbox.imgIdx === 0 ? 0.3 : 1 }}>‹</button>
                <img src={src} alt="Activity" className="aoc-lb-img" />
                <button className="aoc-lb-next" onClick={lightboxNext} style={{ opacity: lightbox.imgIdx === imgs.length - 1 ? 0.3 : 1 }}>›</button>
              </div>
              <div className="aoc-lb-caption-row">
                <span className="aoc-lb-caption">{lightbox.album.caption || ''}</span>
                <span className="aoc-lb-counter">{lightbox.imgIdx + 1} / {imgs.length}</span>
              </div>
              <div className="aoc-lb-thumbs">
                {imgs.map((im, idx) => {
                  const ts = im.image_url ?? im.url ?? im.path ?? '';
                  return (
                    <div key={im.id ?? idx}
                      className={`aoc-lb-thumb${idx === lightbox.imgIdx ? ' active' : ''}`}
                      onClick={() => setLightbox({ ...lightbox, imgIdx: idx })}>
                      <img src={ts} alt="" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}