import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/public.css';

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

  const [clubs,        setClubs]        = useState([]);
  const [uniqueMembers, setUniqueMembers] = useState(0);
  const [categories,   setCategories]   = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [slideIdx, setSlideIdx] = useState(0);
  const slides = ['/image/hero-bg.jpeg', '/image/haha.jpeg', '/image/love.jpeg'];

  const [typed, setTyped]         = useState('');
  const fullText                  = 'Find your Club\nat JNEC';
  const [scrolled, setScrolled]   = useState(false);
  const [hamOpen, setHamOpen]     = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const hamRef = useRef(null);

  const fetchData = async () => {
    try {
      const [clubRes, catRes] = await Promise.all([
        axios.get('/api/clubs'),
        axios.get('/api/categories'),
      ]);
      const clubList = clubRes.data.clubs ?? clubRes.data ?? [];
      setUniqueMembers(clubRes.data.unique_members_count ?? 0);
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

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const role  = sessionStorage.getItem('role');
    if (token && role === 'super_admin') window.location.href = '/superadmin/dashboard';
  }, []);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const fn = () => { if (!document.hidden) fetchData(); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i++; setTyped(fullText.slice(0, i)); if (i >= fullText.length) clearInterval(t); }, 65);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const fn = (e) => {
      if (hamRef.current && !hamRef.current.contains(e.target)) {
        setHamOpen(false); setSelectedCat(null);
      }
    };
    if (hamOpen) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [hamOpen]);

  useEffect(() => {
    let list = clubs;
    if (activeFilter !== 'All')
      list = list.filter(c => (c.category?.name ?? c.category) === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        (c.category?.name ?? c.category ?? '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [clubs, activeFilter, search]);

  const getCatName  = c => c.category?.name ?? c.category ?? '';
  const getCatBg    = c => CAT_BG[getCatName(c)] ?? '#eee';
  const getCatTc    = c => CAT_TC[getCatName(c)] ?? '#555';
  const formatTyped = t => t.replace('Club','<em>Club</em>').replace('\n','<br/>');
  const scrollTo    = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' });
  const goToClub    = club => navigate(`/clubs/${club.id}`);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (val.trim().length > 0) setTimeout(() => scrollTo('clubs-section'), 120);
  };
  const handleSearchEnter = (e) => {
    if (e.key !== 'Enter') return;
    const q = search.toLowerCase().trim();
    if (!q) return;
    const match = clubs.find(c => c.name?.toLowerCase() === q)
      ?? clubs.find(c => c.name?.toLowerCase().includes(q));
    if (match) navigate(`/clubs/${match.id}`);
    else scrollTo('clubs-section');
  };

  const clubsByCategory = {};
  categories.forEach(cat => {
    const catName = cat.name ?? cat;
    clubsByCategory[catName] = clubs.filter(c => getCatName(c) === catName);
  });

  const panelClubs = selectedCat ? (clubsByCategory[selectedCat] ?? []) : [];

  const toggleHam = () => {
    if (hamOpen) { setHamOpen(false); setSelectedCat(null); }
    else {
      setHamOpen(true);
      if (categories.length > 0) setSelectedCat(categories[0].name ?? categories[0]);
    }
  };

  const getClubImage = (club) => {
    if (club.cover_photo) return `/storage/${club.cover_photo}`;
    if (club.image)       return `/storage/${club.image}`;
    return null;
  };

  return (
    <div className="pub-root">
      <ScrollProgress />

      {/* ═══════════ NAVBAR ═══════════ */}
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

        <div style={{flex:1}} />

        <div className="pub-nav-mobile-search">
          <span className="search-icon">⌕</span>
          <input type="text" placeholder="Search clubs..." value={search}
            onChange={e => handleSearchChange(e.target.value)} onKeyDown={handleSearchEnter} />
        </div>

        <div className="pub-nav-right">
          <div className="pub-nav-search">
            <span className="search-icon">⌕</span>
            <input type="text" placeholder="Search clubs..." value={search}
              onChange={e => handleSearchChange(e.target.value)} onKeyDown={handleSearchEnter} />
          </div>
          <button className="pub-login-btn" onClick={() => navigate('/login')}>Login</button>

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
                <div className="pub-ham-cats-side">
                  <div className="pub-ham-side-title">CATEGORIES</div>
                  {categories.map(cat => {
                    const catName = cat.name ?? cat;
                    const count   = (clubsByCategory[catName] ?? []).length;
                    return (
                      <div
                        key={catName}
                        className={`pub-ham-cat-row ${selectedCat === catName ? 'active' : ''}`}
                        onClick={() => setSelectedCat(catName)}
                      >
                        <span className="pub-ham-cat-name">{catName}</span>
                        <span className="pub-ham-cat-badge">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pub-ham-divider" />

                <div className="pub-ham-clubs-side">
                  {selectedCat ? (
                    <>
                      <div className="pub-ham-side-title">{selectedCat}</div>
                      {panelClubs.length === 0 ? (
                        <div className="pub-ham-empty">No clubs in this category yet</div>
                      ) : (
                        <div className="pub-ham-clubs-list">
                          {panelClubs.map(club => (
                            <div
                              key={club.id}
                              className="pub-ham-club-card"
                              onClick={() => { goToClub(club); setHamOpen(false); setSelectedCat(null); }}
                            >
                              {club.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="pub-ham-empty">Select a category</div>
                  )}
                </div>

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

      {/* ═══════════ HERO ═══════════ */}
      <div className="pub-hero">
        {slides.map((src, i) => (
          <div key={src} className={`pub-hero-slide ${i === slideIdx ? 'active' : ''}`}
            style={{ backgroundImage: `url(${src})` }} />
        ))}
        <div className="pub-hero-overlay" />
        <div className="pub-hero-content">
          <h1 dangerouslySetInnerHTML={{ __html: formatTyped(typed) }} />
          <p className="pub-hero-sub">
            Discover, explore and join clubs that match your interests — sports, arts, service, technology and more.
          </p>
          <div className="pub-hero-btns">
            <button className="pub-btn-browse" onClick={() => scrollTo('clubs-section')}>Browse all clubs</button>
            <button className="pub-btn-join"   onClick={() => navigate('/login')}>Join a club</button>
          </div>
          <div className="pub-stats-bar">
            <div className="pub-sb"><div className="pub-sb-n">{clubs.length || 0}</div><div className="pub-sb-l">Total Clubs</div></div>
            <div className="pub-sb"><div className="pub-sb-n">{uniqueMembers}</div><div className="pub-sb-l">Members</div></div>
            <div className="pub-sb"><div className="pub-sb-n">{categories.length || 0}</div><div className="pub-sb-l">Categories</div></div>
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN ═══════════ */}
      <div className="pub-main">

        {/* ALL CLUBS */}
        <div id="clubs-section" className="pub-clubs-section">
          <div className="pub-clubs-top">
            <div className="pub-sec-title">All clubs</div>
            <div className="pub-clubs-count">{filtered.length} club{filtered.length !== 1 ? 's' : ''}</div>
          </div>

          {loading ? (
            <div className="pub-loading"><div className="pub-spinner" /><p>Loading clubs...</p></div>
          ) : error ? (
            <div className="pub-error">{error}</div>
          ) : filtered.length === 0 ? (
            <p className="pub-no-clubs">No clubs found.</p>
          ) : (
            <div className="pub-clubs-grid">
              {filtered.map(club => {
                const img = getClubImage(club);
                return (
                  <div key={club.id} className="pub-club-card" onClick={() => goToClub(club)}>
                    <div className="pub-cc-img">
                      {img
                        ? <img src={img} alt={club.name} />
                        : <div className="pub-cc-img-placeholder"><span>{club.name?.charAt(0)}</span></div>
                      }
                    </div>
                    <div className="pub-cc-body">
                      <div className="pub-cc-name">{club.name}</div>
                      <span className="pub-cc-tag" style={{ background: getCatBg(club), color: getCatTc(club) }}>
                        {getCatName(club)}
                      </span>
                      <button className="pub-view-btn">View club →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ABOUT */}
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
              <div className="pub-ac-title">Who we are</div>
              <div className="pub-ac-text">The JNEC Club Directory is the official platform for all student clubs at Jigme Namgyel Engineering College. It connects students with clubs that match their interests and passions.</div>
            </div>
            <div className="pub-about-card">
              <div className="pub-ac-title">Our mission</div>
              <div className="pub-ac-text">To foster a vibrant campus community by making it easy for students to find their place, and for advisors to build and grow meaningful clubs.</div>
            </div>
          </div>
          <div className="pub-steps-row">
            {[
              { n:1, title:'Browse clubs',  text:'Filter by category to find clubs that match your interests.' },
              { n:2, title:'View details',  text:'Click any club to see its full profile — aim, objectives, description, advisor, and current members.' },
              { n:3, title:'Join a club',   text:'Login with your official JNEC email, then enter the enrollment key provided by your club advisor.' },
            ].map(s => (
              <div key={s.n} className="pub-step-card">
                <div className="pub-step-num">{s.n}</div>
                <div className="pub-step-title">{s.title}</div>
                <div className="pub-step-text">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="pub-footer">
        <div className="pub-footer-top">
          <div className="pub-ft-col">
            <div className="pub-ft-logo">
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
            <a className="pub-ft-link" href="#" onClick={e=>{e.preventDefault();scrollTo('clubs-section');}}>Browse Clubs</a>
            <a className="pub-ft-link" href="#" onClick={e=>{e.preventDefault();scrollTo('about-section');}}>About Us</a>
            <a className="pub-ft-link" href="/login">Login</a>
          </div>
          <div className="pub-ft-col">
            <div className="pub-ft-col-title">Categories</div>
            {categories.map(cat => (
              <div key={cat.name??cat} className="pub-ft-link" style={{cursor:'pointer'}}
                onClick={() => { setActiveFilter(cat.name??cat); scrollTo('clubs-section'); }}>
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
    </div>
  );
}

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