import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SuperAdminLayout from './components/SuperAdminLayout';
import Swal from 'sweetalert2';
import '../../styles/superadmin/reports.css';

const API = '/api/superadmin';
const getToken = () => sessionStorage.getItem('token');

function getFileType(fileName) {
  if (!fileName) return 'pdf';
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf')  return 'pdf';
  if (ext === 'xlsx') return 'xlsx';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  return 'pdf';
}

export default function SubmittedReports() {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [years, setYears]           = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos]       = useState({ top: 0, left: 0 });

  useEffect(() => {
    fetchReports();
    const handler = e => {
      if (!e.target.closest('.sr-menu-wrap')) setOpenMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/reports`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      const list = data.reports || [];
      setReports(list);
      const uniqueYears = [...new Set(list.map(r => r.year).filter(Boolean))].sort((a, b) => b - a);
      setYears(uniqueYears);
      const currentYear = String(new Date().getFullYear());
      if (uniqueYears.includes(currentYear)) setYearFilter(currentYear);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete(report) {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: 'Delete Report?',
      html: `Delete <strong>${report.title}</strong>?<br>This cannot be undone.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e53e3e', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const res  = await fetch(`${API}/reports/${report.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: data.message, timer: 1500, showConfirmButton: false });
        fetchReports();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not connect.' }); }
  }

  function openMenu(e, reportId) {
    e.stopPropagation();
    if (openMenuId === reportId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + window.scrollY + 4, left: rect.right - 168 });
    setOpenMenuId(reportId);
  }

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      r.title?.toLowerCase().includes(q) ||
      r.club_name?.toLowerCase().includes(q) ||
      r.uploaded_by?.toLowerCase().includes(q) ||
      r.file_name?.toLowerCase().includes(q);
    const matchYear = !yearFilter || r.year === yearFilter;
    return matchSearch && matchYear;
  });

  return (
    <SuperAdminLayout title="Submitted Reports" subtitle="View all reports forwarded to DSA">
      <div className="sr-page">

        {/* CONTROLS */}
        <div className="sr-controls">
          <div className="sr-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search reports, clubs, advisors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="sr-select-wrap">
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className={yearFilter ? 'active' : ''}>
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="sr-empty"><p>Loading reports...</p></div>
        ) : filtered.length === 0 ? (
          <div className="sr-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No reports found</p>
            <span>{yearFilter ? `No reports submitted for ${yearFilter}` : 'Try adjusting your search or filter'}</span>
          </div>
        ) : (
          <div className="sr-card">
            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Club Name</th>
                    <th>Report Type</th>
                    <th>Posted By</th>
                    <th>Date</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(report => {
                    const fileType = getFileType(report.file_name);
                    return (
                      <tr key={report.id} className="sr-row" onClick={() => report.file_url && window.open(report.file_url, '_blank')}>
                        {/* FILE */}
                        <td>
                          <div className="sr-file-cell">
                            <div className={`sr-file-icon ${fileType}`}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                              <span>{fileType.toUpperCase()}</span>
                            </div>
                            <div className="sr-file-info">
                              <span className="sr-title">{report.title}</span>
                              <span className="sr-fname">{report.file_name} · {report.file_size}</span>
                            </div>
                          </div>
                        </td>
                        {/* CLUB NAME */}
                        <td><span className="sr-cell-text">{report.club_name || '—'}</span></td>
                        {/* REPORT TYPE */}
                        <td>
                          <span className="sr-type-badge">{report.type || '—'}</span>
                        </td>
                        {/* POSTED BY */}
                        <td><span className="sr-cell-text">{report.uploaded_by || '—'}</span></td>
                        {/* DATE */}
                        <td><span className="sr-cell-text">{report.forwarded_at || report.created_at}</span></td>
                        {/* 3 DOT */}
                        <td onClick={e => e.stopPropagation()}>
                          <div className="sr-menu-wrap">
                            <button className="sr-menu-btn" onClick={e => openMenu(e, report.id)}>
                              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <circle cx="12" cy="5" r="1.5"/>
                                <circle cx="12" cy="12" r="1.5"/>
                                <circle cx="12" cy="19" r="1.5"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="sr-footer">
              Showing {filtered.length} of {reports.length} report{reports.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

      </div>

      {/* 3 DOT DROPDOWN PORTAL */}
      {openMenuId && createPortal(
        <div className="sr-dropdown" style={{ top: menuPos.top, left: menuPos.left }} onClick={e => e.stopPropagation()}>
          <button className="sr-dd-item view" onClick={() => {
            const report = reports.find(r => r.id === openMenuId);
            if (report?.file_url) window.open(report.file_url, '_blank');
            setOpenMenuId(null);
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View
          </button>
          <button className="sr-dd-item download" onClick={() => {
            const report = reports.find(r => r.id === openMenuId);
            if (report?.file_url) {
              const a = document.createElement('a');
              a.href = report.file_url; a.download = report.file_name; a.click();
            }
            setOpenMenuId(null);
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
          <div className="sr-dd-divider"/>
          <button className="sr-dd-item delete" onClick={() => {
            const report = reports.find(r => r.id === openMenuId);
            if (report) handleDelete(report);
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Delete
          </button>
        </div>,
        document.body
      )}

    </SuperAdminLayout>
  );
}