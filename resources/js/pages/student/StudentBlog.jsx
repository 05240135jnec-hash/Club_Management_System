import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './components/StudentLayout';
import '../../styles/student/studentblog.css';

const getToken = () => sessionStorage.getItem('token');

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
}

export default function StudentBlog() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const [myClubs, setMyClubs] = useState([]);
  const [currentClubIdx, setCurrentClubIdx] = useState(0);
  const [blogs, setBlogs] = useState([]);
  const [blogEnabled, setBlogEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    fetchClubs(token);
  }, []);

  useEffect(() => {
    if (myClubs.length === 0) return;
    fetchBlogs(myClubs[currentClubIdx]?.id);
  }, [currentClubIdx, myClubs]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
        fetchBlogs(clubs[startIdx].id);
      } else {
        setLoading(false);
      }
    } catch { setLoading(false); }
  };

  const fetchBlogs = async (clubId) => {
    if (!clubId) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`/api/student/clubs/${clubId}/blogs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlogs(res.data.blogs || []);
      setBlogEnabled(res.data.blog_enabled !== false);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (blog) => {
    setModal(blog);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModal(null);
    document.body.style.overflow = '';
  };

  const filtered = blogs
    .filter(b =>
      (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.content || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const da = new Date(a.created_at), db = new Date(b.created_at);
      return sortOrder === 'newest' ? db - da : da - db;
    });

  return (
    <StudentLayout pageTitle="Club Blog" pageSubtitle="Articles and stories from your club">


      {/* Blog disabled */}
      {!loading && !blogEnabled && (
        <div className="sbl-disabled-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <strong>Blog not available</strong>
          <p>The blog feature has not been enabled for this club yet.</p>
        </div>
      )}

      {/* Filter Bar */}
      {blogEnabled && (
        <div className="sbl-filter-bar">
          <div className="sbl-search-wrap">
            <svg className="sbl-search-icon" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="sbl-search-input"
              type="text"
              placeholder="Search blogs by title, author…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="sbl-sort-wrap">
            <label className="sbl-sort-label">Sort by:</label>
            <div className="sbl-sort-select-wrap">
              <select
                className="sbl-sort-select"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
              >
                <option value="newest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <svg className="sbl-sort-chevron" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Blog Grid */}
      {blogEnabled && (
        loading ? (
          <div className="sbl-grid">
            {[1,2,3,4].map(i => (
              <div className="sbl-skeleton-card" key={i}>
                <div className="sbl-skeleton-cover" />
                <div className="sbl-skeleton-body">
                  <div className="sbl-skeleton-line short" />
                  <div className="sbl-skeleton-line wide" />
                  <div className="sbl-skeleton-line" />
                  <div className="sbl-skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : myClubs.length === 0 ? (
          <div className="sbl-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <p>No club joined yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sbl-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <p>{search ? 'No blog posts match your search.' : 'No blog posts yet.'}</p>
          </div>
        ) : (
          <div className="sbl-grid">
            {filtered.map((blog, i) => (
              <div
                className="sbl-blog-card"
                key={blog.id || i}
                onClick={() => openModal(blog)}
              >
                {/* Cover */}
                <div className="sbl-card-cover">
                  {blog.cover_image ? (
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      onError={e => e.target.parentElement.classList.add('no-img')}
                    />
                  ) : (
                    <div className="sbl-cover-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                           strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="sbl-card-body">
                  <div className="sbl-card-author-row">
                    <div className="sbl-author-avatar">{getInitials(blog.author)}</div>
                    <span className="sbl-author-name">{blog.author}</span>
                  </div>
                  <div className="sbl-card-title">{blog.title}</div>
                  <div className="sbl-card-excerpt">{blog.content}</div>
                  <div className="sbl-card-footer">
                    <span className="sbl-card-date">{blog.created_at}</span>
                    <span className="sbl-card-read-more">
                      Read more
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                           strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal */}
      {modal && (
        <div className="sbl-modal-overlay" onClick={closeModal}>
          <div className="sbl-modal" onClick={e => e.stopPropagation()}>

            {/* Top bar */}
            <div className="sbl-modal-topbar">
              <span className="sbl-modal-label">Blog Post</span>
              <button className="sbl-modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Cover */}
            <div className="sbl-modal-cover">
              {modal.cover_image ? (
                <img
                  src={modal.cover_image}
                  alt={modal.title}
                  onError={e => e.target.parentElement.classList.add('no-img')}
                />
              ) : (
                <div className="sbl-modal-cover-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                       strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="sbl-modal-body">
              <h2 className="sbl-modal-title">{modal.title}</h2>
              <div className="sbl-modal-author-row">
                <div className="sbl-modal-author-avatar">{getInitials(modal.author)}</div>
                <span className="sbl-modal-author-name">{modal.author}</span>
                <span className="sbl-modal-author-sep">·</span>
                <span className="sbl-modal-author-date">{modal.created_at}</span>
              </div>
              <div className="sbl-modal-content">
                {(modal.content || '').split('\n').map((para, i) =>
                  para.trim() ? <p key={i}>{para}</p> : null
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </StudentLayout>
  );
}
