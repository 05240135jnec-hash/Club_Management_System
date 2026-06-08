import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/advisor.css';
import '../../styles/student/studentclubdetail.css';

const CAT_TC = {
  'Sports': '#0c447c', 'Volunteering': '#085041', 'Technology': '#3c3489',
  'Arts & Culture': '#72243e', 'Entertainment': '#633806',
  'Maintenance': '#2c2c2a', 'Social Service': '#712b13',
};

export default function StudentClubDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [club,          setClub]          = useState(null);
  const [albums,        setAlbums]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [lightbox,      setLightbox]      = useState(null);
  const [myClubs,       setMyClubs]       = useState([]);

  const [categories,  setCategories]  = useState([]);
  const [clubs,       setClubs]       = useState([]);
  const [navScrolled, setNavScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /* hamburger */
  const [hamOpen,     setHamOpen]     = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const hamRef = useRef(null);

  /* enrollment */
  const [enrollOpen,       setEnrollOpen]       = useState(false);
  const [enrollKey,        setEnrollKey]        = useState('');
  const [enrollKeyVisible, setEnrollKeyVisible] = useState(false);
  const [enrolling,        setEnrolling]        = useState(false);
  const [enrollError,      setEnrollError]      = useState('');
  const [enrollSuccess,    setEnrollSuccess]    = useState('');

  useEffect(() => {
    fetchAll();
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

  const fetchAll = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [catsRes, clubsRes, myClubsRes] = await Promise.allSettled([
        axios.get('/api/categories', { headers }),
        axios.get('/api/clubs', { headers }),
        axios.get('/api/student/my-clubs', { headers }),
      ]);
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value.data.data || catsRes.value.data || []);
      if (clubsRes.status === 'fulfilled') {
        const data = clubsRes.value.data;
        const list = data.clubs ?? data.data ?? data ?? [];
        setClubs(list);
        const found = list.find(c => String(c.id) === String(id));
        setClub(found || null);
        setLoading(false);
        if (found) fetchAlbums(found.id, headers);
      } else { setLoading(false); }
      if (myClubsRes.status === 'fulfilled') setMyClubs(myClubsRes.value.data.clubs || []);
    } catch (err) { console.error('Fetch error:', err); setLoading(false); }
  };

  const fetchAlbums = async (clubId, headers) => {
    try {
      const res = await axios.get(`/api/student/clubs/${clubId}/albums`, { headers });
      setAlbums(res.data.albums || []);
    } catch { setAlbums([]); }
    finally { setAlbumsLoading(false); }
  };

  const isJoined = () => myClubs.some(c => String(c.id) === String(id));

  const openEnroll = () => {
    if (isJoined()) return;
    if (myClubs.length >= 2) { alert('You can only join a maximum of 2 clubs.'); return; }
    setEnrollKey(''); setEnrollError(''); setEnrollSuccess('');
    setEnrollKeyVisible(false); setEnrollOpen(true);
  };

  const closeEnroll = () => { setEnrollOpen(false); setEnrollKey(''); setEnrollError(''); setEnrollSuccess(''); };

  const handleEnroll = async () => {
    if (!enrollKey.trim()) { setEnrollError('Please enter the enrollment key.'); return; }
    setEnrolling(true); setEnrollError('');
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post('/api/clubs/join', { enrollment_key: enrollKey.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setEnrollSuccess(res.data.message || 'Successfully joined!');
      const myRes = await axios.get('/api/student/my-clubs', { headers: { Authorization: `Bearer ${token}` } });
      setMyClubs(myRes.data.clubs || []);
      setTimeout(() => closeEnroll(), 1800);
    } catch (err) { setEnrollError(err.response?.data?.message || 'Invalid enrollment key. Please try again.'); }
    finally { setEnrolling(false); }
  };

  const handleLogout = async () => {
    try { const token = sessionStorage.getItem('token'); await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } }); } catch (_) {}
    sessionStorage.clear(); navigate('/login');
  };

  const triggerSearch = () => { if (searchQuery.trim()) navigate(`/student/StudentHome`); };
  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') triggerSearch(); };
  const parseObjectives = (raw) => { if (!raw) return []; if (Array.isArray(raw)) return raw; try { return JSON.parse(raw); } catch { return []; } };

  const openLightbox  = (album, imgIdx) => setLightbox({ album, imgIdx });
  const closeLightbox = () => setLightbox(null);
  const lightboxNext  = () => { if (!lightbox) return; const imgs = lightbox.album.images || []; if (lightbox.imgIdx < imgs.length - 1) setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx + 1 }); };
  const lightboxPrev  = () => { if (!lightbox) return; if (lightbox.imgIdx > 0) setLightbox({ ...lightbox, imgIdx: lightbox.imgIdx - 1 }); };

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

  const TopBar = () => (
    <div className="top-announcement-bar">
      <div className="tab-left">
        <a href="#" className="tab-link" onClick={e => { e.preventDefault(); navigate('/student/announcements'); }}>Announcements</a>
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
  );

  if (loading) return (
    <div className="advisor-page"><TopBar /><div className="scd-loading"><div className="scd-spinner" /><p>Loading club...</p></div></div>
  );

  if (!club) return (
    <div className="advisor-page"><TopBar /><div className="scd-loading"><p style={{ color:'#888' }}>Club not found.</p>
      <button onClick={() => navigate('/student/StudentHome')} style={{ marginTop:16, padding:'8px 18px', borderRadius:9, border:'0.5px solid #ddd', background:'#fff', cursor:'pointer' }}>← Back</button>
    </div></div>
  );

  const catName    = club.category || '';
  const objectives = parseObjectives(club.objectives);
  const joined     = isJoined();

  return (
    <div className="advisor-page">

      <TopBar />

      {/* ── BAR 2: Logo clickable, white hamburger, no categories ── */}
      <nav className={`nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="nav-left">
          <div className="nav-logo" style={{cursor:'pointer'}} onClick={() => navigate('/student/StudentHome')}>
            <img src="/image/logo-removebg-preview.png" alt="JNEC Logo" />
          </div>
          <span className="nav-brand" style={{cursor:'pointer'}} onClick={() => navigate('/student/StudentHome')}>JNEC Clubs</span>
          <div style={{marginLeft:10}}>
            <button style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'rgba(255,255,255,.55)',padding:'6px 12px',borderRadius:6}}
              onClick={() => navigate('/student/StudentHome')}>Home</button>
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
                              onClick={() => { navigate(`/student/clubs/${c.id}`); setHamOpen(false); setSelectedCat(null); }}
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
      <div className="scd-page-wrap">

        <div className="scd-breadcrumb">
          <span className="scd-bc-link" onClick={() => navigate('/student/StudentHome')}>Dashboard</span>
          <span className="scd-bc-sep">›</span>
          <span className="scd-bc-link" onClick={() => navigate('/student/StudentHome')}>{catName || 'Clubs'}</span>
          <span className="scd-bc-sep">›</span>
          <span className="scd-bc-cur">{club.name}</span>
        </div>

        <div className="scd-banner">
          <div className="scd-banner-bg" style={club.cover_photo ? {backgroundImage:`url('/storage/${club.cover_photo}')`} : {}} />
          <div className="scd-banner-overlay" />
          <div className="scd-banner-content">
            <div className="scd-banner-avatar">{club.name.charAt(0).toUpperCase()}</div>
            <div className="scd-banner-info">
              <span className="scd-banner-cat">{catName}</span>
              <h1 className="scd-banner-name">{club.name}</h1>
              <div className="scd-banner-meta">
                <span>{club.members_count || 0} members</span>
                {club.advisor?.name && <><span className="scd-meta-dot">·</span><span>Advisor: {club.advisor.name}</span></>}
                {club.co_advisors?.length > 0 && <><span className="scd-meta-dot">·</span><span>Co-Advisor: {club.co_advisors.map(ca=>ca.name).join(', ')}</span></>}
                {club.secretaries?.length > 0 && <><span className="scd-meta-dot">·</span><span>Secretary: {club.secretaries.map(s=>s.name).join(', ')}</span></>}
              </div>
            </div>
            <div className="scd-banner-action">
              {joined ? (
                <button className="scd-join-btn already-joined" disabled>✓ Already a Member</button>
              ) : (
                <button className="scd-join-btn" onClick={openEnroll}>Join Club</button>
              )}
            </div>
          </div>
        </div>

        <div className="scd-body">
          {club.aim && (
            <div className="scd-section">
              <div className="scd-section-label">AIM</div>
              <div className="scd-section-divider" />
              <p className="scd-section-text">{club.aim}</p>
            </div>
          )}
          {club.description && (
            <div className="scd-section">
              <div className="scd-section-label">DESCRIPTION</div>
              <div className="scd-section-divider" />
              <p className="scd-section-text">{club.description}</p>
            </div>
          )}
          {objectives.length > 0 && (
            <div className="scd-section">
              <div className="scd-section-label">OBJECTIVES</div>
              <div className="scd-section-divider" />
              <ul className="scd-objectives">
                {objectives.map((obj, i) => (
                  <li key={i} className="scd-obj-item">
                    <span className="scd-obj-num">{i + 1}</span>
                    <span className="scd-obj-text">{typeof obj === 'string' ? obj : obj.objective || obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="scd-albums-section">
            <div className="scd-albums-header">
              <div className="scd-albums-title">Club Activities</div>
              <p className="scd-albums-sub">Work programs and activities posted by the advisor</p>
            </div>
            {albumsLoading ? (
              <div className="scd-albums-loading"><div className="scd-spinner" /><p>Loading activities...</p></div>
            ) : albums.length === 0 ? (
              <div className="scd-no-albums">
                <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
                <p>No activities posted yet.</p>
                <span>The advisor hasn't uploaded any work program images yet.</span>
              </div>
            ) : (
              <div className="scd-albums-list">
                {albums.map((album) => (
                  <div className="scd-album-card" key={album.id}>
                    <div className="scd-album-header">
                      <div>
                        <div className="scd-album-title">{album.title}</div>
                        <div className="scd-album-meta">
                          <span>By {album.uploaded_by}</span>
                          <span className="scd-album-dot">·</span>
                          <span>{album.created_at}</span>
                        </div>
                      </div>
                      <span className="scd-album-count">{album.images?.length || 0} photos</span>
                    </div>
                    {album.caption && <p className="scd-album-caption">{album.caption}</p>}
                    {album.images && album.images.length > 0 && (
                      <div className="scd-album-images">
                        {album.images.map((img, imgIdx) => (
                          <div key={img.id} className="scd-album-img-wrap" onClick={() => openLightbox(album, imgIdx)}>
                            <img src={img.url} alt={img.file_name} className="scd-album-img" />
                            <div className="scd-img-overlay">
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
        <span className="ft-l">© 2026 JNEC Club Directory — Jigme Namgyel Engineering College</span>
      </footer>

      {/* LIGHTBOX */}
      {lightbox && lightbox.album && (
        <div className="scd-lightbox-overlay" onClick={closeLightbox}>
          <div className="scd-lightbox-modal" onClick={e => e.stopPropagation()}>
            <div className="scd-lb-topbar">
              <div className="scd-lb-info">
                <div className="scd-lb-album-title">{lightbox.album.uploaded_by || lightbox.album.title}</div>
                <div className="scd-lb-album-meta">{lightbox.album.created_at} · {lightbox.album.images?.length || 0} photos</div>
              </div>
              <button className="scd-lb-close" onClick={closeLightbox}>Close</button>
            </div>
            <div className="scd-lb-img-area">
              <button className="scd-lb-prev" onClick={lightboxPrev} style={{ opacity: lightbox.imgIdx === 0 ? 0.3 : 1 }}>‹</button>
              <img src={lightbox.album.images[lightbox.imgIdx]?.url} alt="Activity" className="scd-lb-img" />
              <button className="scd-lb-next" onClick={lightboxNext} style={{ opacity: lightbox.imgIdx === (lightbox.album.images.length - 1) ? 0.3 : 1 }}>›</button>
            </div>
            <div className="scd-lb-caption-row">
              <span className="scd-lb-caption">{lightbox.album.caption || ''}</span>
              <span className="scd-lb-counter">{lightbox.imgIdx + 1} / {lightbox.album.images.length}</span>
            </div>
            <div className="scd-lb-thumbs">
              {lightbox.album.images.map((img, idx) => (
                <div key={img.id} className={`scd-lb-thumb${idx === lightbox.imgIdx ? ' active' : ''}`}
                  onClick={() => setLightbox({ ...lightbox, imgIdx: idx })}>
                  <img src={img.url} alt="" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT MODAL */}
      {enrollOpen && (
        <div className="scd-enroll-overlay" onClick={closeEnroll}>
          <div className="scd-enroll-modal" onClick={e => e.stopPropagation()}>
            <div className="scd-enroll-modal-top">
              <div>
                <div className="scd-enroll-modal-title">Enter Enrollment Key</div>
                <div className="scd-enroll-modal-sub">Enter the key provided by your club advisor to join <strong>{club.name}</strong>.</div>
              </div>
              <button className="scd-enroll-modal-x" onClick={closeEnroll}>✕</button>
            </div>
            <div className="scd-enroll-modal-body">
              <label className="scd-enroll-label">ENROLLMENT KEY</label>
              <div className="scd-enroll-input-wrap">
                <input type={enrollKeyVisible ? 'text' : 'password'}
                  className={`scd-enroll-input${enrollError ? ' error' : ''}${enrollSuccess ? ' success' : ''}`}
                  placeholder="e.g. CLUB2025" value={enrollKey}
                  onChange={e => { setEnrollKey(e.target.value); setEnrollError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleEnroll()} autoFocus />
                <button className="scd-enroll-eye" onClick={() => setEnrollKeyVisible(!enrollKeyVisible)}>
                  {enrollKeyVisible ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {enrollError   && <div className="scd-enroll-error">{enrollError}</div>}
              {enrollSuccess && <div className="scd-enroll-success">✓ {enrollSuccess}</div>}
              <div className="scd-enroll-hint">The key is displayed on the notice board or provided by your advisor.</div>
            </div>
            <div className="scd-enroll-modal-footer">
              <button className="scd-enroll-cancel" onClick={closeEnroll}>Cancel</button>
              <button className="scd-enroll-submit" onClick={handleEnroll} disabled={enrolling}>{enrolling ? 'Enrolling...' : 'Enroll Now'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}