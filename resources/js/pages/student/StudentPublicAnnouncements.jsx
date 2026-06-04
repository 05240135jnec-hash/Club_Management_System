import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/student/StudentPublicAnnouncements.css';

const getToken = () => sessionStorage.getItem('token');

const CAT_COLORS = {
  'Sports':        { bg: '#e6f1fb', tc: '#0c447c' },
  'Volunteering':  { bg: '#e1f5ee', tc: '#085041' },
  'Technology':    { bg: '#eeedfe', tc: '#3c3489' },
  'Arts & Culture':{ bg: '#fbeaf0', tc: '#72243e' },
  'Entertainment': { bg: '#faeeda', tc: '#633806' },
  'Maintenance':   { bg: '#f1efe8', tc: '#2c2c2a' },
  'Social Service':{ bg: '#faece7', tc: '#712b13' },
};

function dateOnly(str) {
  if (!str) return '';
  const d = new Date(str);
  if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return str.replace(/\s+\d{1,2}:\d{2}.*$/, '').trim();
}

/* ── Custom Select ── */
function YoeSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div className="yoe-select" ref={ref}>
      <button className={`yoe-select-btn${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)} type="button">
        <span>{selected ? selected.label : placeholder}</span>
        <svg className="yoe-select-chevron" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="yoe-select-drop">
          {options.map(opt => (
            <div key={opt.value}
              className={`yoe-select-opt${opt.value === value ? ' active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Calendar Picker ── */
function YoeCalendar({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [vY, setVY] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear());
  const [vM, setVM] = useState(() => value ? new Date(value).getMonth()    : new Date().getMonth());
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DN=['Mo','Tu','We','Th','Fr','Sa','Su'];
  const gD=(y,m)=>new Date(y,m+1,0).getDate();
  const gF=(y,m)=>{ let d=new Date(y,m,1).getDay(); return d===0?6:d-1; };
  function cells() {
    const tot=gD(vY,vM),st=gF(vY,vM),arr=[];
    const pt=gD(vY,vM===0?11:vM-1);
    for(let i=st-1;i>=0;i--) arr.push({d:pt-i,c:false});
    for(let d=1;d<=tot;d++) arr.push({d,c:true});
    for(let d=1;d<=42-arr.length;d++) arr.push({d,c:false});
    return arr;
  }
  function pick(day){ const d=new Date(vY,vM,day); onChange(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); setOpen(false); }
  const prev=()=>{ if(vM===0){setVM(11);setVY(y=>y-1);}else setVM(m=>m-1); };
  const nxt =()=>{ if(vM===11){setVM(0);setVY(y=>y+1);}else setVM(m=>m+1); };
  const today=new Date(), sel=value?new Date(value):null;
  const isSel=(d,c)=>c&&sel&&sel.getFullYear()===vY&&sel.getMonth()===vM&&sel.getDate()===d;
  const isTod=(d,c)=>c&&today.getFullYear()===vY&&today.getMonth()===vM&&today.getDate()===d;
  const lbl=value?new Date(value).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
  return (
    <div className="yoe-cal" ref={ref}>
      <button className={`yoe-cal-btn${open?' open':''}`} onClick={()=>setOpen(v=>!v)} type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="yoe-cal-icon">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{lbl||'Pick a date'}</span>
        {value&&<span className="yoe-cal-x" onClick={e=>{e.stopPropagation();onChange('');}}>×</span>}
      </button>
      {open&&(
        <div className="yoe-cal-pop">
          <div className="yoe-cal-head">
            <button className="yoe-cal-nav" onClick={prev}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="15 18 9 12 15 6"/></svg></button>
            <span className="yoe-cal-month">{MN[vM]} {vY}</span>
            <button className="yoe-cal-nav" onClick={nxt}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="9 6 15 12 9 18"/></svg></button>
          </div>
          <div className="yoe-cal-grid">
            {DN.map(d=><div key={d} className="yoe-cal-dh">{d}</div>)}
            {cells().map((cell,i)=>(
              <div key={i}
                className={`yoe-cal-cell${!cell.c?' other':''}${isSel(cell.d,cell.c)?' sel':''}${isTod(cell.d,cell.c)&&!isSel(cell.d,cell.c)?' today':''}`}
                onClick={()=>cell.c&&pick(cell.d)}>{cell.d}</div>
            ))}
          </div>
          <div className="yoe-cal-foot">
            <button className="yoe-cal-foot-btn" onClick={()=>{onChange('');setOpen(false);}}>Clear</button>
            <button className="yoe-cal-foot-btn blue" onClick={()=>{const t=new Date();setVY(t.getFullYear());setVM(t.getMonth());pick(t.getDate());}}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ MAIN ══ */
export default function StudentAnnouncements() {
  const navigate                          = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [viewAnn, setViewAnn]             = useState(null);
  const [categories, setCategories]       = useState([]);
  const [clubs, setClubs]                 = useState([]);
  const [navScrolled, setNavScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterClub, setFilterClub]       = useState('');
  const [filterType, setFilterType]       = useState('');
  const [filterDate, setFilterDate]       = useState('');

  /* hamburger state — same pattern as AdvisorHome */
  const [hamOpen,      setHamOpen]      = useState(false);
  const [selectedCat,  setSelectedCat]  = useState(null);
  const hamRef = useRef(null);

  useEffect(() => { if (!getToken()) { navigate('/login'); return; } fetchAll(); }, []);
  useEffect(() => {
    const f = () => setNavScrolled(window.scrollY > 100);
    window.addEventListener('scroll', f);
    return () => window.removeEventListener('scroll', f);
  }, []);

  /* close hamburger on outside click */
  useEffect(() => {
    const fn = (e) => {
      if (hamRef.current && !hamRef.current.contains(e.target)) {
        setHamOpen(false);
        setSelectedCat(null);
      }
    };
    if (hamOpen) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [hamOpen]);

  async function fetchAll() {
    setLoading(true);
    try {
      const H = { Authorization: `Bearer ${getToken()}` };
      const [a, c, cl] = await Promise.allSettled([
        axios.get('/api/student/announcements', { headers: H }),
        axios.get('/api/categories',            { headers: H }),
        axios.get('/api/clubs',                 { headers: H }),
      ]);
      if (a.status  === 'fulfilled') setAnnouncements(a.value.data.announcements || []);
      if (c.status  === 'fulfilled') setCategories(c.value.data.data || c.value.data || []);
      if (cl.status === 'fulfilled') setClubs(cl.value.data.data || cl.value.data || []);
    } catch { setAnnouncements([]); }
    setLoading(false);
  }

  async function handleLogout() {
    try { await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${getToken()}` } }); } catch (_) {}
    sessionStorage.clear();
    navigate('/login');
  }

  /* group clubs by category — same as AdvisorHome */
  const clubsByCategory = {};
  categories.forEach(cat => {
    const n = cat.name ?? cat;
    clubsByCategory[n] = clubs.filter(c => (c.category?.name ?? c.category) === n);
  });
  const panelClubs = selectedCat ? (clubsByCategory[selectedCat] ?? []) : [];

  const toggleHam = () => {
    if (hamOpen) {
      setHamOpen(false);
      setSelectedCat(null);
    } else {
      setHamOpen(true);
      if (categories.length > 0) setSelectedCat(categories[0].name ?? categories[0]);
    }
  };

  const uniqueClubs = [...new Set(announcements.map(a => a.club_name).filter(Boolean))];
  const clubOpts    = [{ value: '', label: 'All Clubs' }, ...uniqueClubs.map(c => ({ value: c, label: c }))];
  const typeOpts    = [
    { value: '',         label: 'All Types' },
    { value: 'event',   label: 'Event' },
    { value: 'general', label: 'General' },
    { value: 'reminder',label: 'Reminder' },
  ];

  const filtered = announcements.filter(a => {
    const mS = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || (a.club_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const mC = !filterClub || a.club_name === filterClub;
    const mT = !filterType || a.type === filterType;
    let mD = true;
    if (filterDate) {
      const ad = new Date(a.created_at || a.date_sent), fd = new Date(filterDate);
      mD = !isNaN(ad) && !isNaN(fd) && ad.getFullYear() === fd.getFullYear() && ad.getMonth() === fd.getMonth() && ad.getDate() === fd.getDate();
    }
    return mS && mC && mT && mD;
  });

  const hasFilter = filterClub || filterType || filterDate;

  /* ══ TOP BAR + NAVBAR ══ */
  const TopBar = ({ currentView }) => (
    <>
      {/* ── BAR 1: Black top bar ── */}
      <div className="yoe-top-bar">
        <div className="yoe-top-bar-left">
          <button className="yoe-top-bar-link" onClick={() => navigate('/student/StudentHome')}>
            Home
          </button>
          <button
            className="yoe-top-bar-link"
            style={{ color: '#ffffff', fontWeight: 700, borderBottom: '2px solid rgba(255,255,255,0.5)', paddingBottom: '2px' }}
            onClick={() => {
              if (currentView === 'detail') {
                setViewAnn(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            Announcements
          </button>
          <button className="yoe-top-bar-link" onClick={() => navigate('/student/audit-report')}>
            Audit Report
          </button>
        </div>
        <div className="yoe-top-bar-right">
          <div className="yoe-top-bar-search">
            <span className="yoe-top-bar-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="yoe-top-bar-logout" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {/* ── BAR 2: Navy navbar — no category pills, hamburger only ── */}
      <nav className={`yoe-navbar${navScrolled ? ' scrolled' : ''}`}>
        <div className="yoe-navbar-left">
          {/* Clickable logo */}
          <div
            className="yoe-navbar-logo"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/student/StudentHome')}
          >
            <img src="/image/logo-removebg-preview.png" alt="JNEC Logo" />
          </div>
          {/* Clickable brand text */}
          <span
            className="yoe-navbar-brand"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/student/StudentHome')}
          >
            JNEC Clubs
          </span>
        </div>

        {/* spacer */}
        <div style={{ flex: 1 }} />

        <div className="yoe-navbar-right">
          {/* 2-panel hamburger — identical to AdvisorHome */}
          <div className="pub-hamburger-wrap" ref={hamRef}>
            <button
              className={`pub-hamburger-btn${hamOpen ? ' open' : ''}`}
              onClick={toggleHam}
              aria-label="Browse categories"
            >
              <span /><span /><span />
            </button>

            {hamOpen && (
              <div className="pub-ham-panel">
                {/* LEFT: category list */}
                <div className="pub-ham-cats-side">
                  <div className="pub-ham-side-title">CATEGORIES</div>
                  {categories.map(cat => {
                    const cName = cat.name ?? cat;
                    const count = (clubsByCategory[cName] ?? []).length;
                    return (
                      <div
                        key={cName}
                        className={`pub-ham-cat-row${selectedCat === cName ? ' active' : ''}`}
                        onClick={() => setSelectedCat(cName)}
                      >
                        <span className="pub-ham-cat-name">{cName}</span>
                        <span className="pub-ham-cat-badge">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pub-ham-divider" />

                {/* RIGHT: clubs in selected category */}
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
                              onClick={() => {
                                navigate(`/student/clubs/${c.id}`);
                                setHamOpen(false);
                                setSelectedCat(null);
                              }}
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
    </>
  );

  /* ══ DETAIL VIEW ══ */
  if (viewAnn) {
    const typeCls   = viewAnn.type === 'event' ? 'event' : viewAnn.type === 'reminder' ? 'reminder' : 'general';
    const typeLabel = viewAnn.type === 'event' ? 'Event' : viewAnn.type === 'reminder' ? 'Reminder' : 'General';
    const catColor  = CAT_COLORS[viewAnn.club_category] || { bg: '#f0f2f5', tc: '#334155' };
    const recipients = viewAnn.recipients === 'members' ? 'Club Members' : viewAnn.recipients === 'students' ? 'All Students' : 'Members & Students';
    return (
      <div className="yoe-page">
        <TopBar currentView="detail" />
        <div className="yoe-body">
          <button className="yoe-back-btn" onClick={() => { setViewAnn(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Announcements
          </button>
          <div className="yoe-detail-card">
            <div className="yoe-detail-top">
              <span className={`yoe-badge ${typeCls}`}>{typeLabel}</span>
              <h2 className="yoe-detail-title">{viewAnn.title}</h2>
              <div className="yoe-detail-date">{dateOnly(viewAnn.date_sent || viewAnn.created_at)}</div>
            </div>
            <div className="yoe-detail-div" />
            <div className="yoe-detail-content">{viewAnn.content}</div>
            {viewAnn.attachment && (
              <div className="yoe-detail-attach">
                <a href={viewAnn.attachment} target="_blank" rel="noreferrer" className="yoe-attach-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  View Attachment
                </a>
              </div>
            )}
            <div className="yoe-detail-div" />
            <div className="yoe-detail-meta">
              <div className="yoe-meta-item">
                <span className="yoe-meta-label">To:</span>
                <span className="yoe-meta-val">{recipients}</span>
              </div>
              <div className="yoe-meta-sep" />
              <div className="yoe-meta-item">
                <span className="yoe-meta-label">Posted by:</span>
                <span className="yoe-meta-val bold">{viewAnn.created_by}</span>
              </div>
              {viewAnn.club_category !== 'Administration' && (
                <>
                  <div className="yoe-meta-sep" />
                  <div className="yoe-meta-item">
                    <span className="yoe-meta-label">Club:</span>
                    <span className="yoe-club-badge" style={{ background: catColor.bg, color: catColor.tc }}>
                      {viewAnn.club_name}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══ LIST VIEW ══ */
  return (
    <div className="yoe-page">
      <TopBar currentView="list" />
      <div className="yoe-body">
        <div className="yoe-page-header">
          <h1 className="yoe-page-title">Announcement</h1>
          <div className="yoe-filters">
            <YoeSelect value={filterType} onChange={setFilterType} options={typeOpts} placeholder="All Types" />
            <YoeCalendar value={filterDate} onChange={setFilterDate} />
            {hasFilter && (
              <button className="yoe-clear-btn" onClick={() => { setFilterType(''); setFilterDate(''); }}>
                Clear all
              </button>
            )}
          </div>
        </div>

        {!loading && (
          <div className="yoe-result-bar">
            <span className="yoe-dot" />
            Showing <strong>{filtered.length}</strong> of {announcements.length} announcements
          </div>
        )}

        {loading ? (
          <div className="yoe-timeline">
            <div className="yoe-tl-line" />
            {[0, 1, 2].map(i => {
              const isLeft = i % 2 === 0;
              return (
                <div key={i} className="yoe-tl-row" style={{ animationDelay: `${i * 0.07}s` }}>
                  {isLeft ? (
                    <>
                      <div className="yoe-tl-left-col">
                        <div className="yoe-skel-card" style={{ width: '100%' }}>
                          <div className="yoe-skel-line w" /><div className="yoe-skel-line" /><div className="yoe-skel-line s" />
                        </div>
                      </div>
                      <div className="yoe-tl-mid"><div className="yoe-tl-dot" /></div>
                      <div className="yoe-tl-empty" />
                    </>
                  ) : (
                    <>
                      <div className="yoe-tl-empty" />
                      <div className="yoe-tl-mid"><div className="yoe-tl-dot" /></div>
                      <div className="yoe-tl-right-col">
                        <div className="yoe-skel-card" style={{ width: '100%' }}>
                          <div className="yoe-skel-line w" /><div className="yoe-skel-line" /><div className="yoe-skel-line s" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : filtered.length === 0 ? (
          <div className="yoe-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            No announcements found.
          </div>
        ) : (
          <div className="yoe-timeline">
            <div className="yoe-tl-line" />
            {filtered.map((ann, i) => {
              const isLeft    = i % 2 === 0;
              const catColor  = CAT_COLORS[ann.club_category] || { bg: '#f0f2f5', tc: '#334155' };
              const displayDate = dateOnly(ann.date_sent || ann.created_at);
              const Card = (
                <div
                  className="yoe-tl-card"
                  onClick={() => { setViewAnn(ann); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <div className="yoe-card-title">{ann.title}</div>
                  <p className="yoe-card-body">
                    {ann.content.length > 64 ? ann.content.slice(0, 64) + '...' : ann.content}
                  </p>
                  <div className="yoe-card-club-row">
                    {ann.club_category !== 'Administration' && (
                      <span className="yoe-club-chip" style={{ background: catColor.bg, color: catColor.tc }}>
                        {ann.club_name}
                      </span>
                    )}
                  </div>
                </div>
              );
              return (
                <div key={ann.id || i} className="yoe-tl-row" style={{ animationDelay: `${i * 0.07}s` }}>
                  {isLeft ? (
                    <>
                      <div className="yoe-tl-left-col">{Card}</div>
                      <div className="yoe-tl-mid">
                        <div className="yoe-tl-dot" />
                        <div className="yoe-tl-pill">{displayDate}</div>
                      </div>
                      <div className="yoe-tl-empty" />
                    </>
                  ) : (
                    <>
                      <div className="yoe-tl-empty" />
                      <div className="yoe-tl-mid">
                        <div className="yoe-tl-dot" />
                        <div className="yoe-tl-pill">{displayDate}</div>
                      </div>
                      <div className="yoe-tl-right-col">{Card}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}