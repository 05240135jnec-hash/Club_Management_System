import { useState, useEffect, useRef } from 'react';
import SuperAdminLayout from './components/SuperAdminLayout';
import Swal from 'sweetalert2';
import '../../styles/superadmin/featurecontrol.css';

const API = '/api/superadmin';
const getToken = () => sessionStorage.getItem('token');

export default function FeatureControl() {
  const [clubs, setClubs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [savingMap, setSavingMap] = useState({}); // { clubId: true/false }
  const [savedMap, setSavedMap]   = useState({}); // { clubId: true } briefly
  const [search, setSearch]     = useState('');
  const timerRefs = useRef({});

  useEffect(() => { fetchClubs(); }, []);

  async function fetchClubs() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/clubs?status=all`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      setClubs(data.clubs || []);
    } catch {}
    setLoading(false);
  }

  async function handleToggle(clubId, feature, value) {
    // Optimistically update UI
    setClubs(prev => prev.map(c =>
      c.id === clubId ? { ...c, [feature]: value } : c
    ));

    // Show saving indicator for this club
    setSavingMap(prev => ({ ...prev, [clubId]: true }));
    setSavedMap(prev => { const n = { ...prev }; delete n[clubId]; return n; });

    try {
      const club = clubs.find(c => c.id === clubId);
      const updated = { ...club, [feature]: value };

      const res = await fetch(`${API}/clubs/${clubId}/features`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          audit_report_enabled: feature === 'audit_report_enabled' ? value : (club.audit_report_enabled ?? false),
          blog_enabled:         feature === 'blog_enabled'         ? value : (club.blog_enabled ?? false),
        }),
      });

      if (res.ok) {
        setSavingMap(prev => { const n = { ...prev }; delete n[clubId]; return n; });
        setSavedMap(prev => ({ ...prev, [clubId]: true }));

        // Clear the "Saved" checkmark after 2 seconds
        if (timerRefs.current[clubId]) clearTimeout(timerRefs.current[clubId]);
        timerRefs.current[clubId] = setTimeout(() => {
          setSavedMap(prev => { const n = { ...prev }; delete n[clubId]; return n; });
        }, 2000);
      } else {
        throw new Error('Failed');
      }
    } catch {
      // Revert the optimistic update on failure
      setSavingMap(prev => { const n = { ...prev }; delete n[clubId]; return n; });
      setClubs(prev => prev.map(c =>
        c.id === clubId ? { ...c, [feature]: !value } : c
      ));
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not save. Please try again.' });
    }
  }

  const filtered = clubs.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SuperAdminLayout title="Feature Control" subtitle="Manage platform features per club">
      <div className="fc-page">
        <div className="fc-card">

          {/* SEARCH */}
          <div className="fc-search-wrap">
            <div className="fc-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search club name or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="fc-table-wrap">
            <table className="fc-table">
              <thead>
                <tr>
                  <th>Club Name</th>
                  <th className="fc-th-center">
                    <div className="fc-th-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      Audit Report
                    </div>
                  </th>
                  <th className="fc-th-center">
                    <div className="fc-th-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      Blog
                    </div>
                  </th>
                  <th style={{ width: '80px', minWidth: '80px' }}></th>
                  
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="fc-empty">Loading clubs...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="4" className="fc-empty">No clubs found</td></tr>
                ) : filtered.map(club => (
                  <tr key={club.id} className="fc-row">
                    <td>
                      <div className="fc-club-info">
                        <div className="fc-club-avatar">{club.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="fc-club-name">{club.name}</div>
                          <div className="fc-club-cat">{club.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="fc-toggle-cell">
                      <label className="fc-toggle">
                        <input
                          type="checkbox"
                          checked={club.audit_report_enabled ?? false}
                          disabled={savingMap[club.id]}
                          onChange={e => handleToggle(club.id, 'audit_report_enabled', e.target.checked)}
                        />
                        <span className="fc-toggle-track"><span className="fc-toggle-thumb"/></span>
                        <span className="fc-toggle-label">{club.audit_report_enabled ? 'On' : 'Off'}</span>
                      </label>
                    </td>
                    <td className="fc-toggle-cell">
                      <label className="fc-toggle">
                        <input
                          type="checkbox"
                          checked={club.blog_enabled ?? false}
                          disabled={savingMap[club.id]}
                          onChange={e => handleToggle(club.id, 'blog_enabled', e.target.checked)}
                        />
                        <span className="fc-toggle-track"><span className="fc-toggle-thumb"/></span>
                        <span className="fc-toggle-label">{club.blog_enabled ? 'On' : 'Off'}</span>
                      </label>
                    </td>
                    <td className="fc-status-cell">
                      {savingMap[club.id] && (
                        <span className="fc-status saving">Saving...</span>
                      )}
                      {savedMap[club.id] && !savingMap[club.id] && (
                        <span className="fc-status saved">✓ Saved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER — just informational now */}
          <div className="fc-footer">
            <span className="fc-footer-note">Changes save automatically when you toggle</span>
          </div>

        </div>
      </div>
    </SuperAdminLayout>
  );
}