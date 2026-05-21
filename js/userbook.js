// ========== BOOKINGS DATA (All Confirmed - Auto Booking System) ==========
const bookingsData = [
  {
    id: 'WJF-5137',
    bookerName: 'Chungku Wangmo',
    email: 'chungku.wangmo@rub.edu.bt',
    phone: '17123456',
    idNumber: '11201000123',
    guesthouse: 'JNEC GuestHouse',
    roomNumber: 'GF-2',
    floor: 'Ground Floor',
    roomType: 'Normal',
    beds: 2,
    checkin: '2026-05-16',
    checkout: '2026-05-17',
    nights: 1,
    purpose: 'Academic visit / Research',
    roomCharge: 250,
    serviceCharge: 35,
    totalPaid: 285,
    bookedAt: 'May 15, 2026, 04:55 AM',
    guestType: 'RUB Student'
  },
  {
    id: 'WJF-5138',
    bookerName: 'Tshering Dorji',
    email: 'tshering.dorji@rub.edu.bt',
    phone: '17234567',
    idNumber: '11201000456',
    guesthouse: 'JNEC GuestHouse',
    roomNumber: 'FF-1',
    floor: 'First Floor',
    roomType: 'Executive',
    beds: 1,
    checkin: '2026-05-16',
    checkout: '2026-05-18',
    nights: 2,
    purpose: 'Conference / Workshop',
    roomCharge: 800,
    serviceCharge: 35,
    totalPaid: 1635,
    bookedAt: 'May 14, 2026, 10:30 AM',
    guestType: 'Outside RUB'
  },
  {
    id: 'WJF-5139',
    bookerName: 'Pema Lhamo',
    email: 'pema.lhamo@gmail.com',
    phone: '17345678',
    idNumber: 'PA1234567',
    guesthouse: 'JNEC GuestHouse',
    roomNumber: 'GF-1',
    floor: 'Ground Floor',
    roomType: 'Normal',
    beds: 3,
    checkin: '2026-05-17',
    checkout: '2026-05-19',
    nights: 2,
    purpose: 'Tourism / Personal',
    roomCharge: 350,
    serviceCharge: 35,
    totalPaid: 735,
    bookedAt: 'May 13, 2026, 02:15 PM',
    guestType: 'Outside RUB'
  },
  {
    id: 'WJF-5140',
    bookerName: 'Karma Wangchuk',
    email: 'karma.wangchuk@rub.edu.bt',
    phone: '17456789',
    idNumber: '11201000789',
    guesthouse: 'JNEC GuestHouse',
    roomNumber: 'FF-2',
    floor: 'First Floor',
    roomType: 'Normal',
    beds: 2,
    checkin: '2026-05-18',
    checkout: '2026-05-20',
    nights: 2,
    purpose: 'Official college business',
    roomCharge: 250,
    serviceCharge: 35,
    totalPaid: 535,
    bookedAt: 'May 12, 2026, 09:45 AM',
    guestType: 'RUB Student'
  },
  {
    id: 'WJF-5141',
    bookerName: 'Sonam Tobgay',
    email: 'sonam.tobgay@rub.edu.bt',
    phone: '17567890',
    idNumber: '11201000123',
    guesthouse: 'JNEC GuestHouse',
    roomNumber: 'GF-2',
    floor: 'Ground Floor',
    roomType: 'Normal',
    beds: 1,
    checkin: '2026-05-15',
    checkout: '2026-05-16',
    nights: 1,
    purpose: 'Academic visit / Research',
    roomCharge: 250,
    serviceCharge: 35,
    totalPaid: 285,
    bookedAt: 'May 10, 2026, 11:20 AM',
    guestType: 'RUB Student'
  },
  {
    id: 'WJF-5142',
    bookerName: 'Prof. James Wilson',
    email: 'jwilson@university.edu',
    phone: '+1-555-0123',
    idNumber: 'P98765432',
    guesthouse: 'JNEC GuestHouse',
    roomNumber: 'FF-1',
    floor: 'First Floor',
    roomType: 'Executive',
    beds: 1,
    checkin: '2026-05-20',
    checkout: '2026-05-25',
    nights: 5,
    purpose: 'Research collaboration',
    roomCharge: 1600,
    serviceCharge: 35,
    totalPaid: 8035,
    bookedAt: 'May 11, 2026, 03:30 PM',
    guestType: 'International'
  }
];

// ========== STATE ==========
let currentPage = 'bookings';

