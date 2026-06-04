import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SuperAdminLayout from './components/SuperAdminLayout';
import '../../styles/superadmin/dashboard.css';

function Dashboard() {
  const [categories, setCategories]       = useState([]);
  const [clubs, setClubs]                 = useState([]);
  const [stats, setStats]                 = useState({ totalClubs: 0, studentsInClubs: 0 });
  const [search, setSearch]               = useState('');
  const [openCard, setOpenCard]           = useState(null);

  // Add modal
  const [showAddModal, setShowAddModal]   = useState(false);
  const [newCategory, setNewCategory]     = useState('');
  const [addError, setAddError]           = useState('');
  const [addLoading, setAddLoading]       = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory]   = useState(null);
  const [editName, setEditName]           = useState('');
  const [editError, setEditError]         = useState('');
  const [editLoading, setEditLoading]     = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget]   = useState(null); // { id, name }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 3-dot menu
  const [openMenu, setOpenMenu]           = useState(null);
  const menuRef                           = useRef(null);

  // ── FETCH ──────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [catsRes, clubsRes] = await Promise.allSettled([
        axios.get('/api/categories'),
        axios.get('/api/clubs', { headers }),
      ]);

      let catList = [];
      let clubList = [];

      if (catsRes.status === 'fulfilled') {
        catList = catsRes.value.data || [];
        setCategories(catList);
      }
      if (clubsRes.status === 'fulfilled') {
        clubList = clubsRes.value.data.data || clubsRes.value.data || [];
        setClubs(clubList);
      }

      setStats({
        totalClubs: clubList.length,
        studentsInClubs: clubList.reduce((a, c) => a + (parseInt(c.members_count) || 0), 0),
      });
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  // ── CLOSE MENU ON OUTSIDE CLICK ────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── HELPERS ────────────────────────────────────────────
  const getClubsForCategory = (catName) =>
    clubs.filter(c => c.category === catName);

  const filtered = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── ADD CATEGORY ───────────────────────────────────────
  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) { setAddError('Please enter a category name.'); return; }
    const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) { setAddError('This category already exists.'); return; }

    setAddLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post('/api/categories', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(prev => [...prev, res.data.category]);
      setShowAddModal(false);
      setNewCategory('');
      setAddError('');
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add category.');
    } finally {
      setAddLoading(false);
    }
  };

  // ── EDIT CATEGORY ──────────────────────────────────────
  const openEdit = (cat) => {
    setEditCategory(cat);
    setEditName(cat.name);
    setEditError('');
    setShowEditModal(true);
    setOpenMenu(null);
  };

  const handleEditCategory = async () => {
    const name = editName.trim();
    if (!name) { setEditError('Please enter a category name.'); return; }
    if (name === editCategory.name) { setShowEditModal(false); return; }
    const exists = categories.some(
      c => c.name.toLowerCase() === name.toLowerCase() && c.id !== editCategory.id
    );
    if (exists) { setEditError('This category already exists.'); return; }

    setEditLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`/api/categories/${editCategory.id}`, { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAll();
      setShowEditModal(false);
      setEditCategory(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update category.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── DELETE CATEGORY ────────────────────────────────────
  const openDelete = (cat) => {
    setDeleteTarget(cat);
    setOpenMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`/api/categories/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // keep modal open on error — could add error state here if needed
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── RENDER ─────────────────────────────────────────────
  return (
    <SuperAdminLayout title="Dashboard" subtitle="Club overview">

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-value-row">
              <span className="stat-number">{stats.totalClubs}</span>
            </div>
            <div className="stat-label">Total Clubs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-value-row">
              <span className="stat-number">{stats.studentsInClubs}</span>
            </div>
            <div className="stat-label">Number of Students in Clubs</div>
          </div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-title">Categorized club</div>
          <div className="section-desc">Explore specialized student interest groups</div>
        </div>
        <div className="section-header-right">
          <button className="add-category-btn" onClick={() => setShowAddModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Club Category
          </button>
          <input
            type="text"
            className="search-input"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* CATEGORIES GRID */}
      <div className="categories-grid" ref={menuRef}>
        {filtered.length === 0 && (
          <div className="no-categories">No categories found.</div>
        )}
        {filtered.map(cat => {
          const catClubs = getClubsForCategory(cat.name);
          return (
            <div
              key={cat.id}
              className={`category-card ${openCard === cat.id ? 'open' : ''}`}
              onClick={() => setOpenCard(openCard === cat.id ? null : cat.id)}
            >
              <div className="category-info">
                <div className="category-name">{cat.name}</div>
                <div className="category-count">
                  <span className="category-count-badge">
                    {catClubs.length} club{catClubs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* 3-DOT MENU */}
                <div className="dots-menu-wrap">
                  <button
                    className="dots-btn"
                    onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === cat.id ? null : cat.id); }}
                    title="Options"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="19" cy="12" r="2"/>
                    </svg>
                  </button>
                  {openMenu === cat.id && (
                    <div className="dots-dropdown" onClick={e => e.stopPropagation()}>
                      <button className="dots-dd-item" onClick={() => openEdit(cat)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button className="dots-dd-item delete" onClick={() => openDelete(cat)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* CHEVRON */}
                <button className="chevron-btn"
                  onClick={e => { e.stopPropagation(); setOpenCard(openCard === cat.id ? null : cat.id); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>

              {/* DROPDOWN */}
              {openCard === cat.id && (
                <div className="club-dropdown visible" onClick={e => e.stopPropagation()}>
                  <div className="dropdown-header">
                    <span className="dropdown-header-title">{cat.name}</span>
                    <span className="dropdown-header-count">
                      {catClubs.length} club{catClubs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {catClubs.length > 0 ? (
                    <ul className="club-list-dropdown">
                      {catClubs.map((club, i) => (
                        <li key={club.id}>
                          <span className="club-num">{i + 1}</span>
                          <span className="club-nm">{club.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="dropdown-empty">No clubs yet</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ DELETE CONFIRM MODAL ══ */}
      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="delete-modal-box" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <div className="delete-modal-title">Delete Category?</div>
            <div className="delete-modal-desc">
              Are you sure you want to delete{' '}
              <strong>"{deleteTarget.name}"</strong>?{' '}
              This action cannot be undone.
            </div>
            <div className="delete-modal-actions">
              <button
                className="delete-modal-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="delete-modal-confirm"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD CATEGORY MODAL ══ */}
      {showAddModal && (
        <div className="modal-overlay open" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Club Category</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Category Name</label>
              <input
                type="text"
                className={`modal-input ${addError ? 'error' : ''}`}
                placeholder="e.g. Photography"
                maxLength={40}
                value={newCategory}
                onChange={e => { setNewCategory(e.target.value); setAddError(''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') setShowAddModal(false);
                }}
                autoFocus
              />
              {addError && <span className="modal-error">{addError}</span>}
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="modal-btn-add" onClick={handleAddCategory} disabled={addLoading}>
                {addLoading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT CATEGORY MODAL ══ */}
      {showEditModal && (
        <div className="modal-overlay open" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Edit Category</span>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Category Name</label>
              <input
                type="text"
                className={`modal-input ${editError ? 'error' : ''}`}
                maxLength={40}
                value={editName}
                onChange={e => { setEditName(e.target.value); setEditError(''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleEditCategory();
                  if (e.key === 'Escape') setShowEditModal(false);
                }}
                autoFocus
              />
              {editError && <span className="modal-error">{editError}</span>}
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="modal-btn-add" onClick={handleEditCategory} disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </SuperAdminLayout>
  );
}

export default Dashboard;