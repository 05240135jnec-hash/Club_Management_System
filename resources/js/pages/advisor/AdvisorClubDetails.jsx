import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdvisorLayout from './components/AdvisorLayout';
import '../../styles/advisor/advisorclubdetail.css';

export default function AdvisorClubDetails() {
  const [club, setClub]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editMode, setEditMode]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm]             = useState({
    name: '', category: '', aim: '', description: '',
    secretary: '', objectives: '',
  });

  useEffect(() => {
    fetchMyClub();
    fetchCategories();
  }, []);

  const fetchMyClub = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/clubs/my-club', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClub(res.data);
    } catch (err) {
      console.error('Failed to fetch club:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const parseObjectives = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(o => typeof o === 'string' ? o : o.objective || o);
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(o => typeof o === 'string' ? o : o.objective || o) : [];
    } catch {
      return [];
    }
  };

  const openEdit = () => {
    const objectives = parseObjectives(club.objectives);
    setForm({
      name:        club.name || '',
      category:    club.category || '',
      aim:         club.aim || '',
      description: club.description || '',
      secretary:   club.secretary || '',
      objectives:  objectives.join('\n'),
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const objectives = form.objectives
        .split('\n')
        .map(o => o.trim())
        .filter(o => o.length > 0);

      const res = await axios.put(`/api/clubs/${club.id}`, {
        name:        form.name,
        category:    form.category,
        aim:         form.aim,
        description: form.description,
        secretary:   form.secretary,
        objectives:  objectives,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setClub(res.data.club || res.data);
      setEditMode(false);
      showToast();
    } catch (err) {
      console.error('Save failed:', err);
      alert(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  if (loading) {
    return (
      <AdvisorLayout title="Club Details" subtitle="Manage your club information">
        <div className="acd-loading">Loading club details...</div>
      </AdvisorLayout>
    );
  }

  if (!club) {
    return (
      <AdvisorLayout title="Club Details" subtitle="Manage your club information">
        <div className="acd-empty">No club found. Please create a club first.</div>
      </AdvisorLayout>
    );
  }

  const objectives = parseObjectives(club.objectives);

  return (
    <AdvisorLayout title="Club Details" subtitle="Manage your club information">

      {!editMode ? (
        /* ── VIEW MODE ── */
        <div className="acd-card">
          <div className="acd-card-header">
            <div>
              <h1 className="acd-club-name">{club.name}</h1>
              <p className="acd-club-category">Category: {club.category || '—'}</p>
            </div>
            <button className="acd-btn-edit" onClick={openEdit}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Club
            </button>
          </div>

          <div className="acd-body">

            <div className="acd-section">
              <div className="acd-section-label">Aim</div>
              <div className="acd-section-val">{club.aim || '—'}</div>
            </div>

            <div className="acd-divider" />

            <div className="acd-section">
              <div className="acd-section-label">Description</div>
              <div className="acd-section-val">{club.description || '—'}</div>
            </div>

            <div className="acd-divider" />

            <div className="acd-section">
              <div className="acd-section-label">
                Objectives of <strong>{club.name}</strong>
              </div>
              {objectives.length > 0 ? (
                <ul className="acd-objectives">
                  {objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
              ) : (
                <div className="acd-section-val">—</div>
              )}
            </div>

          </div>

          {/* STATS FOOTER */}
          <div className="acd-stats">
            <div className="acd-stat">
              <span className="acd-stat-label">Members</span>
              <span className="acd-stat-val">{club.members_count || 0}</span>
            </div>
            <div className="acd-stat-divider" />
            <div className="acd-stat">
              <span className="acd-stat-label">Club Advisor</span>
              <span className="acd-stat-val">{club.advisor?.name || '—'}</span>
            </div>
            <div className="acd-stat-divider" />
            <div className="acd-stat">
              <span className="acd-stat-label">Club Secretary</span>
              <span className="acd-stat-val">{club.secretary || '—'}</span>
            </div>
          </div>
        </div>

      ) : (
        /* ── EDIT MODE ── */
        <div className="acd-card">
          <div className="acd-edit-header">
            <h2 className="acd-edit-title">Edit Club Details</h2>
            <p className="acd-edit-subtitle">Update your club information below</p>
          </div>

          <div className="acd-form-grid">

            <div className="acd-form-group">
              <label className="acd-form-label">Club Name</label>
              <input
                className="acd-form-input"
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Enter club name"
              />
            </div>

            {/* ✅ Category is now a DROPDOWN from /api/categories */}
            <div className="acd-form-group">
              <label className="acd-form-label">Category</label>
              <select
                className="acd-form-input acd-form-select"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="acd-form-group acd-form-full">
              <label className="acd-form-label">Aim</label>
              <input
                className="acd-form-input"
                type="text"
                value={form.aim}
                onChange={e => setForm(p => ({ ...p, aim: e.target.value }))}
                placeholder="Enter club aim"
              />
            </div>

            <div className="acd-form-group acd-form-full">
              <label className="acd-form-label">Description</label>
              <textarea
                className="acd-form-input acd-form-textarea"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe your club..."
                rows={4}
              />
            </div>

            <div className="acd-form-group acd-form-full">
              <label className="acd-form-label">
                Objectives <span className="acd-label-hint">(one per line)</span>
              </label>
              <textarea
                className="acd-form-input acd-form-textarea"
                value={form.objectives}
                onChange={e => setForm(p => ({ ...p, objectives: e.target.value }))}
                placeholder="Enter each objective on a new line..."
                rows={5}
              />
            </div>

            <div className="acd-form-group">
              <label className="acd-form-label">Club Secretary</label>
              <input
                className="acd-form-input"
                type="text"
                value={form.secretary}
                onChange={e => setForm(p => ({ ...p, secretary: e.target.value }))}
                placeholder="Secretary name"
              />
            </div>

          </div>

          <div className="acd-form-actions">
            <button className="acd-btn-cancel" onClick={() => setEditMode(false)}>Cancel</button>
            <button className="acd-btn-save" onClick={handleSave} disabled={saving}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="acd-toast">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Club details saved successfully!
        </div>
      )}

    </AdvisorLayout>
  );
}