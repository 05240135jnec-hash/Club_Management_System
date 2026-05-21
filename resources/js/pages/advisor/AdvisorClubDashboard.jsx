import React, { useEffect, useRef } from 'react';
import AdvisorLayout from './components/AdvisorLayout';
import { Chart, registerables } from 'chart.js';
import '../../styles/advisor/advisordashboard.css';

Chart.register(...registerables);

const STATIC_DATA = {
  totalMembers: 48,
  attendanceRate: 82,
  totalAnnouncements: 12,
  monthlyAttendance: {
    labels: ['October', 'November', 'December', 'January', 'February', 'March'],
    present: [38, 42, 35, 44, 40, 46],
    absent:  [10,  6, 13,  4,  8,  2],
  },
  announcements: [
    { id: 1, title: 'Annual Tech Fest – Registration Open',  date: '28 Mar 2025', type: 'event',   unread: true  },
    { id: 2, title: 'Club Meeting Rescheduled to Friday',    date: '25 Mar 2025', type: 'notice',  unread: true  },
    { id: 3, title: 'Hackathon 2025 – Winners Announced',    date: '20 Mar 2025', type: 'result',  unread: false },
    { id: 4, title: 'New Enrollment Key Released for Sem 6', date: '18 Mar 2025', type: 'general', unread: false },
    { id: 5, title: 'Photography Workshop – Sign-up Now',    date: '14 Mar 2025', type: 'event',   unread: false },
  ],
};

const TYPE_COLORS = {
  event:   { bg: '#eef1fd', color: '#2d5be3' },
  notice:  { bg: '#fffbeb', color: '#d97706' },
  result:  { bg: '#f0fdf4', color: '#16a34a' },
  general: { bg: '#f5f3ff', color: '#7c3aed' },
};

const ANN_ICONS = {
  event: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  notice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  result: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  general: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
};

export default function AdvisorClubDashboard() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: STATIC_DATA.monthlyAttendance.labels,
        datasets: [
          {
            label: 'Present',
            data: STATIC_DATA.monthlyAttendance.present,
            backgroundColor: 'rgba(45, 91, 227, 0.85)',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.55,
            categoryPercentage: 0.7,
          },
          {
            label: 'Absent',
            data: STATIC_DATA.monthlyAttendance.absent,
            backgroundColor: 'rgba(226, 230, 239, 0.9)',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.55,
            categoryPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a2e',
            titleColor: '#fff',
            bodyColor: '#c8d8e4',
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: 'Inter, sans-serif', size: 12 }, color: '#8892a4' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            border: { display: false },
            ticks: { font: { family: 'Inter, sans-serif', size: 12 }, color: '#8892a4', stepSize: 10 },
          },
        },
      },
    });

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, []);

  return (
    <AdvisorLayout title="Dashboard" subtitle="Welcome back, Advisor — here's your club at a glance">

      {/* STAT CARDS */}
      <div className="adb-stat-cards">
        <div className="adb-stat-card adb-stat-members">
          <div className="adb-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="adb-stat-info">
            <span className="adb-stat-label">Total Members</span>
            <span className="adb-stat-value">{STATIC_DATA.totalMembers}</span>
          </div>
        </div>

        <div className="adb-stat-card adb-stat-attendance">
          <div className="adb-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div className="adb-stat-info">
            <span className="adb-stat-label">Attendance Rate</span>
            <span className="adb-stat-value">{STATIC_DATA.attendanceRate}%</span>
          </div>
        </div>

        <div className="adb-stat-card adb-stat-announcements">
          <div className="adb-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div className="adb-stat-info">
            <span className="adb-stat-label">Total Announcements</span>
            <span className="adb-stat-value">{STATIC_DATA.totalAnnouncements}</span>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="adb-grid">

        {/* ATTENDANCE CHART */}
        <div className="adb-card adb-chart-card">
          <div className="adb-card-header">
            <div>
              <div className="adb-card-title">Monthly Attendance</div>
              <div className="adb-card-subtitle">Member attendance over the past 6 months</div>
            </div>
            <div className="adb-chart-legend">
              <span className="adb-legend-dot present" /><span className="adb-legend-text">Present</span>
              <span className="adb-legend-dot absent" /><span className="adb-legend-text">Absent</span>
            </div>
          </div>
          <div className="adb-chart-container">
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* ANNOUNCEMENTS */}
        <div className="adb-card adb-ann-card">
          <div className="adb-card-header">
            <div>
              <div className="adb-card-title">Recent Announcements</div>
              <div className="adb-card-subtitle">Latest posts from your club</div>
            </div>
          </div>
          <div className="adb-ann-list">
            {STATIC_DATA.announcements.map(ann => {
              const colors = TYPE_COLORS[ann.type] || TYPE_COLORS.general;
              return (
                <div className="adb-ann-item" key={ann.id}>
                  <div className="adb-ann-icon" style={{ background: colors.bg, color: colors.color }}>
                    {ANN_ICONS[ann.type] || ANN_ICONS.general}
                  </div>
                  <div className="adb-ann-body">
                    <div className="adb-ann-title">{ann.title}</div>
                    <div className="adb-ann-meta">
                      <span className="adb-ann-date">{ann.date}</span>
                      <span className="adb-ann-badge" style={{ background: colors.bg, color: colors.color }}>
                        {ann.type.charAt(0).toUpperCase() + ann.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  {ann.unread && <div className="adb-ann-unread" />}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AdvisorLayout>
  );
}