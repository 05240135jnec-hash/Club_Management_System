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

  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [myClub, setMyClub] = useState(null);
  const [stats, setStats] = useState({ clubs: 0, members: 0, categories: 0 });

  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropLeft, setDropLeft] = useState(0);
  const dropCloseTimer = useRef(null);
  const [openMobileCat, setOpenMobileCat] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [typewriterHtml, setTypewriterHtml] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [filteredClubs, setFilteredClubs] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [form, setForm] = useState({
    name: '', category: '', aim: '', description: '', secretary: '',
    objectives: ['', ''],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
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
        setClubs(list);
        setFilteredClubs(list);
        setStats(prev => ({
          ...prev, clubs: list.length,
          members: list.reduce((a, c) => a + (parseInt(c.members_count) || 0), 0),
        }));
      }
      if (myClubRes.status === 'fulfilled') {
        const d = myClubRes.value.data;
        if (d && d.name) setMyClub(d);
      }
    } catch (err) {
      console.error('Fetch error:', err);
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
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
    localStorage.clear();
    navigate('/login');
  };

  const goToClub = (clubId) => navigate(`/advisor/clubs/${clubId}`);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateObjective = (i, value) => {
    const objs = [...form.objectives]; objs[i] = value;
    setForm(prev => ({ ...prev, objectives: objs }));
  };
  const addObjective = () => setForm(prev => ({ ...prev, objectives: [...prev.objectives, ''] }));
  const removeObjective = (i) => setForm(prev => ({ ...prev, objectives: prev.objectives.filter((_, idx) => idx !== i) }));

  const goPreview = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.category) errors.category = true;
    if (!form.aim.trim()) errors.aim = true;
    if (!form.description.trim()) errors.description = true;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setPreviewData({ ...form }); setCreateStep(2);
  };

  const submitClub = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: form.name, category: form.category, aim: form.aim,
        description: form.description, secretary: form.secretary,
        objectives: form.objectives.filter(o => o.trim()),
      };
      const res = await axios.post('/api/clubs', payload, { headers: { Authorization: `Bearer ${token}` } });
      const newClub = res.data.club || res.data.data || res.data;
      setMyClub(newClub);
      setClubs(prev => [...prev, newClub]);
      setStats(prev => ({ ...prev, clubs: prev.clubs + 1 }));
      setCreateOpen(false); setCreateStep(1);
      setForm({ name: '', category: '', aim: '', description: '', secretary: '', objectives: ['', ''] });
      setTimeout(() => scrollTo('myclub-section'), 300);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create club. Please try again.');
    } finally { setSubmitting(false); }
  };

  const slides = ['/image/hero-bg.jpeg', '/image/haha.jpeg', '/image/love.jpeg'];

  return (
    <div className="advisor-page">

      {/* SCROLL PROGRESS */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* ══ BAR 1: Black top bar — Announcements | Search | Logout ══ */}
      <div className="top-announcement-bar">
        <div className="tab-left">
          <a href="#" className="tab-link" onClick={e => { e.preventDefault(); scrollTo('announcements-section'); }}>Announcements</a>
          <a href="#" className="tab-link">Audit Report</a>
        </div>
        <div className="tab-center">
          <div className="tab-search">
            <span className="tab-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="tab-right">
          <button className="tab-logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {/* ══ BAR 2: Main dark navbar ══ */}
      <nav className={`nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="nav-left">
          <div className="nav-logo">
            <img src="/image/logo-removebg-preview.png" alt="JNEC Logo" />
          </div>
          <span className="nav-brand">JNEC Clubs</span>
        </div>

        {/* DYNAMIC CATEGORIES — hover with delay */}
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
                  {catClubs.map(club => (
                    <div className="cat-dd-item" key={club.id}
                      onClick={() => { setOpenDropdown(null); goToClub(club.id); }}>
                      {club.name}
                    </div>
                  ))}
                  {catClubs.length === 0 && (
                    <div className="cat-dd-item" style={{ color: '#bbb', cursor: 'default' }}>No clubs yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE CENTER SEARCH */}
        <div className="nav-mobile-search">
          <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 15 }}>⌕</span>
          <input type="text" placeholder="Search clubs..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="nav-right">
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
            <button className="mobile-nfl" onClick={() => scrollTo('announcements-section')}>Announcements</button>
            <button className="mobile-nfl" onClick={() => scrollTo('about-section')}>About us</button>
            <button className="mobile-nfl" onClick={() => scrollTo('clubs-section')}>Browse Clubs</button>
            <button className="mobile-nfl mobile-logout" onClick={handleLogout}>Log out</button>
          </div>
          <div className="mobile-cats-title">Categories</div>
          <div className="mobile-cats">
            {categories.map(cat => (
              <div className={`mobile-cat-section${openMobileCat === cat.id ? ' expanded' : ''}`} key={cat.id}>
                <div className="mobile-cat-header"
                  onClick={() => setOpenMobileCat(openMobileCat === cat.id ? null : cat.id)}>
                  {cat.name}
                </div>
                <div className="mobile-cat-list">
                  {clubs.filter(c => c.category === cat.name).map(club => (
                    <div className="mobile-cat-club" key={club.id}
                      onClick={() => { setMenuOpen(false); goToClub(club.id); }}>
                      {club.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            <button className="btn-browse ripple-btn"
              onClick={(e) => { addRipple(e, e.currentTarget); scrollTo('clubs-section'); }}>
              Browse all clubs
            </button>
          </div>
          <div className="stats-bar">
            <div className="sb"><div className="sb-n">{stats.clubs}</div><div className="sb-l">Total Clubs</div></div>
            <div className="sb"><div className="sb-n">{stats.members > 0 ? `${stats.members}+` : '0'}</div><div className="sb-l">Members</div></div>
            <div className="sb"><div className="sb-n">{stats.categories}</div><div className="sb-l">Categories</div></div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">

        {/* MY CLUB */}
        {myClub && (
          <div className="myclub-section" id="myclub-section">
            <div className="myclub-label"><div className="myclub-label-dot" />Your Club</div>
            <div className="myclub-card" onClick={() => navigate('/advisor/club-dashboard')}>
              <div className="myclub-avatar">{myClub.name ? myClub.name.charAt(0).toUpperCase() : '?'}</div>
              <div className="myclub-info">
                <div className="myclub-name">{myClub.name}</div>
                <div className="myclub-members">{myClub.members_count || 0} members</div>
                <span className="myclub-cat-pill">{myClub.category || '—'}</span>
              </div>
              <div className="myclub-arrow">›</div>
            </div>
          </div>
        )}

        {/* CREATE CLUB BANNER — only if no club yet */}
        {!myClub && (
          <div className="ready-banner" id="ready-banner">
            <div>
              <div className="rb-title">Ready to start your club?</div>
              <div className="rb-sub">Pick a category created by the Super Admin and launch your club in minutes.</div>
            </div>
            <button className="btn-gold ripple-btn"
              onClick={(e) => { addRipple(e, e.currentTarget); setCreateOpen(true); setCreateStep(1); }}>
              + Create a club
            </button>
          </div>
        )}

        {/* ALL CLUBS */}
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
          <div className="clubs-grid">
            {filteredClubs.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 14, padding: '1rem 0' }}>No clubs found.</p>
            ) : filteredClubs.map(club => {
              const catName = club.category || '';
              const bg = CAT_BG[catName] || '#eee';
              const tc = CAT_TC[catName] || '#555';
              const shortDesc = (club.description || '').length > 100
                ? club.description.slice(0, 100) + '...'
                : (club.description || '');
              return (
                <div className="club-card fade-in-card" key={club.id} onClick={() => goToClub(club.id)}>
                  <div className="cc-body">
                    <div className="cc-name">{club.name}</div>
                    <div className="cc-desc">{shortDesc || 'No description available.'}</div>
                    <div className="cc-foot">
                      <span className="cc-mem">{club.members_count || 0} members</span>
                      <span className="cc-tag" style={{ background: bg, color: tc }}>{catName}</span>
                    </div>
                    <button className="view-btn ripple-btn"
                      onClick={(e) => { e.stopPropagation(); addRipple(e, e.currentTarget); goToClub(club.id); }}>
                      View club →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ABOUT */}
        <div id="about-section" className="about-section">
          <div className="about-eyebrow">Learn more about this platform and how it works</div>
          <div className="about-main-title">About JNEC Club Directory</div>
          <div className="about-dark">
            <div className="about-dark-bg" />
            <div className="about-dark-overlay" />
            <div className="about-dark-content">
              <h2>Bringing JNEC students<br />together through <em>Clubs</em></h2>
              <p>A central platform for students and advisors to discover, create, and manage clubs at Jigme Namgyel Engineering College.</p>
            </div>
          </div>
          <div className="about-cards">
            <div className="about-card fade-in-card">
              <div className="ac-ico">🎓</div>
              <div className="ac-title">Who we are</div>
              <div className="ac-text">The JNEC Club Directory is the official platform for all student clubs at Jigme Namgyel Engineering College.</div>
            </div>
            <div className="about-card fade-in-card">
              <div className="ac-ico">🎯</div>
              <div className="ac-title">Our mission</div>
              <div className="ac-text">To foster a vibrant campus community by making it easy for students to find their place and for advisors to build meaningful clubs.</div>
            </div>
          </div>
          <div className="steps-row">
            <div className="step-card fade-in-card">
              <div className="step-num">1</div>
              <div className="step-title">Browse clubs</div>
              <div className="step-text">Filter by category to find clubs that match your interests.</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <span className="ft-l">© 2025 JNEC Club Directory</span>
        <span className="ft-r">Jigme Namgyel Engineering College</span>
      </footer>

      {/* CREATE CLUB MODAL */}
      {createOpen && (
        <div className="create-overlay open" onClick={() => setCreateOpen(false)}>
          <div className="create-modal" onClick={e => e.stopPropagation()}>
            <div className="create-top">
              <span className="create-title-text">Create a Club</span>
              <div className="csteps">
                <span className={`cstep${createStep === 1 ? ' active' : ' done'}`}>Write Details</span>
                <span className="cstep-sep">›</span>
                <span className={`cstep${createStep === 2 ? ' active' : ''}`}>Preview</span>
              </div>
              <button className="modal-x" onClick={() => setCreateOpen(false)}>✕</button>
            </div>
            {createStep === 1 && (
              <>
                <div className="create-body">
                  <div className="cfield">
                    <label>Club Name</label>
                    <input type="text" value={form.name} onChange={e => updateForm('name', e.target.value)}
                      style={formErrors.name ? { borderColor: '#e05555' } : {}} />
                    {formErrors.name && <span style={{ color: '#e05555', fontSize: 11 }}>Required</span>}
                  </div>
                  <div className="cf2">
                    <div className="cfield">
                      <label>Category</label>
                      <select value={form.category} onChange={e => updateForm('category', e.target.value)}
                        style={formErrors.category ? { borderColor: '#e05555' } : {}}>
                        <option value="">— Select category —</option>
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                      {formErrors.category && <span style={{ color: '#e05555', fontSize: 11 }}>Required</span>}
                    </div>
                    <div className="cfield">
                      <label>Club Secretary <span className="opt">(optional)</span></label>
                      <input type="text" value={form.secretary} onChange={e => updateForm('secretary', e.target.value)} />
                    </div>
                  </div>
                  <div className="cfield">
                    <label>Aim</label>
                    <input type="text" value={form.aim} onChange={e => updateForm('aim', e.target.value)}
                      style={formErrors.aim ? { borderColor: '#e05555' } : {}} />
                    {formErrors.aim && <span style={{ color: '#e05555', fontSize: 11 }}>Required</span>}
                  </div>
                  <div className="cfield">
                    <label>Objectives</label>
                    <div className="obj-list">
                      {form.objectives.map((obj, i) => (
                        <div className="obj-row" key={i}>
                          <input type="text" value={obj} onChange={e => updateObjective(i, e.target.value)} />
                          <button className="obj-del" onClick={() => removeObjective(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                    <button className="add-obj-btn" onClick={addObjective}>+ Add Objective</button>
                  </div>
                  <div className="cfield">
                    <label>Description</label>
                    <textarea value={form.description} onChange={e => updateForm('description', e.target.value)}
                      style={formErrors.description ? { borderColor: '#e05555' } : {}} />
                    {formErrors.description && <span style={{ color: '#e05555', fontSize: 11 }}>Required</span>}
                  </div>
                </div>
                <div className="create-footer">
                  <button className="cfbtn-s" onClick={() => setCreateOpen(false)}>Cancel</button>
                  <button className="cfbtn-p ripple-btn" onClick={(e) => { addRipple(e, e.currentTarget); goPreview(); }}>Preview →</button>
                </div>
              </>
            )}
            {createStep === 2 && previewData && (
              <>
                <div className="create-body">
                  <p style={{ fontSize: 13, color: '#aaa', marginBottom: '1.5rem' }}>Review your club below.</p>
                  <div className="pv-name">{previewData.name}</div>
                  <div className="pv-cat">Category: {previewData.category}</div>
                  <div className="pv-sec"><div className="pv-label">Aim</div><div className="pv-val">{previewData.aim}</div></div>
                  <div className="pv-sec">
                    <div className="pv-label">Objectives</div>
                    <div className="pv-val">
                      {previewData.objectives.filter(o => o.trim()).map((o, i) => <div key={i}>• {o}</div>)}
                      {previewData.objectives.filter(o => o.trim()).length === 0 && '—'}
                    </div>
                  </div>
                  <div className="pv-sec"><div className="pv-label">Description</div><div className="pv-val">{previewData.description}</div></div>
                  <div className="pv-bottom">
                    <div className="pv-block"><div className="pv-bl">Club Secretary</div><div className="pv-bv">{previewData.secretary || '—'}</div></div>
                  </div>
                </div>
                <div className="create-footer">
                  <button className="cfbtn-s" onClick={() => setCreateStep(1)}>← Back</button>
                  <button className="cfbtn-p ripple-btn" onClick={submitClub} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Club'}
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