'use strict';

/* ============================================================
   JNEC Club Management – My Attendance
   File: js/attendance.js
   ============================================================ */

/* ──────────────────────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────────────────────── */
const allRecords = [
  { event: 'Monthly Club Meeting',       date: '2025-03-10', status: 'Present' },
  { event: 'Photography Workshop',       date: '2025-03-08', status: 'Present' },
  { event: 'Karate Belt Grading',        date: '2025-03-05', status: 'Absent'  },
  { event: 'Weekly Training Session',    date: '2025-02-28', status: 'Present' },
  { event: 'Social Media Strategy',      date: '2025-02-25', status: 'Present' },
  { event: 'Documentary Screening',      date: '2025-02-20', status: 'Present' },
  { event: 'Advanced Sparring Practice', date: '2025-02-18', status: 'Late'    },
  { event: 'Podcast Production Lab',     date: '2025-02-14', status: 'Absent'  },
  { event: 'Belt Theory Class',          date: '2025-02-10', status: 'Present' },
  { event: 'Video Editing Masterclass',  date: '2025-02-06', status: 'Present' },
  { event: 'Kumite Tournament',          date: '2025-01-30', status: 'Present' },
  { event: 'Content Planning Meeting',   date: '2025-01-24', status: 'Absent'  },
];

/* ──────────────────────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────────────────────── */
let filtered = [...allRecords];

/* ──────────────────────────────────────────────────────────────
   HELPER – format ISO date to readable string
   e.g. '2025-03-10'  →  '10 Mar 2025'
   ────────────────────────────────────────────────────────────── */
function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

/* ──────────────────────────────────────────────────────────────
   SUMMARY STATS
   ────────────────────────────────────────────────────────────── */
function updateStats() {
  const total   = allRecords.length;
  const present = allRecords.filter(r => r.status === 'Present').length;
  const absent  = allRecords.filter(r => r.status === 'Absent').length;
  const rate    = total ? Math.round((present / total) * 100) : 0;

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-present').textContent = present;
  document.getElementById('stat-absent').textContent  = absent;
  document.getElementById('stat-rate').textContent    = rate + '%';
}

/* ──────────────────────────────────────────────────────────────
   RENDER TABLE ROWS
   ✅ All matching rows rendered at once — no pagination
   ────────────────────────────────────────────────────────────── */
function render() {
  const tbody = document.getElementById('table-body');
  const empty = document.getElementById('empty-state');
  const total = filtered.length;

  if (total === 0) {
    tbody.innerHTML     = '';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = filtered
      .map(r => `
        <tr>
          <td><div class="event-name">${r.event}</div></td>
          <td class="date-cell">${fmtDate(r.date)}</td>
          <td>
            <span class="status-badge ${r.status.toLowerCase()}">${r.status}</span>
          </td>
        </tr>`)
      .join('');
  }

  /* Update card subtitle */
  const label = document.getElementById('record-count-label');
  if (label) {
    label.textContent = total === 0
      ? 'No records found'
      : `${total} record${total !== 1 ? 's' : ''}`;
  }

  /* Update footer count */
  const info = document.getElementById('records-info');
  if (info) {
    info.textContent = total === 0 ? '' : `${total} record${total !== 1 ? 's' : ''} total`;
  }
}

/* ──────────────────────────────────────────────────────────────
   DEFAULT SORT – newest first
   ────────────────────────────────────────────────────────────── */
function applyDefaultSort() {
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ──────────────────────────────────────────────────────────────
   FILTER
   ────────────────────────────────────────────────────────────── */
function applyFilters() {
  const q      = document.getElementById('search-input').value.toLowerCase().trim();
  const status = document.getElementById('status-filter').value;
  const date   = document.getElementById('date-filter').value;

  filtered = allRecords.filter(r => {
    const matchQ = r.event.toLowerCase().includes(q);
    const matchS = !status || r.status === status;
    const matchD = !date   || r.date   === date;
    return matchQ && matchS && matchD;
  });

  applyDefaultSort();
  render();
}

/* ──────────────────────────────────────────────────────────────
   FILTER EVENT LISTENERS
   ────────────────────────────────────────────────────────────── */
function initFilters() {
  document.getElementById('search-input').addEventListener('input',   applyFilters);
  document.getElementById('status-filter').addEventListener('change', applyFilters);
  document.getElementById('date-filter').addEventListener('change',   applyFilters);
}

/* ──────────────────────────────────────────────────────────────
   SIDEBAR NAV – highlight current page + free navigation
   ────────────────────────────────────────────────────────────── */
function initSidebarNav() {
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';

  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.remove('active');
    const href = (item.getAttribute('href') || '').split('/').pop();
    if (href === current) {
      item.classList.add('active');
    }
    /* NO e.preventDefault() — all links navigate freely */
  });
}

/* ──────────────────────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  applyDefaultSort();
  render();
  initFilters();
  initSidebarNav();
});