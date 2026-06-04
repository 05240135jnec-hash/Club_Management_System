import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/student/auditreport.css';

const getToken = () => sessionStorage.getItem('token');

function getFileExt(fileName) {
  if (!fileName) return { label: 'FILE', cls: 'docx' };
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf')  return { label: 'PDF',  cls: 'pdf' };
  if (ext === 'xlsx') return { label: 'XLSX', cls: 'xlsx' };
  if (['doc','docx'].includes(ext)) return { label: 'DOCX', cls: 'docx' };
  return { label: 'FILE', cls: 'docx' };
}

function FileIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

export default function StudentAuditReport() {
  const navigate                          = useNavigate();
  const [reports, setReports]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [viewReport, setViewReport]       = useState(null);
  const [comment, setComment]             = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [commentError, setCommentError]   = useState('');
  const [openMenuId, setOpenMenuId]       = useState(null);
  const [categories, setCategories]       = useState([]);
  const [clubs, setClubs]                 = useState([]);
  const [navScrolled, setNavScrolled]     = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [pdfOpen, setPdfOpen]             = useState(false);
  const menuRef                           = useRef(null);

  /* hamburger state */
  const [hamOpen,     setHamOpen]     = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const hamRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    fetchAll();
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
        setPdfOpen(false);
        setHamOpen(false);
        setSelectedCat(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [reportsRes, catsRes, clubsRes] = await Promise.allSettled([
        axios.get('/api/reports/audit', { headers }),
        axios.get('/api/categories',    { headers }),
        axios.get('/api/clubs',         { headers }),
      ]);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data.reports || []);
      if (catsRes.status   === 'fulfilled') setCategories(catsRes.value.data.data || catsRes.value.data || []);
      if (clubsRes.status  === 'fulfilled') setClubs(clubsRes.value.data.data || clubsRes.value.data || []);
    } catch { setReports([]); }
    setLoading(false);
  }

  function openReport(report) {
    setViewReport(report);
    setComment('');
    setCommentError('');
    setOpenMenuId(null);
    setPdfOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function backToList() {
    setViewReport(null);
    setPdfOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleLogout() {
    try {
      await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${getToken()}` } });
    } catch (_) {}
    sessionStorage.clear();
    navigate('/login');
  }

  /* Lock this report's comment box for the rest of the session */
  function markCommented(reportId) {
    const updated = { ...viewReport, has_commented: true };
    setViewReport(updated);
    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, has_commented: true } : r
    ));
  }

  async function submitComment() {
    if (!comment.trim()) { setCommentError('Please enter your comment.'); return; }
    /* Extra safety — if already commented, show red error and stop */
    if (viewReport.has_commented) {
      setCommentError('You have already submitted a comment on this report.');
      return;
    }
    setSubmitting(true);
    setCommentError('');
    try {
      await axios.post(`/api/audit-reports/${viewReport.id}/feedback`, {
        feedback: comment.trim(),
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setComment('');
      markCommented(viewReport.id);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit comment.';
      if (msg.toLowerCase().includes('already')) {
        /* Backend says already submitted — show red error then lock */
        setCommentError('You have already submitted a comment on this report.');
        setTimeout(() => markCommented(viewReport.id), 1500);
      } else {
        setCommentError(msg);
      }
    }
    setSubmitting(false);
  }

  /* group clubs by category */
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

  /* ══ TOP BAR + NAVBAR ══ */
  const TopBar = ({ currentView }) => (
    <>
      <div className="ar-top-bar">
        <div className="ar-top-bar-left">
          <button className="ar-top-bar-link" onClick={() => navigate('/student/StudentHome')}>
            Home
          </button>
          <button className="ar-top-bar-link" onClick={() => navigate('/student/public-announcements')}>
            Announcements
          </button>
          <button
            className="ar-top-bar-link ar-top-bar-link--active"
            onClick={() => { if (currentView === 'detail') backToList(); }}
          >
            Audit Report
          </button>
        </div>
        <div className="ar-top-bar-right">
          <div className="ar-top-bar-search">
            <span className="ar-top-bar-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="ar-top-bar-logout" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <nav className={`ar-navbar${navScrolled ? ' scrolled' : ''}`}>
        <div className="ar-navbar-left">
          <div
            className="ar-navbar-logo"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/student/StudentHome')}
          >
            <img src="/image/logo-removebg-preview.png" alt="JNEC Logo" />
          </div>
          <span
            className="ar-navbar-brand"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/student/StudentHome')}
          >
            JNEC Clubs
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div className="ar-navbar-right">
          <div className="ar-ham-wrap" ref={hamRef}>
            <button
              className={`ar-ham-btn${hamOpen ? ' open' : ''}`}
              onClick={toggleHam}
              aria-label="Browse categories"
            >
              <span /><span /><span />
            </button>

            {hamOpen && (
              <div className="ar-ham-panel">
                <div className="ar-ham-cats-side">
                  <div className="ar-ham-side-title">CATEGORIES</div>
                  {categories.map(cat => {
                    const cName = cat.name ?? cat;
                    const count = (clubsByCategory[cName] ?? []).length;
                    return (
                      <div
                        key={cName}
                        className={`ar-ham-cat-row${selectedCat === cName ? ' active' : ''}`}
                        onClick={() => setSelectedCat(cName)}
                      >
                        <span className="ar-ham-cat-name">{cName}</span>
                        <span className="ar-ham-cat-badge">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="ar-ham-divider" />
                <div className="ar-ham-clubs-side">
                  {selectedCat ? (
                    <>
                      <div className="ar-ham-side-title">{selectedCat}</div>
                      {panelClubs.length === 0 ? (
                        <div className="ar-ham-empty">No clubs in this category yet</div>
                      ) : (
                        <div className="ar-ham-clubs-list">
                          {panelClubs.map(c => (
                            <div
                              key={c.id}
                              className="ar-ham-club-card"
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
                    <div className="ar-ham-empty">Select a category</div>
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
  if (viewReport) {
    const ext          = getFileExt(viewReport.file_name);
    const hasCommented = !!viewReport.has_commented;

    return (
      <div className="ar-page">
        <TopBar currentView="detail" />
        <div className="ar-body">
          <button className="ar-back-btn" onClick={backToList}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Reports
          </button>

          <div className="ar-detail-layout">

            {/* LEFT — file card */}
            <div className="ar-detail-left">
              <div className="ar-file-card">
                <div className="ar-file-card-menu-wrap">
                  <button className="ar-file-card-menu-btn"
                    onClick={() => setOpenMenuId(openMenuId === viewReport.id ? null : viewReport.id)}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                  {openMenuId === viewReport.id && (
                    <div className="ar-file-card-dropdown" ref={menuRef}>
                      <a href={viewReport.file_url} target="_blank" rel="noreferrer"
                        className="ar-file-card-dd-item" onClick={() => setOpenMenuId(null)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        View in Browser
                      </a>
                      <a href={viewReport.file_url} download={viewReport.file_name}
                        className="ar-file-card-dd-item" onClick={() => setOpenMenuId(null)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download
                      </a>
                    </div>
                  )}
                </div>

                <div
                  className={`ar-file-card-thumb ${ext.cls}`}
                  onClick={() => setPdfOpen(true)}
                  title="Click to preview"
                >
                  <FileIcon size={34} />
                  <span className="ar-file-card-ext">{ext.label}</span>
                </div>

                <div className="ar-file-card-info">
                  <div className="ar-file-card-title">{viewReport.title}</div>
                  <span className="ar-file-card-club">{viewReport.club_name}</span>
                  {(viewReport.file_name || viewReport.file_size) && (
                    <div className="ar-file-card-filename-row">
                      {viewReport.file_name && (
                        <span className="ar-file-card-filename">{viewReport.file_name}</span>
                      )}
                      {viewReport.file_name && viewReport.file_size && (
                        <span className="ar-file-card-size-sep">·</span>
                      )}
                      {viewReport.file_size && (
                        <span className="ar-file-card-size">{viewReport.file_size}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="ar-file-card-footer">
                  <div className="ar-file-card-date">{viewReport.created_at}</div>
                  <div className="ar-file-card-postedby">Posted by: {viewReport.uploaded_by}</div>
                </div>
              </div>
            </div>

            {/* RIGHT — comment card */}
            <div className="ar-detail-right">
              <div className="ar-feedback-card">
                <div className="ar-fb-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Leave a Comment</span>
                </div>
                <div className="ar-fb-sub">Share your thoughts about this audit report</div>

                {/* Always show the textarea — just disable the button after submit */}
                <textarea
                  className="ar-fb-textarea"
                  placeholder="Write your comment here... What did you find useful? Any suggestions for improvement?"
                  value={comment}
                  onChange={e => {
                    if (!hasCommented) {
                      setComment(e.target.value);
                      setCommentError('');
                    }
                  }}
                  disabled={hasCommented}
                  style={hasCommented ? { opacity: 0.5, cursor: 'not-allowed', resize: 'none' } : {}}
                />

                {/* Red error — shows on second attempt */}
                {commentError && (
                  <div className="ar-fb-error" style={{ marginTop: 10 }}>
                    ❌ {commentError}
                  </div>
                )}

                <div className="ar-fb-footer">
                  <span className="ar-fb-count">{comment.length} characters</span>
                  {/* Button is visually disabled after first submit */}
                  <button
                    className="ar-fb-submit"
                    onClick={submitComment}
                    disabled={submitting || hasCommented}
                    style={hasCommented ? {
                      opacity: 0.45,
                      cursor: 'not-allowed',
                      transform: 'none',
                    } : {}}
                    title={hasCommented ? 'You have already submitted a comment on this report.' : ''}
                  >
                    {submitting ? 'Submitting...' : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        {hasCommented ? 'Comment Submitted' : 'Post Comment'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PDF Preview Modal */}
          {pdfOpen && (
            <div className="ar-pdf-overlay" onClick={() => setPdfOpen(false)}>
              <div className="ar-pdf-modal" onClick={e => e.stopPropagation()}>
                <div className="ar-pdf-modal-header">
                  <span className="ar-pdf-modal-title">
                    {viewReport.file_name || viewReport.title}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a
                      href={viewReport.file_url}
                      download={viewReport.file_name}
                      className="ar-pdf-modal-dl"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download
                    </a>
                    <button className="ar-pdf-modal-close" onClick={() => setPdfOpen(false)}>✕</button>
                  </div>
                </div>
                <iframe
                  src={viewReport.file_url}
                  title={viewReport.title}
                  className="ar-pdf-iframe"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══ LIST VIEW ══ */
  return (
    <div className="ar-page">
      <TopBar currentView="list" />
      <div className="ar-body">
        <div className="ar-list-header">
          <div className="ar-list-title">Audit Reports</div>
          <div className="ar-list-sub">
            Published by club advisors and secretaries · Click a report to read and leave a comment
          </div>
        </div>

        {loading ? (
          <div className="ar-list-container">
            {[0,1,2,3].map(i => (
              <div key={i} className="ar-report-row ar-skel-row">
                <div className="ar-skel-thumb"/>
                <div className="ar-skel-info">
                  <div className="ar-skel-line w70"/>
                  <div className="ar-skel-line w40"/>
                </div>
                <div className="ar-skel-badge"/>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="ar-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            No audit reports available yet.
          </div>
        ) : (
          <div className="ar-list-container">
            {reports.map(report => {
              const ext = getFileExt(report.file_name);
              return (
                <div key={report.id} className="ar-report-row" onClick={() => openReport(report)}>
                  <div className={`ar-file-thumb ${ext.cls}`}>
                    <FileIcon size={20} />
                  </div>
                  <div className="ar-row-info">
                    <div className="ar-row-title">{report.title}</div>
                    <div className="ar-row-meta">
                      <span>{report.club_name}</span>
                      <span className="ar-meta-dot"/>
                      <span>{report.created_at}</span>
                      {report.file_size && (<><span className="ar-meta-dot"/><span>{report.file_size}</span></>)}
                    </div>
                  </div>
                  <div className={`ar-ext-badge ${ext.cls}`}>{ext.label}</div>
                  <div className="ar-menu-wrap"
                    ref={openMenuId === report.id ? menuRef : null}
                    onClick={e => e.stopPropagation()}
                  >
                    <button className="ar-menu-btn"
                      onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                        <circle cx="12" cy="5" r="1.5"/>
                        <circle cx="12" cy="12" r="1.5"/>
                        <circle cx="12" cy="19" r="1.5"/>
                      </svg>
                    </button>
                    {openMenuId === report.id && (
                      <div className="ar-dropdown">
                        <a href={report.file_url} target="_blank" rel="noreferrer"
                          className="ar-dd-item" onClick={() => setOpenMenuId(null)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          View
                        </a>
                        <a href={report.file_url} download={report.file_name}
                          className="ar-dd-item" onClick={() => setOpenMenuId(null)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Download
                        </a>
                        <button className="ar-dd-item" onClick={() => openReport(report)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          Leave a Comment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}