import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/advisor.css';

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

export default function AdvisorHome() {
  const navigate = useNavigate();

  const [categories,    setCategories]    = useState([]);
  const [clubs,         setClubs]         = useState([]);
  const [myClub,        setMyClub]        = useState(null);
  const [stats,         setStats]         = useState({ clubs: 0, members: 0, categories: 0 });
  const [navScrolled,   setNavScrolled]   = useState(false);
  const [scrollProgress,setScrollProgress]= useState(0);
  const [slideIdx,      setSlideIdx]      = useState(0);
  const [typewriterHtml,setTypewriterHtml]= useState('');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [activeFilter,  setActiveFilter]  = useState('All');
  const [filteredClubs, setFilteredClubs] = useState([]);

  /* hamburger */
  const [hamOpen,     setHamOpen]     = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const hamRef = useRef(null);

  /* setup club modal */
  const [setupOpen,    setSetupOpen]    = useState(false);
  const [setupStep,    setSetupStep]    = useState(1);
  const [setupForm,    setSetupForm]    = useState({
    aim: '', description: '', objectives: ['', ''],
    cover_photo: null, cover_preview: null,
  });
  const [setupErrors,  setSetupErrors]  = useState({});
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const coverRef = useRef(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [catsRes, clubsRes, myClubRes] = await Promise.allSettled([
        axios.get('/api/categories', { headers }),
        axios.get('/api/clubs', { headers }),
        axios.get('/api/clubs/my-club', { headers }),
      ]);
      if (catsRes.status === 'fulfilled') {
        const cats = catsRes.value.data.data || catsRes.value.data || [];
        setCategories(cats);
        setStats(prev => ({ ...prev, categories: cats.length }));
      }
      if (clubsRes.status === 'fulfilled') {
        const list = clubsRes.value.data.data || clubsRes.value.data || [];
        setClubs(list); setFilteredClubs(list);
        setStats(prev => ({
          ...prev, clubs: list.length,
          members: list.reduce((a, c) => a + (parseInt(c.members_count) || 0), 0),
        }));
      }
      if (myClubRes.status === 'fulfilled') {
        const d = myClubRes.value.data;
        if (d && d.name) setMyClub(d);
      }
    } catch (err) { console.error('Fetch error:', err); }
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

  const goToClub = (clubId) => navigate(`/advisor/clubs/${clubId}`);

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
    clubsByCategory[n] = clubs.filter(c => (c.category?.name ?? c.category) === n);
  });
  const panelClubs = selectedCat ? (clubsByCategory[selectedCat] ?? []) : [];

  const getClubImage = (club) => {
    if (club.cover_photo) return `/storage/${club.cover_photo}`;
    if (club.image)       return `/storage/${club.image}`;
    return null;
  };

  /* setup club helpers */
  const updateSetup = (field, value) => setSetupForm(prev => ({ ...prev, [field]: value }));
  const updateSetupObj = (i, value) => {
    const objs = [...setupForm.objectives]; objs[i] = value;
    setSetupForm(prev => ({ ...prev, objectives: objs }));
  };
  const addSetupObj    = () => setSetupForm(prev => ({ ...prev, objectives: [...prev.objectives, ''] }));
  const removeSetupObj = (i) => setSetupForm(prev => ({ ...prev, objectives: prev.objectives.filter((_, idx) => idx !== i) }));

  const handleCoverChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setSetupForm(prev => ({ ...prev, cover_photo: file, cover_preview: URL.createObjectURL(file) }));
  };

  const goSetupPreview = () => {
    const errors = {};
    if (!setupForm.aim.trim())         errors.aim         = true;
    if (!setupForm.description.trim()) errors.description = true;
    setSetupErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSetupStep(2);
  };

  const submitSetup = async () => {
    setSetupSubmitting(true);
    try {
      const token  = sessionStorage.getItem('token');
      const clubId = myClub?.id || sessionStorage.getItem('club_id');
      const fd     = new FormData();
      fd.append('aim',         setupForm.aim);
      fd.append('description', setupForm.description);
      setupForm.objectives.filter(o => o.trim()).forEach((o, i) => fd.append(`objectives[${i}]`, o));
      if (setupForm.cover_photo) fd.append('cover_photo', setupForm.cover_photo);
      await axios.post(`/api/clubs/${clubId}?_method=PUT`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setSetupOpen(false);
      setSetupStep(1);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally { setSetupSubmitting(false); }
  };

  const slides = ['/image/hero-bg.jpeg', '/image/haha.jpeg', '/image/love.jpeg'];

  return (
    <div className="advisor-page">

      {/* SCROLL PROGRESS */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* ── BAR 1: Black top bar (keep same) ── */}
      <div className="top-announcement-bar">
        <div className="tab-left">
          <a href="#" className="tab-link" onClick={e => { e.preventDefault(); navigate('/advisor/public-announcements'); }}>Announcements</a>
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

      {/* ── BAR 2: Navbar — no categories, white hamburger on right ── */}
      <nav className={`nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="nav-left">
          <div className="nav-logo"><img src="/image/logo-removebg-preview.png" alt="JNEC Logo" /></div>
          <span className="nav-brand">JNEC Clubs</span>
        </div>

        <div style={{flex:1}} />

        <div className="nav-mobile-search">
          <span style={{ color:'rgba(255,255,255,.35)', fontSize:15 }}>⌕</span>
          <input type="text" placeholder="Search clubs..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} />
        </div>

        <div className="nav-right">
          {/* WHITE HAMBURGER — same 2-panel as public page */}
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
          <div key={i} className={`hero-slide hero-slide-${i+1}${slideIdx === i ? ' active' : ''}`}
            style={{ backgroundImage: `url('${src}')` }} />
        ))}
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 dangerouslySetInnerHTML={{ __html: typewriterHtml || '&nbsp;' }} />
          <p className="hero-sub">Create and manage your club — bring students together through sports, arts, service, and more.</p>
          <div className="hero-btns">
            <button className="btn-browse ripple-btn"
              onClick={(e) => { addRipple(e, e.currentTarget); scrollTo('clubs-section'); }}>
              Browse all clubs
            </button>
          </div>
          <div className="stats-bar">
            <div className="sb"><div className="sb-n">{stats.clubs}</div><div className="sb-l">Total Clubs</div></div>
            <div className="sb"><div className="sb-n">{stats.members}</div><div className="sb-l">Members</div></div>
            <div className="sb"><div className="sb-n">{stats.categories}</div><div className="sb-l">Categories</div></div>
          </div>
        </div>
      </div>

      {/* ── MAIN — full width ── */}
      <div className="main adv-main-content">

        {/* MY CLUB */}
        {myClub && (
          <div className="myclub-section" id="myclub-section"> 
            <div className="myclub-label"><div className="myclub-label-dot" />My Club</div>
            {!myClub.aim && !myClub.description ? (
              /* Club not set up yet — click card to open setup */
              <div className="myclub-card myclub-setup-card" onClick={() => { setSetupOpen(true); setSetupStep(1); }} style={{cursor:'pointer'}}>
                <div className="myclub-avatar">{myClub.name ? myClub.name.charAt(0).toUpperCase() : '?'}</div>
                <div className="myclub-info">
                  <div className="myclub-name">{myClub.name}</div>
                  <div className="myclub-members" style={{color:'#e05555'}}>⚠ Click to setup your club</div>
                  <span className="myclub-cat-pill">{myClub.category || '—'}</span>
                </div>
                <div className="myclub-setup-btn">Setup Your Club →</div>
              </div>
            ) : (
              <div className="myclub-card" onClick={() => navigate('/advisor/club-dashboard')}>
                <div className="myclub-avatar">{myClub.name ? myClub.name.charAt(0).toUpperCase() : '?'}</div>
                <div className="myclub-info">
                  <div className="myclub-name">{myClub.name}</div>
                  <div className="myclub-members">{myClub.members_count || 0} members</div>
                  <span className="myclub-cat-pill">{myClub.category || '—'}</span>
                </div>
                <div className="myclub-arrow">›</div>
              </div>
            )}
          </div>
        )}

        {/* No club assigned message */}
        {!myClub && (
          <div className="ready-banner" id="ready-banner">
            <div>
              <div className="rb-title">No club assigned yet</div>
              <div className="rb-sub">Please contact the Super Admin to get a club assigned to you.</div>
            </div>
          </div>
        )}

        {/* ALL CLUBS — cover photo cards */}
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
            <div className="adv-clubs-grid">
              {filteredClubs.map(club => {
                const catName = club.category || '';
                const bg  = CAT_BG[catName] || '#eee';
                const tc  = CAT_TC[catName] || '#555';
                const img = getClubImage(club);
                return (
                  <div className="adv-club-card fade-in-card" key={club.id} onClick={() => goToClub(club.id)}>
                    <div className="adv-cc-img">
                      {img
                        ? <img src={img} alt={club.name} />
                        : <div className="adv-cc-img-placeholder">
                            <span>{club.name?.charAt(0)}</span>
                          </div>
                      }
                    </div>
                    <div className="adv-cc-body">
                      <div className="adv-cc-name">{club.name}</div>
                      <span className="adv-cc-tag" style={{ background:bg, color:tc }}>{catName}</span>
                      <button className="view-btn ripple-btn"
                        onClick={(e) => { e.stopPropagation(); addRipple(e, e.currentTarget); goToClub(club.id); }}>
                        View club →
                      </button>
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

      {/* SETUP CLUB MODAL */}
      {setupOpen && (
        <div className="create-overlay open" onClick={() => setSetupOpen(false)}>
          <div className="create-modal" onClick={e => e.stopPropagation()}>
            <div className="create-top">
              <span className="create-title-text">Setup Your Club</span>
              <div className="csteps">
                <span className={`cstep${setupStep === 1 ? ' active' : ' done'}`}>Details</span>
                <span className="cstep-sep">›</span>
                <span className={`cstep${setupStep === 2 ? ' active' : ''}`}>Preview</span>
              </div>
              <button className="modal-x" onClick={() => setSetupOpen(false)}>✕</button>
            </div>

            {setupStep === 1 && (
              <>
                <div className="create-body">
                  {/* COVER PHOTO */}
                  <div className="cfield">
                    <label>Cover Photo <span className="opt">(optional)</span></label>
                    <div className="cover-upload-zone" onClick={() => coverRef.current?.click()}>
                      {setupForm.cover_preview ? (
                        <img src={setupForm.cover_preview} alt="cover preview" className="cover-preview-img" />
                      ) : (
                        <div className="cover-upload-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <span>Click to upload cover photo</span>
                        </div>
                      )}
                    </div>
                    <input ref={coverRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleCoverChange} />
                  </div>

                  {/* AIM */}
                  <div className="cfield">
                    <label>Aim <span style={{color:'#e05555'}}>*</span></label>
                    <input type="text" value={setupForm.aim} onChange={e => updateSetup('aim', e.target.value)}
                      style={setupErrors.aim ? { borderColor:'#e05555' } : {}} />
                    {setupErrors.aim && <span style={{ color:'#e05555', fontSize:11 }}>Required</span>}
                  </div>

                  {/* OBJECTIVES */}
                  <div className="cfield">
                    <label>Objectives</label>
                    <div className="obj-list">
                      {setupForm.objectives.map((obj, i) => (
                        <div className="obj-row" key={i}>
                          <input type="text" value={obj} onChange={e => updateSetupObj(i, e.target.value)} />
                          <button className="obj-del" onClick={() => removeSetupObj(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                    <button className="add-obj-btn" onClick={addSetupObj}>+ Add Objective</button>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="cfield">
                    <label>Description <span style={{color:'#e05555'}}>*</span></label>
                    <textarea value={setupForm.description} onChange={e => updateSetup('description', e.target.value)}
                      style={setupErrors.description ? { borderColor:'#e05555' } : {}} />
                    {setupErrors.description && <span style={{ color:'#e05555', fontSize:11 }}>Required</span>}
                  </div>
                </div>
                <div className="create-footer">
                  <button className="cfbtn-s" onClick={() => setSetupOpen(false)}>Cancel</button>
                  <button className="cfbtn-p ripple-btn" onClick={goSetupPreview}>Preview →</button>
                </div>
              </>
            )}

            {setupStep === 2 && (
              <>
                <div className="create-body">
                  <p style={{ fontSize:13, color:'#aaa', marginBottom:'1rem' }}>Review before saving.</p>

                  {/* Cover preview */}
                  {setupForm.cover_preview && (
                    <div style={{marginBottom:'1rem'}}>
                      <img src={setupForm.cover_preview} alt="cover" style={{width:'100%', height:160, objectFit:'cover', borderRadius:10}} />
                    </div>
                  )}

                  <div className="pv-name">{myClub?.name}</div>
                  <div className="pv-cat">Category: {myClub?.category}</div>
                  <div className="pv-sec"><div className="pv-label">Aim</div><div className="pv-val">{setupForm.aim}</div></div>
                  <div className="pv-sec">
                    <div className="pv-label">Objectives</div>
                    <div className="pv-val">
                      {setupForm.objectives.filter(o => o.trim()).map((o, i) => <div key={i}>• {o}</div>)}
                      {setupForm.objectives.filter(o => o.trim()).length === 0 && '—'}
                    </div>
                  </div>
                  <div className="pv-sec"><div className="pv-label">Description</div><div className="pv-val">{setupForm.description}</div></div>
                </div>
                <div className="create-footer">
                  <button className="cfbtn-s" onClick={() => setSetupStep(1)}>← Back</button>
                  <button className="cfbtn-p ripple-btn" onClick={submitSetup} disabled={setupSubmitting}>
                    {setupSubmitting ? 'Saving...' : 'Save & Publish'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}