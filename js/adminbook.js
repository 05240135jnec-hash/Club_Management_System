/* ============================================
   Admin Booking Management - Complete JavaScript
   Clean & Professional Interface - No Icons
============================================ */

// ========== PRICE CONFIGURATION ==========
const PRICES = {
  normal: { rub: 250, outside: 350, international: 1600 },
  executive: { rub: 500, outside: 800, international: 1600 }
};

const GUEST_LABELS = { rub: 'RUB Student/Staff', outside: 'Outside RUB', international: 'International' };

// ========== MOCK DATA ==========
let rooms = [
  { id: 1, floor: 'GF', num: '1' },
  { id: 2, floor: 'GF', num: '2' },
  { id: 3, floor: 'FF', num: '1' },
  { id: 4, floor: 'FF', num: '2' }
];

let bookings = [
  { id: 'SE-CST-001', name: 'Tshering Dorji', phone: '17123456', email: 'tshering@cst.edu.bt', idNum: '11201000123', guestType: 'rub', room: 'GF 1', roomType: 'normal', beds: 2, checkin: '2025-05-14', checkout: '2025-05-16', nights: 2, purpose: 'Academic visit', status: 'pending', note: '' },
  { id: 'SE-CST-002', name: 'Karma Wangchuk', phone: '17654321', email: 'karma@gmail.com', idNum: '11201000456', guestType: 'outside', room: 'GF 2', roomType: 'executive', beds: 1, checkin: '2025-05-14', checkout: '2025-05-15', nights: 1, purpose: 'Personal', status: 'pending', note: '' },
  { id: 'SE-CST-003', name: 'Prof. James Smith', phone: '+1-555-0122', email: 'jsmith@mit.edu', idNum: 'PASSPORT-A1234567', guestType: 'international', room: 'FF 2', roomType: 'executive', beds: 1, checkin: '2025-05-15', checkout: '2025-05-18', nights: 3, purpose: 'Research collaboration', status: 'pending', note: '' },
  { id: 'SE-CST-004', name: 'Pema Lhamo', phone: '17234567', email: 'pema@rub.edu.bt', idNum: '11201000789', guestType: 'rub', room: 'FF 1', roomType: 'normal', beds: 2, checkin: '2025-05-12', checkout: '2025-05-14', nights: 2, purpose: 'Workshop', status: 'approved', note: '' },
  { id: 'SE-CST-005', name: 'Sonam Tobgay', phone: '77891234', email: 'sonam@yahoo.com', idNum: '11201000321', guestType: 'outside', room: 'GF 1', roomType: 'normal', beds: 1, checkin: '2025-05-10', checkout: '2025-05-12', nights: 2, purpose: 'Family visit', status: 'approved', note: '' },
  { id: 'SE-CST-006', name: 'Rinchen Zangmo', phone: '17345678', email: 'rinchen@cst.edu.bt', idNum: '11201000654', guestType: 'rub', room: 'FF 2', roomType: 'normal', beds: 1, checkin: '2025-05-08', checkout: '2025-05-09', nights: 1, purpose: 'Conference', status: 'rejected', note: 'Room under maintenance during requested dates.' }
];

// ========== STATE ==========
let currentTab = 'all';
let rejectTargetId = null;

// ========== UTILITY FUNCTIONS ==========
function calcTotal(booking) {
  return PRICES[booking.roomType][booking.guestType] * booking.beds * booking.nights;
}

