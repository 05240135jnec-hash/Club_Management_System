'use strict';

/* ============================================================
   JNEC Club Management – Work Plan
   File: workplan.js
   ============================================================ */

/* ──────────────────────────────────────────────────────────────
   PLAN DATA
   ────────────────────────────────────────────────────────────── */
const ALL_PLANS = [
  {
    id:       'wp-sem1',
    name:     'Semester 1 Work Plan',
    filename: 'workplan_semester1.pdf',
    size:     '1.4 MB',
    uploaded: '2024-01-08',
    semester: 'Semester 1',
    url:      'https://www.w3.org/WAI/WCAG21/wcag21.pdf',
  },
  {
    id:       'wp-sem2',
    name:     'Semester 2 Work Plan',
    filename: 'workplan_semester2.pdf',
    size:     '1.1 MB',
    uploaded: '2024-06-15',
    semester: 'Semester 2',
    url:      'https://www.w3.org/WAI/WCAG21/wcag21.pdf',
  },
  {
    id:       'wp-sem3',
    name:     'Semester 3 Work Plan',
    filename: 'workplan_semester3.pdf',
    size:     '980 KB',
    uploaded: '2025-01-05',
    semester: 'Semester 3',
    url:      'https://www.w3.org/WAI/WCAG21/wcag21.pdf',
  },
  {
    id:       'wp-sem4',
    name:     'Semester 4 Work Plan',
    filename: 'workplan_semester4.pdf',
    size:     '1.2 MB',
    uploaded: '2025-06-10',
    semester: 'Semester 4',
    url:      'https://www.w3.org/WAI/WCAG21/wcag21.pdf',
  },
];

/* ──────────────────────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────────────────────── */
let searchQuery  = '';
let toastTimer   = null;
let currentPlan  = null;

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */
function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* CHANGED: sort by uploaded date descending — latest first */
function sortedByLatest(plans) {
  return [...plans].sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ──────────────────────────────────────────────────────────────
   TOAST
   ────────────────────────────────────────────────────────────── */
function showToast(msg, icon) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = icon
    ? `<span>${icon}</span><span>${msg}</span>`
    : `<span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ──────────────────────────────────────────────────────────────
   PDF MODAL – open
   ────────────────────────────────────────────────────────────── */
function openModal(plan) {
  currentPlan = plan;

  const backdrop = document.getElementById('modal-backdrop');
  const iframe   = document.getElementById('pdf-iframe');
  const loading  = document.getElementById('pdf-loading');
  const title    = document.getElementById('modal-title');

  title.textContent     = plan.name;
  iframe.src            = '';
  iframe.style.opacity  = '0';
  loading.style.display = 'flex';

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  setTimeout(() => { iframe.src = plan.url; }, 140);

  iframe.onload = () => {
    loading.style.display = 'none';
    iframe.style.opacity  = '1';
  };

  showToast(`Opening "${plan.name}"…`, '📄');
}

/* ──────────────────────────────────────────────────────────────
   PDF MODAL – close
   ────────────────────────────────────────────────────────────── */
function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const iframe   = document.getElementById('pdf-iframe');

  backdrop.classList.remove('open');
  document.body.style.overflow = '';

  setTimeout(() => { iframe.src = ''; }, 260);
  currentPlan = null;
}

/* ──────────────────────────────────────────────────────────────
   DOWNLOAD
   ────────────────────────────────────────────────────────────── */
function downloadPlan(plan, btn) {
  const orig = btn.innerHTML;
  btn.classList.add('loading');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" style="animation:spin .75s linear infinite;width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    Downloading…`;

  showToast(`Downloading "${plan.filename}"…`, '⬇');

  const a = document.createElement('a');
  a.href     = plan.url;
  a.download = plan.filename;
  a.target   = '_blank';
  a.rel      = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    btn.classList.remove('loading');
    btn.innerHTML = orig;
    showToast(`"${plan.filename}" download started!`, '✓');
  }, 1800);
}

/* ──────────────────────────────────────────────────────────────
   BUILD A SINGLE PLAN ROW
   ────────────────────────────────────────────────────────────── */
