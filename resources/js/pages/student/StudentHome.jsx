import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/advisor.css';
import '../../styles/student/student.css';

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

export default function StudentHome() {
  const navigate = useNavigate();

  const [categories,    setCategories]    = useState([]);
  const [clubs,         setClubs]         = useState([]);
  const [myClubs,       setMyClubs]       = useState([]);
  const [stats,         setStats]         = useState({ clubs: 0, members: 0, categories: 0 });
  const [navScrolled,   setNavScrolled]   = useState(false);
  const [scrollProgress,setScrollProgress]= useState(0);
  const [slideIdx,      setSlideIdx]      = useState(0);
  const [typewriterHtml,setTypewriterHtml]= useState('');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [activeFilter,  setActiveFilter]  = useState('All');
  const [filteredClubs, setFilteredClubs] = useState([]);

  /* hamburger state */
  const [hamOpen,     setHamOpen]     = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const hamRef = useRef(null);

  /* enrollment modal */
  const [enrollOpen,       setEnrollOpen]       = useState(false);
  const [enrollClub,       setEnrollClub]       = useState(null);
  const [enrollKey,        setEnrollKey]        = useState('');
  const [enrollKeyVisible, setEnrollKeyVisible] = useState(false);
  const [enrolling,        setEnrolling]        = useState(false);
  const [enrollError,      setEnrollError]      = useState('');
  const [enrollSuccess,    setEnrollSuccess]    = useState('');
  const [limitOpen,        setLimitOpen]        = useState(false);
  const [maxLimit,         setMaxLimit]         = useState(2);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const settingsRes = await axios.get('/api/superadmin/settings', { headers });
        if (settingsRes.data?.max_clubs_per_student) setMaxLimit(settingsRes.data.max_clubs_per_student);
      } catch (_) {}
      const [catsRes, clubsRes, myClubsRes] = await Promise.allSettled([
        axios.get('/api/categories', { headers }),
        axios.get('/api/clubs', { headers }),
        axios.get('/api/student/my-clubs', { headers }),
      ]);
      if (catsRes.status === 'fulfilled') {
        const cats = catsRes.value.data.data || catsRes.value.data || [];
        setCategories(cats);
        setStats(prev => ({ ...prev, categories: cats.length }));
      }
      if (clubsRes.status === 'fulfilled') {
        const list = clubsRes.value.data.data || clubsRes.value.data || [];
        setClubs(list);
        setFilteredClubs(list);
        setStats(prev => ({
          ...prev, clubs: list.length,
          members: list.reduce((a, c) => a + (parseInt(c.members_count) || 0), 0),
        }));
      }
      if (myClubsRes.status === 'fulfilled') {
        setMyClubs(myClubsRes.value.data.clubs || []);
      }
    } catch (err) { console.error('Fetch error:', err); }
  };

  const isJoined = (clubId) => myClubs.some(c => String(c.id) === String(clubId));

  const userRole = sessionStorage.getItem('role');
  const handleClubClick = (clubId) => {
    if (userRole === 'secretary') {
      const clickedClub = myClubs.find(c => String(c.id) === String(clubId));
      if (clickedClub && clickedClub.member_role === 'secretary') navigate('/secretary/dashboard');
      else navigate(`/student/dashboard/${clubId}`);
    } else {
      navigate(`/student/dashboard/${clubId}`);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(docH > 0 ? (scrollTop / docH) * 100 : 0);
      setNavScrolled(scrollTop > 100);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSlideIdx(prev => (prev + 1) % 3), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const text = 'Find your Club\nat JNEC';
    const chars = text.split('');
    let idx = 0; let timer;
    const step = () => {
      if (idx <= chars.length) {
        let plain = chars.slice(0, idx).join('');
        let html = '', i = 0;
        while (i < plain.length) {
          if (plain.slice(i, i + 10) === 'Find your ') { html += 'Find your '; i += 10; }
          else if (plain.slice(i, i + 4) === 'Club') { html += '<em>Club</em>'; i += 4; }
          else if (plain[i] === '\n') { html += '<br/>'; i++; }
          else { html += plain[i]; i++; }
        }
        setTypewriterHtml(html); idx++;
        timer = setTimeout(step, 65);
      }
    };
    const delay = setTimeout(step, 400);
    return () => { clearTimeout(delay); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    let result = activeFilter === 'All' ? clubs : clubs.filter(c => c.category === activeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || (c.category && c.category.toLowerCase().includes(q))
      );
    }
    setFilteredClubs(result);
  }, [activeFilter, searchQuery, clubs]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-in-card').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredClubs]);

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

  const triggerSearch = () => {
    if (searchQuery.trim()) {
      const el = document.getElementById('clubs-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') triggerSearch(); };

  const addRipple = (e, el) => {
    if (!el) return;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-wave';
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
    sessionStorage.clear();
    navigate('/login');
  };

  const goToClub = (clubId) => navigate(`/student/clubs/${clubId}`);

  const openEnroll = (e, club) => {
    e.stopPropagation();
    if (isJoined(club.id)) return;
    if (myClubs.length >= maxLimit) { setLimitOpen(true); return; }
    setEnrollClub(club);
    setEnrollKey(''); setEnrollError(''); setEnrollSuccess('');
    setEnrollKeyVisible(false); setEnrollOpen(true);
  };

  const closeEnroll = () => {
    setEnrollOpen(false); setEnrollClub(null);
    setEnrollKey(''); setEnrollError(''); setEnrollSuccess('');
  };

  const handleEnroll = async () => {
    if (!enrollKey.trim()) { setEnrollError('Please enter the enrollment key.'); return; }
    setEnrolling(true); setEnrollError('');
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post('/api/clubs/join', {
        enrollment_key: enrollKey.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEnrollSuccess(res.data.message || 'Successfully joined!');
      const myRes = await axios.get('/api/student/my-clubs', { headers: { Authorization: `Bearer ${token}` } });
      setMyClubs(myRes.data.clubs || []);
      setTimeout(() => closeEnroll(), 1800);
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Invalid enrollment key. Please try again.');
    } finally { setEnrolling(false); }
  };

  const toggleHam = () => {
    if (hamOpen) { setHamOpen(false); setSelectedCat(null); }
    else {
      setHamOpen(true);
      if (categories.length > 0) setSelectedCat(categories[0].name ?? categories[0]);
    }
  };

  /* group clubs by category for hamburger panel */
  const clubsByCategory = {};
  categories.forEach(cat => {
    const n = cat.name ?? cat;
    clubsByCategory[n] = clubs.filter(c => (c.category?.name ?? c.category) === n);
  });
  const panelClubs = selectedCat ? (clubsByCategory[selectedCat] ?? []) : [];

  const getClubImage = (club) => {
    if (club.cover_photo) return `/storage/${club.cover_photo}`;
    if (club.image)       return `/storage/${club.image}`;
    return null;
  };

  const slides = ['/image/hero-bg.jpeg', '/image/haha.jpeg', '/image/love.jpeg'];
  const myClubSlots = Array.from({ length: maxLimit }, (_, i) => myClubs[i] || null);

  return (
    <div className="advisor-page">

      {/* SCROLL PROGRESS */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* ── BAR 1: TOP ANNOUNCEMENT BAR (keep same) ── */}
      <div className="top-announcement-bar">
        <div className="tab-left">
          <a href="#" className="tab-link" onClick={e => { e.preventDefault(); navigate('/student/public-announcements'); }}>Announcements</a>
          <a href="#" className="tab-link" onClick={e => { e.preventDefault(); navigate('/student/audit-report'); }}>Audit Report</a>
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

      {/* ── BAR 2: NAVBAR — no categories, hamburger on right ── */}
      <nav className={`nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="nav-left">
          <div className="nav-logo"><img src="/image/logo-removebg-preview.png" alt="JNEC Logo" /></div>
          <span className="nav-brand">JNEC Clubs</span>
        </div>

        <div style={{flex:1}} />

        <div className="nav-mobile-search">
          <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 15 }}>⌕</span>
          <input type="text" placeholder="Search clubs..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} />
        </div>

        <div className="nav-right">
          {/* HAMBURGER — white, same 2-panel as public page */}
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
                              onClick={() => { goToClub(c.id); setHamOpen(false); setSelectedCat(null); }}
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

      {/* HERO */}
      <div className="hero">
        {slides.map((src, i) => (
          <div key={i} className={`hero-slide hero-slide-${i + 1}${slideIdx === i ? ' active' : ''}`}
            style={{ backgroundImage: `url('${src}')` }} />
        ))}
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 dangerouslySetInnerHTML={{ __html: typewriterHtml || '&nbsp;' }} />
          <p className="hero-sub">Create and manage your club — bring students together through sports, arts, service, and more.</p>
          <div className="hero-btns">
            <button className="btn-browse ripple-btn" onClick={(e) => { addRipple(e, e.currentTarget); scrollTo('clubs-section'); }}>Browse all clubs</button>
          </div>
          <div className="stats-bar">
            <div className="sb"><div className="sb-n">{stats.clubs}</div><div className="sb-l">Total Clubs</div></div>
            <div className="sb"><div className="sb-n">{stats.members}</div><div className="sb-l">Members</div></div>
            <div className="sb"><div className="sb-n">{stats.categories}</div><div className="sb-l">Categories</div></div>
          </div>
        </div>
      </div>

      {/* ── MAIN — full width ── */}
      <div className="main stu-main-content">

        {/* MY CLUBS */}
        <div className="student-myclubs-section" id="myclubs-section">
          <div className="student-myclubs-header">
            <div className="sec-title">My clubs</div>
            <div className="student-myclubs-count">{myClubs.length}/{maxLimit} joined</div>
          </div>
          <div className="student-myclubs-grid">
            {myClubSlots.map((club, i) => {
              if (club) {
                const bg = CAT_BG[club.category] || '#eee';
                const tc = CAT_TC[club.category] || '#555';
                return (
                  <div className="student-myclub-slot filled" key={club.id} onClick={() => handleClubClick(club.id)}>
                    <div className="student-myclub-slot-avatar" style={{ background: tc }}>{club.name.charAt(0).toUpperCase()}</div>
                    <div className="student-myclub-slot-info">
                      <div className="student-myclub-slot-name">{club.name}</div>
                      <span className="student-myclub-slot-cat" style={{ background: bg, color: tc }}>{club.category}</span>
                    </div>
                    <div className="student-myclub-slot-arrow">›</div>
                  </div>
                );
              }
              return (
                <div className="student-myclub-slot empty" key={i}>
                  <div className="student-myclub-slot-plus">+</div>
                  <div className="student-myclub-slot-empty-text">
                    {i === 0 ? 'Join your first club!' : 'You can join one more club!'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ALL CLUBS — cover photo cards like public page */}
        <div id="clubs-section" className="clubs-section">
          <div className="clubs-top">
            <div className="sec-title">All clubs</div>
            <div className="clubs-count">{filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="clubs-controls">
            <div className="pill-row">
              <span className={`pill${activeFilter === 'All' ? ' on' : ''}`} onClick={() => setActiveFilter('All')}>All</span>
              {categories.map(cat => (
                <span key={cat.id} className={`pill${activeFilter === cat.name ? ' on' : ''}`}
                  onClick={() => setActiveFilter(cat.name)}>{cat.name}</span>
              ))}
            </div>
          </div>

          {filteredClubs.length === 0 ? (
            <p style={{ color:'#aaa', fontSize:14, padding:'1rem 0' }}>No clubs found.</p>
          ) : (
            <div className="stu-clubs-grid">
              {filteredClubs.map(club => {
                const catName = club.category || '';
                const bg  = CAT_BG[catName] || '#eee';
                const tc  = CAT_TC[catName] || '#555';
                const img = getClubImage(club);
                const joined = isJoined(club.id);
                return (
                  <div className="stu-club-card fade-in-card" key={club.id} onClick={() => goToClub(club.id)}>
                    {/* COVER PHOTO */}
                    <div className="stu-cc-img">
                      {img
                        ? <img src={img} alt={club.name} />
                        : <div className="stu-cc-img-placeholder">
                            <span>{club.name?.charAt(0)}</span>
                          </div>
                      }
                    </div>
                    {/* CARD BODY */}
                    <div className="stu-cc-body">
                      <div className="stu-cc-name">{club.name}</div>
                      <span className="stu-cc-tag" style={{ background: bg, color: tc }}>{catName}</span>
                      {joined ? (
                        <button className="student-join-btn joined" disabled>✓ Already Joined</button>
                      ) : (
                        <button className="student-join-btn ripple-btn"
                          onClick={(e) => { addRipple(e, e.currentTarget); openEnroll(e, club); }}>
                          Join Club →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <span className="ft-l">©JNEC Club Directory</span>
        <span className="ft-r">Jigme Namgyel Engineering College</span>
      </footer>

      {/* LIMIT MODAL */}
      {limitOpen && (
        <div className="student-enroll-overlay" onClick={() => setLimitOpen(false)}>
          <div className="student-enroll-modal" onClick={e => e.stopPropagation()} style={{ maxWidth:360 }}>
            <div className="student-enroll-modal-top">
              <div>
                <div className="student-enroll-modal-title">Club Limit Reached</div>
                <div className="student-enroll-modal-sub">You can only join a maximum of <strong style={{ color:'#c9a84c' }}>{maxLimit} clubs</strong>.</div>
              </div>
              <button className="student-enroll-modal-x" onClick={() => setLimitOpen(false)}>✕</button>
            </div>
            <div className="student-enroll-modal-body" style={{ textAlign:'center', padding:'1.5rem' }}>
              <p style={{ fontSize:13, color:'#666', lineHeight:1.6 }}>
                You're already in {maxLimit} clubs. You've reached the maximum number of clubs.
              </p>
            </div>
            <div className="student-enroll-modal-footer" style={{ justifyContent:'center' }}>
              <button className="student-enroll-submit" onClick={() => setLimitOpen(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT MODAL */}
      {enrollOpen && enrollClub && (
        <div className="student-enroll-overlay" onClick={closeEnroll}>
          <div className="student-enroll-modal" onClick={e => e.stopPropagation()}>
            <div className="student-enroll-modal-top">
              <div>
                <div className="student-enroll-modal-title">Enter Enrollment Key</div>
                <div className="student-enroll-modal-sub">Enter the key provided by your club advisor to join <strong>{enrollClub.name}</strong>.</div>
              </div>
              <button className="student-enroll-modal-x" onClick={closeEnroll}>✕</button>
            </div>
            <div className="student-enroll-modal-body">
              <label className="student-enroll-label">ENROLLMENT KEY</label>
              <div className="student-enroll-input-wrap">
                <input
                  type={enrollKeyVisible ? 'text' : 'password'}
                  className={`student-enroll-input${enrollError ? ' error' : ''}${enrollSuccess ? ' success' : ''}`}
                  placeholder="e.g. CLUB2025"
                  value={enrollKey}
                  onChange={e => { setEnrollKey(e.target.value); setEnrollError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleEnroll()}
                  autoFocus
                />
                <button className="student-enroll-eye" onClick={() => setEnrollKeyVisible(!enrollKeyVisible)}>
                  {enrollKeyVisible ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {enrollError   && <div className="student-enroll-error">{enrollError}</div>}
              {enrollSuccess && <div className="student-enroll-success">✓ {enrollSuccess}</div>}
              <div className="student-enroll-hint">The key will be provided by your secretary and advisor.</div>
            </div>
            <div className="student-enroll-modal-footer">
              <button className="student-enroll-cancel" onClick={closeEnroll}>Cancel</button>
              <button className="student-enroll-submit ripple-btn" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}