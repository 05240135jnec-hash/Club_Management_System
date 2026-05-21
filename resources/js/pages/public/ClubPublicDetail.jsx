import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/public.css';
import '../../styles/club-detail.css';

const CAT_AVATAR_BG = {
  Volunteering:    '#0a4a36', Maintenance:  '#2c2c2a',
  'Social Service':'#5a1e0a', Entrepreneurship:'#4a2a04',
  Entertainment:  '#4a2a04',  Sports:       '#0a3060',
};

export default function ClubPublicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [club,       setClub]      = useState(null);
  const [albums,     setAlbums]    = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState('');
  const [lightbox,   setLightbox]  = useState(null); // image URL for lightbox

  /* nav state */
  const [scrolled,   setScrolled]  = useState(false);
  const [menuOpen,   setMenuOpen]  = useState(false);
  const [openCat,    setOpenCat]   = useState(null);
  const [categories, setCategories]= useState([]);
  const [allClubs,   setAllClubs]  = useState([]);
  const [dropLeft,   setDropLeft]  = useState(0);
  const closeTimer = useRef(null);

  const openDropdown = (catName, el) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = el.getBoundingClientRect();
    setDropLeft(rect.left);
    setOpenCat(catName);
  };
  const closeDropdown = () => {
    closeTimer.current = setTimeout(() => setOpenCat(null), 120);
  };
  const keepDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  /* ── Fetch club + albums ── */
  useEffect(() => {
    const fetchClub = async () => {
      try {
        setLoading(true);

        /* Fetch all clubs then find by id
           (since GET /api/clubs/{id} may not exist as public route) */
        const [clubsRes, catsRes] = await Promise.all([
          axios.get('/api/clubs'),
          axios.get('/api/categories'),
        ]);

        const clubList = clubsRes.data.clubs ?? clubsRes.data ?? [];
        const catList  = catsRes.data.categories ?? catsRes.data ?? [];
        setAllClubs(clubList);
        setCategories(catList);

        const found = clubList.find(c => String(c.id) === String(id));
        if (!found) { setError('Club not found.'); setLoading(false); return; }
        setClub(found);

        /* Try to fetch image albums if available as public route */
        /* Albums are protected but we try — if 401 we just show placeholder */
        try {
          const albumRes = await axios.get('/api/image-albums', {
            params: { club_id: found.id }
          });
          setAlbums(albumRes.data.albums ?? albumRes.data ?? []);
        } catch {
          /* 401 = not logged in, albums hidden — fine for public */
          setAlbums([]);
        }

      } catch {
        setError('Failed to load club details.');
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, [id]);

  /* nav scroll */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);



  /* ── helpers ── */
  const getCatName = c => c?.category?.name ?? c?.category ?? '';
  const avatarBg   = club ? (CAT_AVATAR_BG[getCatName(club)] ?? '#0c1b33') : '#0c1b33';

  /* group clubs by category for nav dropdown */
  const clubsByCategory = {};
  categories.forEach(cat => {
    const n = cat.name ?? cat;
    clubsByCategory[n] = allClubs.filter(c => getCatName(c) === n);
  });

  /* collect all gallery images across albums */
  const allImages = albums.flatMap(album =>
    (album.images ?? album.album_images ?? []).map(img => ({
      ...img,
      albumTitle: album.title ?? album.name ?? '',
    }))
  );

  const handleJoinClick = () => {
    /* save intent so after login we can redirect back */
    sessionStorage.setItem('jnec_join_intent_id', id);
    navigate(`/login?next=/clubs/${id}`);
  };

  /* ─────────────────────────────────────────────── */
  if (loading) return (
    <div className="pub-root" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div className="pub-spinner" style={{margin:'0 auto 1rem'}}/>
        <p style={{color:'#888'}}>Loading club...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="pub-root" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <p style={{color:'#c0392b',marginBottom:'1rem'}}>{error}</p>
        <button className="pub-btn-browse" onClick={() => navigate('/')}>← Back to clubs</button>
      </div>
    </div>
  );

  return (
    <div className="pub-root">
      {/* SCROLL PROGRESS */}
      <ScrollProgress />

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`pub-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="pub-nav-left">
          <div className="pub-nav-logo">
            <img src="/image/logo-removebg-preview.png" alt="JNEC" />
          </div>
          <span className="pub-nav-brand">JNEC Clubs</span>
          <div className="pub-nav-fixed-links">
            <button className="pub-nfl" onClick={() => navigate('/')}>About us</button>
          </div>
        </div>

        {/* CATEGORY DROPDOWNS */}
        <div className="pub-nav-cats">
          {categories.map(cat => {
            const catName = cat.name ?? cat;
            const isOpen = openCat === catName;
            return (
              <div
                key={catName}
                className="pub-nav-cat-item"
                onMouseEnter={(e) => openDropdown(catName, e.currentTarget)}
                onMouseLeave={closeDropdown}
              >
                <button className={`pub-nav-cat-btn ${isOpen ? 'open' : ''}`}>
                  {catName} <span className="arr">▾</span>
                </button>
                <div
                  className={`pub-cat-dropdown ${isOpen ? 'visible' : ''}`}
                  style={{ left: dropLeft + 'px' }}
                  onMouseEnter={keepDropdown}
                  onMouseLeave={closeDropdown}
                >
                  {(clubsByCategory[catName] ?? []).map(c => (
                    <div
                      key={c.id}
                      className="pub-cat-dd-item"
                      onClick={() => { navigate(`/clubs/${c.id}`); setOpenCat(null); }}
                    >
                      {c.name}
                    </div>
                  ))}
                  {(clubsByCategory[catName] ?? []).length === 0 && (
                    <div className="pub-cat-dd-item" style={{color:'#bbb'}}>No clubs yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE SEARCH */}
        <div className="pub-nav-mobile-search">
          <span className="search-icon">⌕</span>
          <input type="text" placeholder="Search clubs..."
            onKeyDown={e => { if(e.key==='Enter') navigate(`/?search=${e.target.value}`); }}
          />
        </div>

        <div className="pub-nav-right">
          <div className="pub-nav-search">
            <span className="search-icon">⌕</span>
            <input type="text" placeholder="Search clubs..."
              onKeyDown={e => { if(e.key==='Enter') navigate(`/?search=${e.target.value}`); }}
            />
          </div>
          <button className="pub-login-btn"    onClick={() => navigate('/login')}>Login</button>
          <button className="pub-register-btn" onClick={() => navigate('/register')}>Register</button>
          <button
            className={`pub-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="pub-mobile-menu open">
          <div className="pub-mobile-menu-inner">
            <div className="pub-mobile-nav-links">
              <button className="pub-mobile-nfl" onClick={() => navigate('/')}>Home</button>
              <button className="pub-mobile-nfl pub-mobile-login"    onClick={() => navigate('/login')}>Login</button>
              <button className="pub-mobile-nfl pub-mobile-register" onClick={() => navigate('/register')}>Register</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CLUB DETAIL BODY ═══════════ */}
      <div className="cd-wrap">

        {/* BREADCRUMB */}
        <div className="cd-breadcrumb">
          <span className="cd-bc-link" onClick={() => navigate('/')}>Home</span>
          <span className="cd-bc-sep">›</span>
          <span
            className="cd-bc-link"
            onClick={() => navigate(`/?filter=${encodeURIComponent(getCatName(club))}`)}
          >
            {getCatName(club)}
          </span>
          <span className="cd-bc-sep">›</span>
          <span className="cd-bc-cur">{club.name}</span>
        </div>

        {/* CLUB BANNER */}
        <div className="cd-banner">
          <div className="cd-banner-bg" />
          <div className="cd-banner-overlay" />
          <div className="cd-banner-content">
            <div className="cd-banner-avatar" style={{ background: avatarBg }}>
              {club.name?.charAt(0).toUpperCase()}
            </div>
            <div className="cd-banner-info">
              <div className="cd-banner-cat">{getCatName(club)}</div>
              <h1 className="cd-banner-name">{club.name}</h1>
              <div className="cd-banner-meta">
                {club.members_count ?? club.members ?? '—'} members
                {club.advisor?.name || club.adviser
                  ? ` · Advisor: ${club.advisor?.name ?? club.adviser}`
                  : ''}
              </div>
            </div>
            {/* JOIN CLUB — top right */}
            <div className="cd-banner-action">
              <button className="cd-join-btn" onClick={handleJoinClick}>
                Join Club
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT LAYOUT */}
        <div className="cd-layout">

          {/* LEFT MAIN */}
          <div className="cd-main">

            {/* AIM */}
            {club.aim && (
              <div className="cd-card">
                <div className="cd-card-label">Aim</div>
                <div className="cd-card-text">{club.aim}</div>
              </div>
            )}

            {/* OBJECTIVES */}
            {club.objectives && (
              <div className="cd-card">
                <div className="cd-card-label">Objectives</div>
                {(Array.isArray(club.objectives)
                  ? club.objectives
                  : club.objectives.split('\n').filter(Boolean)
                ).map((obj, i) => (
                  <div key={i} className="cd-obj-item">
                    <div className="cd-obj-bullet">{i + 1}</div>
                    <div className="cd-obj-text">{obj}</div>
                  </div>
                ))}
              </div>
            )}

            {/* DESCRIPTION */}
            {club.description && (
              <div className="cd-card">
                <div className="cd-card-label">About this Club</div>
                <div className="cd-card-text">{club.description}</div>
              </div>
            )}

            {/* GALLERY */}
            <div className="cd-card">
              <div className="cd-card-label">Gallery</div>
              {allImages.length > 0 ? (
                <div className="cd-gallery-grid">
                  {allImages.map((img, i) => {
                    const src = img.image_url ?? img.url ?? img.path ?? '';
                    return (
                      <div
                        key={img.id ?? i}
                        className="cd-gallery-item"
                        onClick={() => setLightbox(src)}
                      >
                        <img
                          src={src}
                          alt={img.caption ?? `Gallery ${i + 1}`}
                          onError={e => { e.target.style.display='none'; }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="cd-gallery-empty">
                  <div className="cd-gallery-placeholders">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="cd-gallery-ph"><span>📷</span></div>
                    ))}
                  </div>
                  <p className="cd-gallery-note">Gallery photos will appear here once uploaded by the club advisor.</p>
                </div>
              )}
            </div>

          </div>{/* /cd-main */}

          {/* RIGHT SIDEBAR */}
          <div className="cd-sidebar">

            {/* CLUB INFO */}
            <div className="cd-sidebar-card">
              <div className="cd-sc-title">Club Info</div>
              {[
                { label: 'Members',       val: club.members_count ?? club.members ?? '—' },
                { label: 'Category',      val: getCatName(club) },
                { label: 'Club Advisor',  val: club.advisor?.name ?? club.adviser ?? '—' },
                { label: 'Club Secretary',val: club.secretary?.name ?? club.secretary ?? '—' },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <div className="cd-sc-row">
                    <div className="cd-sc-label">{row.label}</div>
                    <div className="cd-sc-val">{row.val}</div>
                  </div>
                  {i < arr.length - 1 && <div className="cd-sc-divider"/>}
                </React.Fragment>
              ))}
            </div>

            {/* JOIN CTA */}
            <div className="cd-sidebar-card cd-sidebar-join">
              <div className="cd-sc-title">Want to join?</div>
              <p className="cd-sc-join-text">
                Login or create an account to join this club using your enrollment key.
              </p>
              <button className="cd-sidebar-join-btn" onClick={handleJoinClick}>Join Club</button>
              <button className="cd-sidebar-login-btn" onClick={() => navigate('/login')}>
                Login to your account
              </button>
            </div>

            {/* BACK */}
            <button className="cd-back-btn" onClick={() => navigate('/')}>
              ← Back to all clubs
            </button>

          </div>{/* /cd-sidebar */}

        </div>{/* /cd-layout */}
      </div>{/* /cd-wrap */}

      <footer className="pub-footer">
        <span className="pub-ft-l">© 2025 JNEC Club Directory</span>
        <span className="pub-ft-r">Jigme Namgyel Engineering College</span>
      </footer>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="cd-lightbox" onClick={() => setLightbox(null)}>
          <div className="cd-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="cd-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox} alt="Gallery" />
          </div>
        </div>
      )}
    </div>
  );
}

/* Scroll Progress */
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