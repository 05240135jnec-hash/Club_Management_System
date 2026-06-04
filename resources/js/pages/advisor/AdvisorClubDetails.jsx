import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AdvisorLayout from './components/AdvisorLayout';
import '../../styles/advisor/advisorclubdetail.css';

const TEXT = { color: '#1a1a2e' };

export default function AdvisorClubDetails() {
  const [club, setClub]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editMode, setEditMode]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(false);
  const [categories, setCategories] = useState([]);
  const [coverFile,  setCoverFile]  = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const coverRef = useRef(null);
  const [form, setForm]             = useState({
    name: '', category: '', aim: '', description: '', objectives: '',
  });

  useEffect(() => {
    fetchMyClub();
    fetchCategories();
  }, []);

  const fetchMyClub = async () => {
    try {
      const token = sessionStorage.getItem('token');
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
      setCategories(res.data.data || res.data || []);
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
      objectives:  objectives.join('\n'),
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      const objectives = form.objectives
        .split('\n')
        .map(o => o.trim())
        .filter(o => o.length > 0);

      const fd = new FormData();
      fd.append('name',        form.name);
      fd.append('category',    form.category);
      fd.append('aim',         form.aim);
      fd.append('description', form.description);
      objectives.forEach((o, i) => fd.append(`objectives[${i}]`, o));
      if (coverFile) fd.append('cover_photo', coverFile);

      const res = await axios.post(`/api/clubs/${club.id}?_method=PUT`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      setClub(res.data.club || res.data);
      setEditMode(false);
      setCoverFile(null);
      setCoverPreview(null);
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

  const objectives  = parseObjectives(club.objectives);
  const secretaries = club.secretaries || [];
  const coAdvisors  = club.co_advisors || [];

  return (
    <AdvisorLayout title="Club Details" subtitle="Manage your club information">

      {!editMode ? (
        /* ── VIEW MODE ── */
        <div className="acd-card">
          {/* COVER PHOTO BANNER with Edit button */}
          <div className="acd-cover-banner" style={club.cover_photo ? {backgroundImage:`url('/storage/${club.cover_photo}')`} : {}}>
            <div className="acd-cover-overlay" />
            {/* Edit button top right */}
            <button className="acd-btn-edit-overlay" onClick={openEdit}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Club
            </button>
            <div className="acd-cover-content">
              <div className="acd-cover-avatar">{club.name?.charAt(0).toUpperCase()}</div>
              <div>
                <div className="acd-cover-name">{club.name}</div>
                <div className="acd-cover-cat">{club.category}</div>
              </div>
            </div>
          </div>

          <div className="acd-body">

            {/* AIM */}
            <div className="acd-section">
              <div className="acd-section-label">Aim</div>
              <div className="acd-section-val" style={TEXT}>{club.aim || '—'}</div>
            </div>

            <div className="acd-divider" />

            {/* DESCRIPTION */}
            <div className="acd-section">
              <div className="acd-section-label">Description</div>
              <div className="acd-section-val" style={TEXT}>{club.description || '—'}</div>
            </div>

            <div className="acd-divider" />

            {/* OBJECTIVES */}
            <div className="acd-section">
              <div className="acd-section-label">
                Objectives of <strong style={TEXT}>{club.name}</strong>
              </div>
              {objectives.length > 0 ? (
                <ul className="acd-objectives">
                  {objectives.map((obj, i) => (
                    <li key={i} style={TEXT}>{obj}</li>
                  ))}
                </ul>
              ) : (
                <div className="acd-section-val" style={TEXT}>—</div>
              )}
            </div>

          </div>

          {/* STATS FOOTER */}
          <div className="acd-stats">

            <div className="acd-stat">
              <span className="acd-stat-label">Members</span>
              <span className="acd-stat-val" style={TEXT}>{club.members_count || 0}</span>
            </div>

            <div className="acd-stat-divider" />

            <div className="acd-stat">
              <span className="acd-stat-label">Club Advisor</span>
              <span className="acd-stat-val" style={TEXT}>{club.advisor?.name || '—'}</span>
            </div>

            <div className="acd-stat-divider" />

            {/* Co-Advisors */}
            <div className="acd-stat">
              <span className="acd-stat-label">Co-Advisor{coAdvisors.length !== 1 ? 's' : ''}</span>
              {coAdvisors.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {coAdvisors.map(ca => (
                    <span key={ca.id} className="acd-stat-val" style={TEXT}>{ca.name}</span>
                  ))}
                </div>
              ) : (
                <span className="acd-stat-val" style={TEXT}>Not assigned yet</span>
              )}
            </div>

            <div className="acd-stat-divider" />

            {/* Secretaries */}
            <div className="acd-stat">
              <span className="acd-stat-label">Club Secretary{secretaries.length !== 1 ? 's' : ''}</span>
              {secretaries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {secretaries.map(s => (
                    <span key={s.id} className="acd-stat-val" style={TEXT}>{s.name}</span>
                  ))}
                </div>
              ) : (
                <span className="acd-stat-val" style={TEXT}>Not assigned yet</span>
              )}
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

            {/* COVER PHOTO */}
            <div className="acd-form-group acd-form-full">
              <label className="acd-form-label">Cover Photo</label>
              <div className="cover-upload-zone" onClick={() => coverRef.current?.click()} style={{minHeight:140}}>
                {coverPreview || club.cover_photo ? (
                  <img src={coverPreview || `/storage/${club.cover_photo}`} alt="cover" className="cover-preview-img" />
                ) : (
                  <div className="cover-upload-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>Click to upload cover photo</span>
                  </div>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e => { const f=e.target.files[0]; if(f){setCoverFile(f);setCoverPreview(URL.createObjectURL(f));} }} />
            </div>

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