// ========== HELPER FUNCTIONS ==========
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ========== RENDER FUNCTIONS ==========
function renderBookingsPage() {
  const searchTerm = document.getElementById('searchBookings')?.value.toLowerCase() || '';
  
  let filtered = [...bookingsData];
  
  if (searchTerm) {
    filtered = filtered.filter(b => 
      b.bookerName.toLowerCase().includes(searchTerm) ||
      b.id.toLowerCase().includes(searchTerm) ||
      b.email.toLowerCase().includes(searchTerm)
    );
  }
  
  const stats = {
    total: bookingsData.length,
    totalBeds: bookingsData.reduce((sum, b) => sum + b.beds, 0),
    totalRevenue: bookingsData.reduce((sum, b) => sum + b.totalPaid, 0)
  };
  
  const html = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3>${stats.total}</h3>
        <p>Total Bookings</p>
      </div>
      <div class="stat-card">
        <h3>${stats.totalBeds}</h3>
        <p>Total Beds Booked</p>
      </div>
      <div class="stat-card">
        <h3>Nu. ${stats.totalRevenue.toLocaleString()}</h3>
        <p>Total Revenue</p>
      </div>
    </div>
    
    <div class="filters-bar">
      <input type="text" id="searchBookings" class="search-input" placeholder="Search by name, booking ID or email..." value="${searchTerm}" oninput="renderBookingsPage()">
    </div>
    
    <div class="bookings-table">
      <table>
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Booker Name</th>
            <th>Guesthouse</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.length > 0 ? filtered.map(booking => `
            <tr onclick="showBookingDetail('${booking.id}')">
              <td><strong>${booking.id}</strong></td>
              <td><span class="booker-name" onclick="event.stopPropagation(); showBookingHistory('${booking.bookerName}')">${escapeHtml(booking.bookerName)}</span></td>
              <td>${booking.guesthouse}</td>
              <td>${booking.roomNumber}</td>
              <td>${formatDate(booking.checkin)}</td>
              <td>${formatDate(booking.checkout)}</td>
              <td><strong>Nu. ${booking.totalPaid.toLocaleString()}</strong></td>
            </tr>
          `).join('') : `
            <tr><td colspan="7" style="text-align: center; padding: 40px;">No bookings found</td></tr>
          `}
        </tbody>
      </table>
    </div>
  `;
  
  document.getElementById('page-body').innerHTML = html;
}

function showBookingDetail(bookingId) {
  const booking = bookingsData.find(b => b.id === bookingId);
  if (!booking) return;
  
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div class="detail-grid">
      <div class="detail-row"><span class="detail-label">Booking ID</span><span class="detail-value">${booking.id}</span></div>
      <div class="detail-row"><span class="detail-label">Applicant Name</span><span class="detail-value">${escapeHtml(booking.bookerName)}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(booking.email)}</span></div>
      <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${booking.phone}</span></div>
      <div class="detail-row"><span class="detail-label">ID Number</span><span class="detail-value">${booking.idNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Guest Type</span><span class="detail-value">${booking.guestType}</span></div>
      <div class="detail-row"><span class="detail-label">Guesthouse</span><span class="detail-value">${booking.guesthouse}</span></div>
      <div class="detail-row"><span class="detail-label">Room Number</span><span class="detail-value">${booking.roomNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Floor</span><span class="detail-value">${booking.floor}</span></div>
      <div class="detail-row"><span class="detail-label">Room Type</span><span class="detail-value">${booking.roomType}</span></div>
      <div class="detail-row"><span class="detail-label">Beds</span><span class="detail-value">${booking.beds}</span></div>
      <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${booking.checkin}</span></div>
      <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${booking.checkout}</span></div>
      <div class="detail-row"><span class="detail-label">Nights</span><span class="detail-value">${booking.nights}</span></div>
      <div class="detail-row"><span class="detail-label">Purpose</span><span class="detail-value">${booking.purpose}</span></div>
      <div class="detail-row"><span class="detail-label">Date Booked</span><span class="detail-value">${booking.bookedAt}</span></div>
    </div>
    <div class="price-section">
      <div class="price-row"><span>Room Charge</span><span>Nu. ${booking.roomCharge.toLocaleString()}</span></div>
      <div class="price-row"><span>Service Charge</span><span>Nu. ${booking.serviceCharge.toLocaleString()}</span></div>
      <div class="price-row price-total"><span>Total Paid</span><span>Nu. ${booking.totalPaid.toLocaleString()}</span></div>
    </div>
  `;
  
  document.getElementById('bookingModal').classList.add('open');
}

function showBookingHistory(bookerName) {
  const userBookings = bookingsData.filter(b => b.bookerName === bookerName);
  
  document.getElementById('historyModalTitle').innerHTML = `Booking History - ${escapeHtml(bookerName)}`;
  
  const historyHtml = `
    ${userBookings.length > 0 ? `
      <table class="history-table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${userBookings.map(booking => `
            <tr style="cursor: pointer;" onclick="showBookingDetail('${booking.id}'); closeHistoryModal();">
              <td><strong>${booking.id}</strong></td>
              <td>${booking.roomNumber}</td>
              <td>${formatDate(booking.checkin)}</td>
              <td>${formatDate(booking.checkout)}</td>
              <td>Nu. ${booking.totalPaid.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="text-align: center; padding: 40px;">No booking history found for this guest.</p>'}
  `;
  
  document.getElementById('historyModalBody').innerHTML = historyHtml;
  document.getElementById('historyModal').classList.add('open');
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
}

function closeHistoryModal() {
  document.getElementById('historyModal').classList.remove('open');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ========== NAVIGATION ==========
function navigateTo(page, element) {
  currentPage = page;
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  if (element) element.classList.add('active');
  
  const pageTitles = {
    bookings: ['All Bookings', 'View all guesthouse bookings']
  };
  
  const [title, subtitle] = pageTitles[page] || ['Page', ''];
  document.getElementById('topbar-title').textContent = title;
  document.querySelector('.topbar-subtitle').textContent = subtitle;
  
  if (page === 'bookings') {
    renderBookingsPage();
  }
}

// ========== INITIALIZATION ==========
function init() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) navigateTo(page, item);
    });
  });
  
  renderBookingsPage();
  
  document.getElementById('bookingModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBookingModal();
  });
  document.getElementById('historyModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeHistoryModal();
  });
}

document.addEventListener('DOMContentLoaded', init);