function showToast(message, type = 'ok') {
  const wrap = document.getElementById('toastWrap');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ========== STATISTICS ==========
function updateStats() {
  const today = '2025-05-14';
  const pending = bookings.filter(b => b.status === 'pending').length;
  const checkin = bookings.filter(b => b.checkin === today && b.status === 'approved').length;
  const revenue = bookings.filter(b => b.status === 'approved').reduce((a, b) => a + calcTotal(b), 0);
  
  document.getElementById('b-checkin').textContent = checkin;
  document.getElementById('b-pending').textContent = pending;
  document.getElementById('b-week').textContent = bookings.length;
  document.getElementById('b-revenue').textContent = `Nu. ${revenue.toLocaleString()}`;
  document.getElementById('pendingBadge').textContent = pending;
  document.getElementById('cnt-all').textContent = bookings.length;
  document.getElementById('cnt-pending').textContent = pending;
  document.getElementById('cnt-approved').textContent = bookings.filter(b => b.status === 'approved').length;
  document.getElementById('cnt-rejected').textContent = bookings.filter(b => b.status === 'rejected').length;
}

// ========== ROOM FILTER UPDATE ==========
function updateRoomFilter() {
  const sel = document.getElementById('roomFilter');
  const current = sel.value;
  sel.innerHTML = '<option value="">All Rooms</option>' + rooms.map(r => `<option value="${r.floor} ${r.num}">${r.floor} ${r.num}</option>`).join('');
  sel.value = current;
}

// ========== RENDER BOOKINGS ==========
function renderBookingsList() {
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const room = document.getElementById('roomFilter')?.value || '';
  const type = document.getElementById('typeFilter')?.value || '';
  
  let filtered = bookings.filter(b => {
    if (currentTab !== 'all' && b.status !== currentTab) return false;
    if (room && b.room !== room) return false;
    if (type && b.guestType !== type) return false;
    if (search && !b.name.toLowerCase().includes(search) && !b.id.toLowerCase().includes(search) && !b.idNum.toLowerCase().includes(search)) return false;
    return true;
  });

  const container = document.getElementById('bookingsList');
  if (!container) return;
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><p>No bookings match your filters.</p></div>';
    return;
  }

  container.innerHTML = filtered.map(b => {
    const total = calcTotal(b);
    const isPending = b.status === 'pending';
    const guestLabel = GUEST_LABELS[b.guestType] || b.guestType;
    const statusClass = b.status === 'pending' ? 'status-pending' : (b.status === 'approved' ? 'status-approved' : 'status-rejected');
    const statusText = b.status.charAt(0).toUpperCase() + b.status.slice(1);
    
    return `
      <div class="booking-card ${b.status}" onclick="openBookingDetail('${b.id}')">
        <div class="booking-header">
          <div>
            <div class="booking-id">${b.id}</div>
            <div class="booking-name">${escapeHtml(b.name)}</div>
          </div>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="booking-details">
          <span>Room ${b.room} · ${b.roomType === 'normal' ? 'Standard' : 'Executive'}</span>
          <span>${formatDate(b.checkin)} → ${formatDate(b.checkout)}</span>
          <span>${b.nights} night${b.nights > 1 ? 's' : ''}</span>
          <span>${b.beds} bed${b.beds > 1 ? 's' : ''}</span>
          <span>${guestLabel}</span>
        </div>
        <div class="booking-actions">
          ${isPending ? `
            <button class="btn-sm btn-success" onclick="event.stopPropagation(); approveBooking('${b.id}')">Approve</button>
            <button class="btn-sm btn-danger" onclick="event.stopPropagation(); openRejectModal('${b.id}')">Reject</button>
          ` : ''}
          <button class="btn-sm btn-outline" onclick="event.stopPropagation(); openBookingDetail('${b.id}')">View Details</button>
          <span class="booking-total">Nu. ${total.toLocaleString()}</span>
        </div>
      </div>`;
  }).join('');
  
  updateStats();
}

// ========== TAB SWITCHING ==========
function switchBookingTab(tab, element) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  if (element) element.classList.add('active');
  renderBookingsList();
}

// ========== APPROVE BOOKING ==========
function approveBooking(id) {
  const booking = bookings.find(b => b.id === id);
  if (booking) {
    booking.status = 'approved';
    renderBookingsList();
    showToast(`Booking ${id} approved. Guest will be notified.`, 'ok');
  }
}

