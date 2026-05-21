import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/public.css';

/* ── Category colour map (fallback if API has no colour) ── */
const CAT_BG = {
  Volunteering:    '#e1f5ee', Maintenance:  '#f1efe8',
  'Social Service':'#faece7', Entrepreneurship:'#faeeda',
  Entertainment:  '#faeeda',  Sports:       '#e6f1fb',
};
const CAT_TC = {
  Volunteering:    '#085041', Maintenance:  '#2c2c2a',
  'Social Service':'#712b13', Entrepreneurship:'#633806',
  Entertainment:  '#633806',  Sports:       '#0c447c',
};

export default function PublicHome() {
  const navigate = useNavigate();

  const [clubs,       setClubs]       = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [activeFilter,setActiveFilter]= useState('All');
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  /* hero slideshow */
  const [slideIdx, setSlideIdx] = useState(0);
  const slides = ['/image/hero-bg.jpeg', '/image/haha.jpeg', '/image/love.jpeg'];

  /* typewriter */
  const [typed, setTyped] = useState('');
  const fullText = 'Find your Club\nat JNEC';

  /* nav scroll */
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openCat,  setOpenCat]  = useState(null);
  const [dropLeft,  setDropLeft]  = useState(0);
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
  

  /* ── Fetch clubs + categories ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubRes, catRes] = await Promise.all([
          axios.get('/api/clubs'),
          axios.get('/api/categories'),
        ]);
        const clubList = clubRes.data.clubs ?? clubRes.data ?? [];
        const catList  = catRes.data.categories ?? catRes.data ?? [];
        setClubs(clubList);
        setFiltered(clubList);
        setCategories(catList);
      } catch (e) {
        setError('Failed to load clubs. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ── Slideshow ── */
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  /* ── Typewriter ── */
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(t);
    }, 65);
    return () => clearInterval(t);
  }, []);

  /* ── Scroll nav darken ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);



  /* ── Filter + Search ── */
  useEffect(() => {
    let list = clubs;
    if (activeFilter !== 'All') {
      list = list.filter(c => (c.category?.name ?? c.category) === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        (c.category?.name ?? c.category ?? '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [clubs, activeFilter, search]);

  /* ── Helpers ── */
  const getCatName  = c => c.category?.name ?? c.category ?? '';
  const getCatBg    = c => CAT_BG[getCatName(c)] ?? '#eee';
  const getCatTc    = c => CAT_TC[getCatName(c)] ?? '#555';

  const formatTyped = (text) => {
    return text
      .replace('Club', '<em>Club</em>')
      .replace('\n', '<br/>');
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToClub = (club) => navigate(`/clubs/${club.id}`);

  /* ── Search: typing → scroll to clubs, Enter → open matching club ── */
  const handleSearchChange = (val) => {
    setSearch(val);
    if (val.trim().length > 0) {
      setTimeout(() => scrollTo('clubs-section'), 120);
    }
  };

  const handleSearchEnter = (e) => {
    if (e.key !== 'Enter') return;
    const q = search.toLowerCase().trim();
    if (!q) return;
    const match = clubs.find(c => c.name?.toLowerCase() === q)
      ?? clubs.find(c => c.name?.toLowerCase().includes(q));
    if (match) {
      navigate(`/clubs/${match.id}`);
    } else {
      scrollTo('clubs-section');
    }
  };

  /* ── group clubs by category for nav dropdown ── */
  const clubsByCategory = {};
  categories.forEach(cat => {
    const catName = cat.name ?? cat;
    clubsByCategory[catName] = clubs.filter(c => getCatName(c) === catName);
  });

  return (
    <div className="pub-root">
      {/* SCROLL PROGRESS */}
      <ScrollProgress />

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className={`pub-nav ${scrolled ? 'scrolled' : ''}`} id="main-nav">
        <div className="pub-nav-left">
          <div className="pub-nav-logo">
            <img src="/image/logo-removebg-preview.png" alt="JNEC" />
          </div>
          <span className="pub-nav-brand">JNEC Clubs</span>
          <div className="pub-nav-fixed-links">
            <button className="pub-nfl" onClick={() => scrollTo('about-section')}>About us</button>
          </div>
        </div>

        {/* CATEGORY DROPDOWNS */}
        <div className="pub-nav-cats">
          {categories.map(cat => {
            const catName = cat.name ?? cat;
            const catClubs = clubsByCategory[catName] ?? [];
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
                  {catClubs.map(club => (
                    <div
                      key={club.id}
                      className="pub-cat-dd-item"
                      onClick={() => { goToClub(club); setOpenCat(null); }}
                    >
                      {club.name}
                    </div>
                  ))}
                  {catClubs.length === 0 && (
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
          <input
            type="text" placeholder="Search clubs..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchEnter}
          />
        </div>

        <div className="pub-nav-right">
          {/* DESKTOP SEARCH */}
          <div className="pub-nav-search">
            <span className="search-icon">⌕</span>
            <input
              type="text" placeholder="Search clubs..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchEnter}
            />
          </div>
          <button className="pub-login-btn"    onClick={() => navigate('/login')}>Login</button>
          <button className="pub-register-btn" onClick={() => navigate('/register')}>Register</button>
          <button
            className={`pub-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
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
              <button className="pub-mobile-nfl" onClick={() => { scrollTo('about-section'); setMenuOpen(false); }}>About us</button>
              <button className="pub-mobile-nfl" onClick={() => { scrollTo('clubs-section'); setMenuOpen(false); }}>Browse Clubs</button>
              <button className="pub-mobile-nfl pub-mobile-login"    onClick={() => navigate('/login')}>Login</button>
              <button className="pub-mobile-nfl pub-mobile-register" onClick={() => navigate('/register')}>Register</button>
            </div>
            <div className="pub-mobile-cats-title">Categories</div>
            <div className="pub-mobile-cats">
              {categories.map(cat => {
                const catName = cat.name ?? cat;
                return (
                  <MobileCatSection
                    key={catName}
                    catName={catName}
                    clubs={clubsByCategory[catName] ?? []}
                    onClubClick={(club) => { goToClub(club); setMenuOpen(false); }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ HERO ═══════════════ */}
      <div className="pub-hero">
        {slides.map((src, i) => (
          <div
            key={src}
            className={`pub-hero-slide ${i === slideIdx ? 'active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="pub-hero-overlay" />
        <div className="pub-hero-content">
          <h1
            dangerouslySetInnerHTML={{ __html: formatTyped(typed) }}
          />
          <p className="pub-hero-sub">
            Discover, explore and join clubs that match your interests — sports, arts, service, technology and more.
          </p>
          <div className="pub-hero-btns">
            <button className="pub-btn-browse" onClick={() => scrollTo('clubs-section')}>Browse all clubs</button>
            <button className="pub-btn-join"   onClick={() => navigate('/login')}>Join a club</button>
          </div>
          <div className="pub-stats-bar">
            <div className="pub-sb">
              <div className="pub-sb-n">{clubs.length || 0}</div>
              <div className="pub-sb-l">Total Clubs</div>
            </div>
            <div className="pub-sb">
              <div className="pub-sb-n">
                {clubs.reduce((sum, c) => sum + (c.members_count ?? 0), 0)}
              </div>
              <div className="pub-sb-l">Members</div>
            </div>
            <div className="pub-sb">
              <div className="pub-sb-n">{categories.length || 0}</div>
              <div className="pub-sb-l">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div className="pub-main">

        {/* ALL CLUBS */}
        <div id="clubs-section" className="pub-clubs-section">
          <div className="pub-clubs-top">
            <div className="pub-sec-title">All clubs</div>
            <div className="pub-clubs-count">{filtered.length} club{filtered.length !== 1 ? 's' : ''}</div>
          </div>

          {/* FILTER PILLS */}
          <div className="pub-pill-row">
            {['All', ...categories.map(c => c.name ?? c)].map(cat => (
              <span
                key={cat}
                className={`pub-pill ${activeFilter === cat ? 'on' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* CLUBS GRID */}
          {loading ? (
            <div className="pub-loading">
              <div className="pub-spinner" />
              <p>Loading clubs...</p>
            </div>
          ) : error ? (
            <div className="pub-error">{error}</div>
          ) : filtered.length === 0 ? (
            <p className="pub-no-clubs">No clubs found.</p>
          ) : (
            <div className="pub-clubs-grid">
              {filtered.map(club => {
                const shortDesc = (club.description ?? '').length > 100
                  ? club.description.slice(0, 100) + '...'
                  : (club.description ?? '');
                return (
                  <div
                    key={club.id}
                    className="pub-club-card"
                    onClick={() => goToClub(club)}
                  >
                    <div className="pub-cc-body">
                      <div className="pub-cc-name">{club.name}</div>
                      <div className="pub-cc-desc">{shortDesc || 'No description available.'}</div>
                      <div className="pub-cc-foot">
                        <span className="pub-cc-mem">{club.members_count ?? club.members ?? '—'} members</span>
                        <span
                          className="pub-cc-tag"
                          style={{ background: getCatBg(club), color: getCatTc(club) }}
                        >
                          {getCatName(club)}
                        </span>
                      </div>
                      <button className="pub-view-btn">View club →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ABOUT SECTION */}
        <div id="about-section" className="pub-about-section">
          <div className="pub-about-eyebrow">Learn more about this platform and how it works</div>
          <div className="pub-about-main-title">About JNEC Club Directory</div>

          <div className="pub-about-dark">
            <div className="pub-about-dark-bg" />
            <div className="pub-about-dark-overlay" />
            <div className="pub-about-dark-content">
              <h2>Bringing JNEC students<br/>together through <em>Clubs</em></h2>
              <p>A central platform for students and advisors to discover, create, and manage clubs at Jigme Namgyel Engineering College, Dewathang, Samdrup Jongkhar.</p>
            </div>
          </div>

          <div className="pub-about-cards">
            <div className="pub-about-card">
              <div className="pub-ac-ico">🎓</div>
              <div className="pub-ac-title">Who we are</div>
              <div className="pub-ac-text">The JNEC Club Directory is the official platform for all student clubs at Jigme Namgyel Engineering College. It connects students with clubs that match their interests and passions.</div>
            </div>
            <div className="pub-about-card">
              <div className="pub-ac-ico">🚀</div>
              <div className="pub-ac-title">Our mission</div>
              <div className="pub-ac-text">To foster a vibrant campus community by making it easy for students to find their place, and for advisors to build and grow meaningful clubs across all categories.</div>
            </div>
          </div>

          <div className="pub-steps-row">
            {[
              { n:1, title:'Browse clubs',  text:'Filter by category to find clubs that match your interests — sports, technology, arts, volunteering and more.' },
              { n:2, title:'View details',  text:'Click any club to see its full profile — aim, objectives, description, advisor, and current members.' },
              { n:3, title:'Join a club',   text:'Login or register, then enter the enrollment key provided by your club advisor to become a member.' },
            ].map(s => (
              <div key={s.n} className="pub-step-card">
                <div className="pub-step-num">{s.n}</div>
                <div className="pub-step-title">{s.title}</div>
                <div className="pub-step-text">{s.text}</div>
              </div>
            ))}
          </div>
        </div>

      </div>{/* /pub-main */}

      <footer className="pub-footer">
        <span className="pub-ft-l">© 2025 JNEC Club Directory</span>
        <span className="pub-ft-r">Jigme Namgyel Engineering College</span>
      </footer>
    </div>
  );
}

/* ── Scroll Progress Bar ── */
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setPct(h.scrollTop / (h.scrollHeight - h.clientHeight) * 100);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="pub-scroll-progress" style={{ width: pct + '%' }} />;
}

/* ── Mobile Category Accordion ── */
function MobileCatSection({ catName, clubs, onClubClick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`pub-mobile-cat-section ${open ? 'expanded' : ''}`}>
      <div className="pub-mobile-cat-header" onClick={() => setOpen(!open)}>{catName}</div>
      {open && (
        <div className="pub-mobile-cat-list">
          {clubs.map(club => (
            <div key={club.id} className="pub-mobile-cat-club" onClick={() => onClubClick(club)}>
              {club.name}
            </div>
          ))}
          {clubs.length === 0 && <div className="pub-mobile-cat-club" style={{color:'#666'}}>No clubs yet</div>}
        </div>
      )}
    </div>
  );
}