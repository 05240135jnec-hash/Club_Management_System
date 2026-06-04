import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/public.css';
import '../../styles/club-detail.css';

export default function ClubPublicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [club,          setClub]          = useState(null);
  const [albums,        setAlbums]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [lightbox,      setLightbox]      = useState(null);

  const [scrolled,    setScrolled]    = useState(false);
  const [hamOpen,     setHamOpen]     = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [categories,  setCategories]  = useState([]);
  const [allClubs,    setAllClubs]    = useState([]);
  const hamRef = useRef(null);

  /* ── Fetch ── */
  const fetchClubData = async () => {
    try {
      setLoading(true);
      const [clubsRes, catsRes] = await Promise.all([
        axios.get('/api/clubs'),
        axios.get('/api/categories'),
      ]);
      const clubList = clubsRes.data.clubs ?? clubsRes.data ?? [];
      const catList  = catsRes.data.categories ?? catsRes.data ?? [];
      setAllClubs(clubList);
      setCategories(catList);

      const found = clubList.find(c => String(c.id) === String(id));
      if (!found) { setLoading(false); return; }
      setClub(found);
      setLoading(false);

      try {
        const albumRes = await axios.get(`/api/public/clubs/${found.id}/albums`, {
          params: { club_id: found.id }
        });
        setAlbums(albumRes.data.albums ?? albumRes.data ?? []);
      } catch {
        setAlbums([]);
      } finally {
        setAlbumsLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClubData(); }, [id]);
  useEffect(() => { const i = setInterval(fetchClubData, 30000); return () => clearInterval(i); }, [id]);
  useEffect(() => {
    const fn = () => { if (!document.hidden) fetchClubData(); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, [id]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

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

  /* helpers */
  const getCatName = c => c?.category?.name ?? c?.category ?? '';

  const clubsByCategory = {};
  categories.forEach(cat => {
    const n = cat.name ?? cat;
    clubsByCategory[n] = allClubs.filter(c => getCatName(c) === n);
  });

  const parseObjectives = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
  };

  const handleJoinClick = () => {
    sessionStorage.setItem('jnec_join_intent_id', id);
    navigate(`/login?next=/clubs/${id}`);
  };

  const openLightbox  = (album, imgIdx) => setLightbox({ album, imgIdx });
  const closeLightbox = () => setLightbox(null);
  const lightboxNext  = () => {
    if (!lightbox) return;
    const imgs = lightbox.album.images || [];
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

  const panelClubs = selectedCat ? (clubsByCategory[selectedCat] ?? []) : [];

  /* Loading */
  if (loading) return (
    <div className="pub-root" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div className="pub-spinner" style={{ margin:'0 auto 1rem' }} />
        <p style={{ color:'#888' }}>Loading club...</p>
      </div>
    </div>
  );

  if (!club) return (
    <div className="pub-root" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#c0392b', marginBottom:'1rem' }}>Club not found.</p>
        <button className="pub-btn-browse" onClick={() => navigate('/')}>← Back to clubs</button>
      </div>
    </div>
  );

  const catName    = getCatName(club);
  const objectives = parseObjectives(club.objectives);

  return (
    <div className="pub-root">
      <ScrollProgress />

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`pub-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="pub-nav-left">
          {/* LOGO — click goes to public home */}
          <div className="pub-nav-logo" style={{cursor:'pointer'}} onClick={() => navigate('/')}>
            <img src="/image/logo-removebg-preview.png" alt="JNEC" />
          </div>
          <span className="pub-nav-brand" style={{cursor:'pointer'}} onClick={() => navigate('/')}>JNEC Clubs</span>
          <div className="pub-nav-fixed-links">
            <button className="pub-nfl" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>

        <div style={{flex:1}} />

        <div className="pub-nav-mobile-search">
          <span className="search-icon">⌕</span>
          <input type="text" placeholder="Search clubs..."
            onKeyDown={e => { if (e.key === 'Enter') navigate(`/?search=${e.target.value}`); }} />
        </div>

        <div className="pub-nav-right">
          <div className="pub-nav-search">
            <span className="search-icon">⌕</span>
            <input type="text" placeholder="Search clubs..."
              onKeyDown={e => { if (e.key === 'Enter') navigate(`/?search=${e.target.value}`); }} />
          </div>
          <button className="pub-login-btn" onClick={() => navigate('/login')}>Login</button>

          {/* HAMBURGER — same as PublicHome */}
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
                              onClick={() => { navigate(`/clubs/${c.id}`); setHamOpen(false); setSelectedCat(null); }}
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

                {/* LOGIN BUTTON — mobile only */}
                <div className="pub-ham-login-wrap">
                  <button className="pub-ham-login-btn" onClick={() => { navigate('/login'); setHamOpen(false); }}>
                    Login to your account →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════ CLUB DETAIL ═══════════ */}
      <div className="cd-wrap">

        {/* BREADCRUMB */}
        <div className="cd-breadcrumb">
          <span className="cd-bc-link" onClick={() => navigate('/')}>Home</span>
          <span className="cd-bc-sep">›</span>
          <span className="cd-bc-link" onClick={() => navigate(`/?filter=${encodeURIComponent(catName)}`)}>{catName}</span>
          <span className="cd-bc-sep">›</span>
          <span className="cd-bc-cur">{club.name}</span>
        </div>

        {/* BANNER */}
        <div className="cd-banner">
          <div className="cd-banner-bg" style={club.cover_photo ? {backgroundImage:`url('/storage/${club.cover_photo}')`} : {}} />
          <div className="cd-banner-overlay" />
          <div className="cd-banner-content">
            <div className="cd-banner-avatar">{club.name?.charAt(0).toUpperCase()}</div>
            <div className="cd-banner-info">
              <div className="cd-banner-cat">{catName}</div>
              <h1 className="cd-banner-name">{club.name}</h1>
              <div className="cd-banner-meta">
                {club.members_count !== undefined && <span>{club.members_count} members</span>}
                {club.advisor?.name && <><span className="cd-meta-dot">·</span><span>Advisor: {club.advisor.name}</span></>}
                {club.co_advisors?.length > 0 && <><span className="cd-meta-dot">·</span><span>Co-Advisor: {club.co_advisors.map(ca=>ca.name).join(', ')}</span></>}
                {club.secretaries?.length > 0 && <><span className="cd-meta-dot">·</span><span>Secretary: {club.secretaries.map(s=>s.name).join(', ')}</span></>}
              </div>
            </div>
            <div className="cd-banner-action">
              <button className="cd-join-btn" onClick={handleJoinClick}>Join Club</button>
            </div>
          </div>
        </div>

        {/* BODY */}
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

          {/* ALBUMS */}
          <div className="cd-albums-section">
            <div className="cd-albums-header">
              <div className="cd-albums-title">Club Activities</div>
              <p className="cd-albums-sub">Work programs and activities</p>
            </div>
            {albumsLoading ? (
              <div className="cd-albums-loading">
                <div className="cd-spinner" />
                <p>Loading activities...</p>
              </div>
            ) : albums.length === 0 ? (
              <div className="cd-no-albums">
                <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
                <p>No activities posted yet.</p>
                <span>Photos will appear here once uploaded.</span>
              </div>
            ) : (
              <div className="cd-albums-list">
                {albums.map(album => (
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
                          <div key={img.id} className="cd-album-img-wrap" onClick={() => openLightbox(album, imgIdx)}>
                            <img src={img.url || img.image_url} alt={img.file_name} className="cd-album-img" />
                            <div className="cd-img-overlay">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
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

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="pub-footer">
        <div className="pub-footer-top">
          <div className="pub-ft-col">
            <div className="pub-ft-logo" style={{cursor:'pointer'}} onClick={() => navigate('/')}>
              <img src="/image/logo-removebg-preview.png" alt="JNEC" />
              <span>JNEC Clubs</span>
            </div>
            <p className="pub-ft-desc">The official club directory for Jigme Namgyel Engineering College. Connecting students with clubs that match their interests and passions.</p>
          </div>
          <div className="pub-ft-col">
            <div className="pub-ft-col-title">Address</div>
            <div className="pub-ft-col-text">Jigme Namgyel Engineering College</div>
            <div className="pub-ft-col-text">Royal University of Bhutan</div>
            <div className="pub-ft-col-text">Kipley, Dewathang</div>
            <div className="pub-ft-col-text">Samdrup Jongkhar, Bhutan</div>
            <div className="pub-ft-col-text">Postal Code: 42002</div>
          </div>
          <div className="pub-ft-col">
            <div className="pub-ft-col-title">Contact</div>
            <div className="pub-ft-col-text">📞 +975-07-260-302</div>
            <div className="pub-ft-col-text">✉️ webmaster@jnec.edu.bt</div>
            <div className="pub-ft-col-title" style={{marginTop:'1.2rem'}}>Quick Links</div>
            <a className="pub-ft-link" href="https://www.jnec.edu.bt" target="_blank" rel="noreferrer">JNEC Website</a>
            <span className="pub-ft-link" onClick={() => navigate('/')}>Browse Clubs</span>
            <a className="pub-ft-link" href="/login">Login</a>
          </div>
          <div className="pub-ft-col">
            <div className="pub-ft-col-title">Categories</div>
            {categories.map(cat => (
              <div key={cat.name??cat} className="pub-ft-link" style={{cursor:'pointer'}}
                onClick={() => navigate('/')}>
                {cat.name ?? cat}
              </div>
            ))}
          </div>
        </div>
        <div className="pub-footer-bottom">
          <span>© {new Date().getFullYear()} JNEC Club Directory — Jigme Namgyel Engineering College</span>
          <span>Royal University of Bhutan</span>
        </div>
      </footer>

      {/* LIGHTBOX */}
      {lightbox && lightbox.album && createPortal(
        <div className="cd-lightbox-overlay" onClick={closeLightbox}>
          <div className="cd-lightbox-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-lb-topbar">
              <div className="cd-lb-info">
                <div className="cd-lb-album-title">{lightbox.album.title}</div>
                <div className="cd-lb-album-meta">{lightbox.album.created_at} · {lightbox.album.images?.length || 0} photos</div>
              </div>
              <button className="cd-lb-close" onClick={closeLightbox}>Close</button>
            </div>
            <div className="cd-lb-img-area">
              <button className="cd-lb-prev" onClick={lightboxPrev} style={{ opacity: lightbox.imgIdx === 0 ? 0.3 : 1 }}>‹</button>
              <img src={lightbox.album.images[lightbox.imgIdx]?.url || lightbox.album.images[lightbox.imgIdx]?.image_url} alt="Activity" className="cd-lb-img" />
              <button className="cd-lb-next" onClick={lightboxNext} style={{ opacity: lightbox.imgIdx === (lightbox.album.images.length - 1) ? 0.3 : 1 }}>›</button>
            </div>
            <div className="cd-lb-caption-row">
              <span className="cd-lb-caption">{lightbox.album.caption || ''}</span>
              <span className="cd-lb-counter">{lightbox.imgIdx + 1} / {lightbox.album.images.length}</span>
            </div>
            <div className="cd-lb-thumbs">
              {lightbox.album.images.map((img, idx) => (
                <div key={img.id} className={`cd-lb-thumb${idx === lightbox.imgIdx ? ' active' : ''}`}
                  onClick={() => setLightbox({ ...lightbox, imgIdx: idx })}>
                  <img src={img.url || img.image_url} alt="" />
                </div>
              ))}
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const h = document.documentElement;
      setPct(h.scrollTop / (h.scrollHeight - h.clientHeight) * 100);
    };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return <div className="pub-scroll-progress" style={{ width: pct + '%' }} />;
}