import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import StudentLayout from './components/StudentLayout';
import '../../styles/student/studentgallery.css';

const getToken = () => sessionStorage.getItem('token');

export default function StudentGallery() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const [myClubs, setMyClubs] = useState([]);
  const [currentClubIdx, setCurrentClubIdx] = useState(0);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // { album, index }
  const [sortOrder, setSortOrder] = useState('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    fetchClubs(token);
  }, []);

  useEffect(() => {
    if (myClubs.length === 0) return;
    fetchAlbums(myClubs[currentClubIdx]?.id);
  }, [currentClubIdx, myClubs]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = e => {
      if (!lightbox) return;
      if (e.key === 'ArrowLeft')
        setLightbox(lb => ({ ...lb, index: Math.max(0, lb.index - 1) }));
      if (e.key === 'ArrowRight')
        setLightbox(lb => ({ ...lb, index: Math.min(lb.album.images.length - 1, lb.index + 1) }));
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const fetchClubs = async (token) => {
    try {
      const res = await axios.get('/api/student/my-clubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clubs = res.data.clubs || [];
      setMyClubs(clubs);
      if (clubs.length > 0) {
        const targetIdx = clubId
          ? clubs.findIndex(c => String(c.id) === String(clubId))
          : 0;
        const startIdx = targetIdx >= 0 ? targetIdx : 0;
        setCurrentClubIdx(startIdx);
        fetchAlbums(clubs[startIdx].id);
      } else {
        setLoading(false);
      }
    } catch { setLoading(false); }
  };

  const fetchAlbums = async (cid) => {
    if (!cid) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`/api/student/clubs/${cid}/albums`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlbums(res.data.albums || []);
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedAlbums = [...albums]
    .filter(a =>
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.caption || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      return new Date(a.created_at) - new Date(b.created_at);
    });

  const SORT_LABELS = { newest: 'Newest First', oldest: 'Oldest First' };

  const openLightbox = (album, index = 0) => {
    setLightbox({ album, index });
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightbox(null);
    document.body.style.overflow = '';
  };

  return (
    <StudentLayout pageTitle="Gallery" pageSubtitle="Photos from club activities and events">

      {/* Filter Bar */}
      <div className="sgal-filter-bar">
        <span className="sgal-album-count">
          {loading ? '' : `${sortedAlbums.length} album${sortedAlbums.length !== 1 ? 's' : ''}`}
        </span>
        <div className="sgal-filter-right">
          <div className="sgal-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="sgal-search-input"
              type="text"
              placeholder="Search albums…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="sgal-search-clear" onClick={() => setSearch('')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button
            className="sgal-sort-btn"
            onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="12" x2="14" y2="12"/>
              <line x1="4" y1="18" x2="8" y2="18"/>
            </svg>
            {SORT_LABELS[sortOrder]}
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="sgal-grid">
          {[1,2,3,4,5,6].map(i => (
            <div className="sgal-skeleton-card" key={i}>
              <div className="sgal-skeleton-img" />
              <div className="sgal-skeleton-body">
                <div className="sgal-skeleton-line short" />
                <div className="sgal-skeleton-line wide" />
                <div className="sgal-skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      ) : myClubs.length === 0 ? (
        <div className="sgal-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p>No club joined yet.</p>
        </div>
      ) : sortedAlbums.length === 0 ? (
        <div className="sgal-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p>{search ? 'No albums match your search.' : 'No albums available yet.'}</p>
        </div>
      ) : (
        <div className="sgal-grid">
          {sortedAlbums.map((album, i) => {
            const cover = album.images?.[0]?.url || '';
            const count = album.images?.length || 0;
            return (
              <div
                className="sgal-card"
                key={album.id || i}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => openLightbox(album, 0)}
              >
                <div className="sgal-card-img-wrap">
                  {cover ? (
                    <img
                      src={cover}
                      alt={album.title}
                      className="sgal-card-img"
                      loading="lazy"
                      onError={e => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="sgal-card-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>No image</span>
                    </div>
                  )}
                  <div className="sgal-card-overlay">
                    <div className="sgal-overlay-actions">
                      <button className="sgal-ov-btn" title="View album"
                        onClick={e => { e.stopPropagation(); openLightbox(album, 0); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {count > 0 && (
                    <div className="sgal-photo-count">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      {count}
                    </div>
                  )}
                </div>
                <div className="sgal-card-body">
                  <div className="sgal-card-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {album.created_at}
                  </div>
                  <div className="sgal-card-title">{album.title}</div>
                  {album.caption && (
                    <div className="sgal-card-desc">{album.caption}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ LIGHTBOX PORTAL — matches advisor upload_image style ══ */}
      {lightbox && createPortal(
        <div className="sgal-lightbox-backdrop" onClick={closeLightbox}>
          <div className="sgal-lightbox" onClick={e => e.stopPropagation()}>

            {/* TOP BAR */}
            <div className="sgal-lb-topbar">
              <div className="sgal-lb-topbar-info">
                <div className="sgal-lb-title">{lightbox.album.title}</div>
                <div className="sgal-lb-meta">
                  {lightbox.album.created_at} · {lightbox.album.images?.length || 0} photo{lightbox.album.images?.length !== 1 ? 's' : ''}
                </div>
                {lightbox.album.caption && (
                  <div className="sgal-lb-caption">{lightbox.album.caption}</div>
                )}
              </div>
              <button className="sgal-lb-close-btn" onClick={closeLightbox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Close
              </button>
            </div>

            {/* MAIN IMAGE */}
            <div className="sgal-lb-img-wrap">
              {lightbox.index > 0 && (
                <button
                  className="sgal-lb-arrow left"
                  onClick={() => setLightbox(lb => ({ ...lb, index: lb.index - 1 }))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" width="22" height="22">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
              )}

              <img
                className="sgal-lb-img"
                src={lightbox.album.images?.[lightbox.index]?.url}
                alt=""
              />

              {lightbox.index < lightbox.album.images.length - 1 && (
                <button
                  className="sgal-lb-arrow right"
                  onClick={() => setLightbox(lb => ({ ...lb, index: lb.index + 1 }))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" width="22" height="22">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              )}

              {lightbox.album.images?.length > 1 && (
                <div className="sgal-lb-counter">
                  {lightbox.index + 1} / {lightbox.album.images.length}
                </div>
              )}
            </div>

            {/* THUMBNAIL STRIP */}
            {lightbox.album.images?.length > 1 && (
              <div className="sgal-lb-thumbs">
                {lightbox.album.images.map((img, i) => (
                  <button
                    key={img.id || i}
                    className={`sgal-lb-thumb${i === lightbox.index ? ' active' : ''}`}
                    onClick={() => setLightbox(lb => ({ ...lb, index: i }))}
                  >
                    <img src={img.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>,
        document.body
      )}

    </StudentLayout>
  );
}