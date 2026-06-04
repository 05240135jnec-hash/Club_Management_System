import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AdvisorLayout from './components/AdvisorLayout';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../styles/advisor/assignsecretary.css';

const API_URL = '/api';
const getToken = () => sessionStorage.getItem('token');

const AVATAR_COLORS = [
  '#4f46e5','#0891b2','#7c3aed','#059669',
  '#dc2626','#d97706','#be185d','#1d4ed8',
];

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdvisorInviteCoadvisor() {
  const [coAdvisors, setCoAdvisors]       = useState([]);
  const [modalOpen, setModalOpen]         = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allAvailable, setAllAvailable]   = useState([]);
  const [searching, setSearching]         = useState(false);
  const [selectedCA, setSelectedCA]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [toast, setToast]                 = useState(null);
  const [openMenuId, setOpenMenuId]       = useState(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  useEffect(() => {
    loadCoAdvisors();
    const handler = e => {
      if (!e.target.closest('.as-dot-wrap')) setOpenMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Filter search results as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allAvailable);
    } else {
      const q = searchQuery.toLowerCase();
      setSearchResults(allAvailable.filter(ca =>
        ca.name.toLowerCase().includes(q) ||
        ca.email.toLowerCase().includes(q) ||
        (ca.department || '').toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, allAvailable]);

  async function loadCoAdvisors() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/invitations`, { headers });
      setCoAdvisors(res.data.co_advisors || []);
    } catch {
      showToast('Failed to load co-advisors.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function openModal() {
    setSearchQuery('');
    setSelectedCA(null);
    setAllAvailable([]);
    setSearchResults([]);
    setModalOpen(true);
    setSearching(true);
    try {
      const res = await axios.get(`${API_URL}/invitations/available`, { headers });
      const list = res.data.co_advisors || [];
      setAllAvailable(list);
      setSearchResults(list);
    } catch {
      showToast('Failed to load available co-advisors.', 'error');
    } finally {
      setSearching(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setAllAvailable([]);
    setSelectedCA(null);
  }

  async function confirmAdd() {
    if (!selectedCA) return;
    try {
      await axios.post(`${API_URL}/invitations/add`, { user_id: selectedCA.id }, { headers });
      closeModal();
      showToast(`${selectedCA.name} added as Co-Advisor!`, 'success');
      loadCoAdvisors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add co-advisor.', 'error');
    }
  }

  async function removeCoAdvisor(adv) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: 'Remove Co-Advisor?',
      html: `Are you sure you want to remove <strong>${adv.name}</strong> as co-advisor? They will lose access to this club.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/co-advisors/${adv.user_id}/revoke`, { headers });
      setCoAdvisors(prev => prev.filter(c => c.user_id !== adv.user_id));
      showToast(`${adv.name} removed as co-advisor.`, 'error');
    } catch {
      showToast('Failed to remove co-advisor.', 'error');
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  return (
    <AdvisorLayout title="Add Co-Advisor" subtitle="Manage co-advisor for your club">

      {/* TOAST */}
      {toast && createPortal(
        <div className={`as-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          {toast.message}
        </div>, document.body
      )}

      <div className="as-page">

        {/* ══ CO-ADVISOR CARD ══ */}
        <div className="as-card">

          {/* Header */}
          <div className="as-card-header">
            <div>
              <h2 className="as-card-title">Co-Advisors</h2>
              <p className="as-card-subtitle">
                {coAdvisors.length === 0
                  ? 'No co-advisor assigned yet'
                  : `${coAdvisors.length} co-advisor${coAdvisors.length > 1 ? 's' : ''} assigned`}
              </p>
            </div>
          </div>

          {/* List Area */}
          <div className="as-slots-area">
            {loading ? (
              <p className="as-loading">Loading co-advisors...</p>
            ) : coAdvisors.length === 0 ? (
              <div className="as-empty">
                <div className="as-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <p className="as-empty-title">No co-advisor assigned</p>
                <p className="as-empty-desc">Search and add a registered co-advisor to assist with managing your club.</p>
              </div>
            ) : (
              <div className="as-assigned-list">
                {coAdvisors.map((adv, i) => (
                  <div key={adv.user_id} className="as-assigned-card">
                    <div className="as-assigned-avatar"
                      style={{ background: `linear-gradient(135deg, ${AVATAR_COLORS[i % AVATAR_COLORS.length]}, #4f7af8)` }}>
                      {getInitials(adv.name)}
                    </div>
                    <div className="as-assigned-info">
                      <div className="as-assigned-name">{adv.name}</div>
                      <div className="as-assigned-id">{adv.email} · Joined {adv.created_at}</div>
                    </div>
                    <div className="as-assigned-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Co-Advisor
                    </div>
                    <div className="as-dot-wrap">
                      <button className="as-dot-btn"
                        onClick={() => setOpenMenuId(openMenuId === adv.user_id ? null : adv.user_id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <circle cx="12" cy="5" r="1.5"/>
                          <circle cx="12" cy="12" r="1.5"/>
                          <circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>
                      {openMenuId === adv.user_id && (
                        <div className="as-dot-dropdown">
                          <button className="as-dot-item as-dot-item--danger" onClick={() => removeCoAdvisor(adv)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="as-action-row">
            {/* <div className="as-max-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div> */}
            <button className="as-assign-btn" onClick={openModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Add Co-Advisor
            </button>
          </div>
        </div>

        {/* ══ INFO CARD ══ */}
        <div className="as-card as-cap-card">
          <div className="as-cap-header">
            <div className="as-cap-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h2 className="as-cap-header-title">What co-advisors can do</h2>
              <p className="as-cap-header-sub">Co-advisors have the same privileges as the main advisor</p>
            </div>
          </div>
          <div className="as-cap-grid">
            {[
              { cls: 'as-cap-blue',   title: 'Manage members',     desc: 'View and remove members',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { cls: 'as-cap-purple', title: 'Assign Secretary',   desc: 'Assign members as secretary',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              { cls: 'as-cap-green',  title: 'Record attendance',  desc: 'Mark and download records',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
              { cls: 'as-cap-orange', title: 'Post announcements', desc: 'Send notices to members',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
              { cls: 'as-cap-red',    title: 'Upload reports',     desc: 'Submit audit and activity files', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
              { cls: 'as-cap-blue',   title: 'Manage enrollment',  desc: 'Set and manage enrollment keys',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> },
            ].map((cap, i) => (
              <div key={i} className="as-cap-item">
                <div className={`as-cap-icon ${cap.cls}`}>{cap.icon}</div>
                <div>
                  <div className="as-cap-title">{cap.title}</div>
                  <div className="as-cap-desc">{cap.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══ ADD CO-ADVISOR MODAL ══ */}
      {modalOpen && createPortal(
        <div className="as-modal-backdrop" onClick={closeModal}>
          <div className="as-modal" onClick={e => e.stopPropagation()}>
            <div className="as-modal-header">
              <div>
                <h3 className="as-modal-title">Add Co-Advisor</h3>
                <p className="as-modal-sub">Search by name or email only unassigned co-advisors appear</p>
              </div>
              <button className="as-modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="as-search-wrap">
              <svg className="as-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus
                type="text"
                className="as-search-input"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedCA(null); }}
              />
            </div>

            {/* Results */}
            <div className="as-member-list">
              {searching ? (
                <div className="as-no-results">Loading co-advisors...</div>
              ) : searchResults.length === 0 ? (
                <div className="as-no-results">
                  {searchQuery ? `No co-advisors found for "${searchQuery}"` : 'No available co-advisors found'}
                </div>
              ) : searchResults.map(ca => {
                const isSelected = selectedCA?.id === ca.id;
                return (
                  <div key={ca.id}
                    className={`as-member-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCA(ca)}>
                    <div className="as-member-avatar" style={{ background: AVATAR_COLORS[ca.id % AVATAR_COLORS.length] }}>
                      {getInitials(ca.name)}
                    </div>
                    <div className="as-member-details">
                      <div className="as-member-name">{ca.name}</div>
                      <div className="as-member-sid">{ca.email} · {ca.department || '—'}</div>
                    </div>
                    <div className="as-member-check">
                      {isSelected && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="11" height="11">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="as-modal-footer">
              <button className="as-btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="as-btn-confirm" disabled={!selectedCA} onClick={confirmAdd}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Confirm Add
              </button>
            </div>
          </div>
        </div>, document.body
      )}

    </AdvisorLayout>
  );
}