function buildItem(plan) {
  const el = document.createElement('div');
  el.className  = 'plan-item';
  el.dataset.id = plan.id;

  el.innerHTML = `
    <div class="file-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="15" y2="17"/>
        <line x1="9" y1="9"  x2="12" y2="9"/>
      </svg>
      <span class="file-type-label">PDF</span>
    </div>
    <div class="plan-info">
      <div class="plan-name">${esc(plan.name)}</div>
      <div class="plan-meta">
        <span class="meta-filename" title="${esc(plan.filename)}">${esc(plan.filename)}</span>
        <span class="meta-dot"></span>
        <span>${esc(plan.size)}</span>
        <span class="meta-dot"></span>
        <span>Uploaded ${fmtDate(plan.uploaded)}</span>
      </div>
    </div>
    <div class="plan-actions">
      <button class="btn btn-open" aria-label="View ${esc(plan.name)}">
        <svg viewBox="0 0 24 24">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        View
      </button>
      <button class="btn btn-download" aria-label="Download ${esc(plan.name)}">
        <svg viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download
      </button>
    </div>`;

  el.querySelector('.btn-open').addEventListener('click', () => openModal(plan));
  el.querySelector('.btn-download').addEventListener('click', function () {
    downloadPlan(plan, this);
  });

  return el;
}

/* ──────────────────────────────────────────────────────────────
   RENDER
   CHANGED: flat list sorted by latest uploaded date, no semester grouping
   ────────────────────────────────────────────────────────────── */
function render(plans) {
  const listEl  = document.getElementById('plan-list');
  const emptyEl = document.getElementById('empty-state');
  listEl.innerHTML = '';

  if (plans.length === 0) {
    emptyEl.style.display = 'flex';
    return;
  }
  emptyEl.style.display = 'none';

  /* Sort latest uploaded date first */
  const sorted = sortedByLatest(plans);

  sorted.forEach(plan => {
    listEl.appendChild(buildItem(plan));
  });
}

/* ──────────────────────────────────────────────────────────────
   FILTER — search only (semester filter chips removed)
   ────────────────────────────────────────────────────────────── */
function applyFilters() {
  const q = searchQuery.toLowerCase().trim();
  const filtered = ALL_PLANS.filter(p => {
    return !q ||
      p.name.toLowerCase().includes(q) ||
      p.filename.toLowerCase().includes(q) ||
      p.semester.toLowerCase().includes(q);
  });
  render(filtered);
}

/* ──────────────────────────────────────────────────────────────
   RESET FILTERS
   ────────────────────────────────────────────────────────────── */
window.resetFilters = function () {
  searchQuery = '';
  const input = document.getElementById('search-input');
  const clear = document.getElementById('search-clear');
  if (input) input.value = '';
  if (clear) clear.classList.remove('visible');
  applyFilters();
};

/* ──────────────────────────────────────────────────────────────
   SIDEBAR NAV
   ────────────────────────────────────────────────────────────── */
function initNav() {
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.remove('active');
    const href = (item.getAttribute('href') || '').split('/').pop();
    if (href === current) item.classList.add('active');
  });
}

/* ──────────────────────────────────────────────────────────────
   HAMBURGER MENU (mobile)
   ────────────────────────────────────────────────────────────── */
function initHamburger() {
  const btn     = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar()  {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () =>
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
  );
  overlay.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item').forEach(item =>
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    })
  );
}

/* ──────────────────────────────────────────────────────────────
   MODAL EVENTS
   ────────────────────────────────────────────────────────────── */
function initModal() {
  document.getElementById('modal-close')
    .addEventListener('click', closeModal);

  document.getElementById('modal-backdrop')
    .addEventListener('click', e => {
      if (e.target.id === 'modal-backdrop') closeModal();
    });

  document.getElementById('modal-download-btn')
    .addEventListener('click', function () {
      if (currentPlan) downloadPlan(currentPlan, this);
    });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

/* ──────────────────────────────────────────────────────────────
   SEARCH EVENTS (filter chip events removed)
   ────────────────────────────────────────────────────────────── */
function initControls() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    searchClear.classList.toggle('visible', searchQuery.length > 0);
    applyFilters();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.remove('visible');
    searchInput.focus();
    applyFilters();
  });
}

/* ──────────────────────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  render(ALL_PLANS);
  initNav();
  initHamburger();
  initModal();
  initControls();
});