// ========== OPEN BOOKING DETAIL ==========
function openBookingDetail(id) {
  const b = bookings.find(b => b.id === id);
  if (!b) return;
  
  const total = calcTotal(b);
  const pricePerBed = PRICES[b.roomType][b.guestType];
  const initials = b.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isPending = b.status === 'pending';
  const guestLabel = GUEST_LABELS[b.guestType] || b.guestType;
  const statusClass = b.status === 'pending' ? 'status-pending' : (b.status === 'approved' ? 'status-approved' : 'status-rejected');
  const statusText = b.status.charAt(0).toUpperCase() + b.status.slice(1);

  document.getElementById('modalTitle').textContent = `Booking ${b.id}`;
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
      <div class="guest-avatar">${initials}</div>
      <div>
        <p style="font-size:16px; font-weight:700; color:#0f2a3f;">${escapeHtml(b.name)}</p>
        <p style="font-size:12px; color:#7a8c9e;">${escapeHtml(b.email)} · ${escapeHtml(b.phone)}</p>
      </div>
      <span class="status-badge ${statusClass}" style="margin-left:auto;">${statusText}</span>
    </div>
    <div class="detail-grid">
      ${detailRow('Booking ID', `<span style="font-family:monospace;">${b.id}</span>`)}
      ${detailRow('ID / Passport', escapeHtml(b.idNum))}
      ${detailRow('Guest Type', guestLabel)}
      ${detailRow('Room', `Room ${b.room} (${b.roomType === 'normal' ? 'Standard' : 'Executive'})`)}
      ${detailRow('Beds', `${b.beds} bed${b.beds > 1 ? 's' : ''}`)}
      ${detailRow('Check-in', formatDate(b.checkin))}
      ${detailRow('Check-out', formatDate(b.checkout))}
      ${detailRow('Nights', b.nights)}
      ${detailRow('Purpose', escapeHtml(b.purpose))}
      ${b.note ? detailRow('Note', `<span style="color:#c0392b;">${escapeHtml(b.note)}</span>`) : ''}
    </div>
    <div class="price-summary">
      <p style="font-size:12px; color:#7a8c9e; margin-bottom:6px;">Price Breakdown</p>
      <p style="font-size:12px; color:#5a6e7c; margin-bottom:10px;">Nu.${pricePerBed} × ${b.beds} bed${b.beds > 1 ? 's' : ''} × ${b.nights} night${b.nights > 1 ? 's' : ''}</p>
      <div class="total-amt">Nu. ${total.toLocaleString()}</div>
      <p style="font-size:11px; color:#9aa6b5; margin-top:8px;">Payable at property on arrival</p>
    </div>`;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn-sm btn-outline" onclick="closeBookingModal()">Close</button>
    ${isPending ? `
      <button class="btn-sm btn-danger" onclick="closeBookingModal(); openRejectModal('${b.id}')">Reject</button>
      <button class="btn-sm btn-success" onclick="closeBookingModal(); approveBooking('${b.id}')">Approve</button>
    ` : ''}`;

  document.getElementById('bookingModal').classList.add('open');
}

function detailRow(label, value) {
  return `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
}

// ========== REJECT MODAL ==========
function openRejectModal(id) {
  rejectTargetId = id;
  const b = bookings.find(b => b.id === id);
  document.getElementById('modalTitle').textContent = 'Reject Booking';
  document.getElementById('modalBody').innerHTML = `
    <p style="font-size:13px; color:#7a8c9e; margin-bottom:16px;">
      You are about to reject booking <strong style="color:#0f2a3f;">${id}</strong> for
      <strong style="color:#0f2a3f;">${escapeHtml(b.name)}</strong>.
    </p>
    <div class="form-group">
      <label>Reason for rejection (optional)</label>
      <textarea id="rejectReason" rows="3" placeholder="e.g. Room unavailable on requested dates..."></textarea>
    </div>`;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn-sm btn-outline" onclick="closeBookingModal()">Cancel</button>
    <button class="btn-sm btn-danger" onclick="confirmRejection()">Confirm Rejection</button>`;
  document.getElementById('bookingModal').classList.add('open');
}

function confirmRejection() {
  const reason = document.getElementById('rejectReason')?.value.trim() || 'Rejected by admin.';
  const b = bookings.find(b => b.id === rejectTargetId);
  if (b) {
    b.status = 'rejected';
    b.note = reason;
  }
  closeBookingModal();
  renderBookingsList();
  showToast(`Booking ${rejectTargetId} rejected.`, 'err');
  rejectTargetId = null;
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
  rejectTargetId = null;
}

// ========== NAVIGATION ==========
function navigatePage(page, element) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (element) element.classList.add('active');
  
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  
  const titles = {
    bookings: ['Booking Management', 'Review, approve and manage all guest bookings']
  };
  
  const [title, sub] = titles[page] || [page, ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = sub;
  
  if (page === 'bookings') {
    renderBookingsList();
    updateStats();
  }
}

// ========== SET TOPBAR DATE ==========
function setTopbarDate() {
  const dateEl = document.getElementById('topbarDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
}

// ========== INITIALIZATION ==========
function init() {
  setTopbarDate();
  updateRoomFilter();
  renderBookingsList();
  updateStats();
  
  document.getElementById('bookingModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeBookingModal();
  });
}

document.addEventListener('DOMContentLoaded', init);