import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from './components/SuperAdminLayout';
import '../../styles/advisor-requests.css';

const AVATAR_COLORS = ['#2d5be3','#6b46c1','#d69e2e','#276749','#c53030','#2b6cb0'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function AdvisorRequests() {
  const [advisors, setAdvisors]       = useState([]);
  const [activeTab, setActiveTab]     = useState('pending');
  const [showModal, setShowModal]     = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [toast, setToast]             = useState('');

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const fetchAdvisors = async () => {
    try {
      const res = await axios.get('/api/advisors');
      setAdvisors(res.data);
    } catch (err) {
      console.error('Failed to fetch advisors');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleApproveClick = (advisor) => {
    setSelectedAdvisor(advisor);
    setShowModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedAdvisor) return;
    setLoading(true);
    try {
      await axios.put(`/api/advisors/${selectedAdvisor.id}/approve`);
      setAdvisors(advisors.map(a =>
        a.id === selectedAdvisor.id ? { ...a, status: 'active' } : a
      ));
      showToast(`${selectedAdvisor.name} approved as Club Advisor!`);
      setShowModal(false);
      setSelectedAdvisor(null);
    } catch (err) {
      showToast('Failed to approve advisor.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (advisor) => {
    if (!window.confirm(`Are you sure you want to reject ${advisor.name}?`)) return;
    try {
      await axios.put(`/api/advisors/${advisor.id}/reject`);
      setAdvisors(advisors.map(a =>
        a.id === advisor.id ? { ...a, status: 'rejected' } : a
      ));
      showToast('Advisor request rejected.');
    } catch (err) {
      showToast('Failed to reject advisor.');
    }
  };

  const filtered = advisors.filter(a => {
    if (activeTab === 'pending')  return a.status === 'pending';
    if (activeTab === 'approved') return a.status === 'active';
    return true;
  });

  const pendingCount  = advisors.filter(a => a.status === 'pending').length;
  const approvedCount = advisors.filter(a => a.status === 'active').length;

  return (
    <SuperAdminLayout title="Advisor Requests" subtitle="Manage club advisor approvals">

      {/* TABS */}
      <div className="lr-tabs">
        <button
          className={`lr-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <b>Pending</b>
          {pendingCount > 0 && <span className="lr-tab-badge">{pendingCount}</span>}
        </button>
        <button
          className={`lr-tab ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <b>Approved</b>
          {approvedCount > 0 && <span className="lr-tab-badge approved">{approvedCount}</span>}
        </button>
        <button
          className={`lr-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <b>All</b>
        </button>
      </div>

      {/* GRID */}
      <div className="lr-grid">
        {filtered.length === 0 ? (
          <div className="lr-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <div>No {activeTab} requests</div>
          </div>
        ) : (
          filtered.map(advisor => (
            <div className="advisor-card" key={advisor.id}>
              {/* TOP */}
              <div className="advisor-card-top">
                <div className="advisor-avatar" style={{ background: getColor(advisor.id) }}>
                  {getInitials(advisor.name)}
                </div>
                <div className="advisor-info">
                  <div className="advisor-name">{advisor.name}</div>
                  <div className="advisor-email">{advisor.email}</div>
                </div>
              </div>

              {/* STATUS */}
              <span className={`status-badge ${advisor.status === 'active' ? 'approved' : advisor.status}`}>
                <span className="status-dot"></span>
                {advisor.status === 'active' ? 'Active' : advisor.status === 'pending' ? 'Pending' : 'Rejected'}
              </span>

              {/* META */}
              <div className="advisor-meta">
                <div className="advisor-meta-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                  <span className="advisor-meta-label">Staff ID</span>
                  <span>{advisor.staff_id || 'N/A'}</span>
                </div>
                <div className="advisor-meta-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
                  </svg>
                  <span className="advisor-meta-label">Dept</span>
                  <span>{advisor.department || 'N/A'}</span>
                </div>
                <div className="advisor-meta-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span className="advisor-meta-label">Registered</span>
                  <span>{advisor.registered}</span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="advisor-actions">
                {advisor.status === 'pending' ? (
                  <>
                    <button className="btn-approve" onClick={() => handleApproveClick(advisor)}>
                      Approve
                    </button>
                    <button className="btn-reject" onClick={() => handleReject(advisor)}>
                      Reject
                    </button>
                  </>
                ) : advisor.status === 'active' ? (
                  <button className="btn-approved-tag" disabled>Approved</button>
                ) : (
                  <button className="btn-rejected-tag" disabled>Rejected</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* APPROVE MODAL */}
      {showModal && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Approve Advisor</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: '#4a5568', lineHeight: 1.6 }}>
                Are you sure you want to approve <strong>{selectedAdvisor?.name}</strong> as a Club Advisor?
                They will gain access to their club dashboard.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-btn-add" onClick={handleApproveConfirm} disabled={loading}>
                {loading ? 'Approving...' : 'Yes, Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="app-toast">{toast}</div>
      )}

    </SuperAdminLayout>
  );
}

export default AdvisorRequests;