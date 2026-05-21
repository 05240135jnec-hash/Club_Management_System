// ========== ROOM CHARGES DATA ==========
let chargesData = [
  { id: 1, room_type: 'Normal Room', user_type: 'RUB Student/Staff', price: 250 },
  { id: 2, room_type: 'Normal Room', user_type: 'Outside Visitor', price: 350 },
  { id: 3, room_type: 'Executive Room', user_type: 'RUB Student/Staff', price: 500 },
  { id: 4, room_type: 'Executive Room', user_type: 'Outside Visitor', price: 800 },
  { id: 5, room_type: 'Normal Room', user_type: 'International', price: 1600 },
  { id: 6, room_type: 'Executive Room', user_type: 'International', price: 1600 }
];

let nextId = 7;

// ========== HELPER FUNCTIONS ==========
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.alert-message');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `alert-message alert-${type === 'success' ? 'success' : 'error'}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠'}</span><span>${message}</span>`;
  
  const pageBody = document.getElementById('page-body');
  const actionButtons = document.querySelector('.action-buttons');
  if (actionButtons) {
    pageBody.insertBefore(toast, actionButtons);
  } else {
    pageBody.insertBefore(toast, pageBody.firstChild);
  }
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN').format(price);
}

// ========== RENDER FUNCTION ==========
function renderChargesPage() {
  const chargesGrid = document.getElementById('chargesGrid');
  if (!chargesGrid) return;
  
  if (chargesData.length === 0) {
    chargesGrid.innerHTML = '<div class="empty-state"><p>No room charges configured yet. Click "Add New Charge" to get started.</p></div>';
    return;
  }
  
  chargesGrid.innerHTML = chargesData.map(charge => `
    <div class="charge-card" data-id="${charge.id}">
      <div class="room-info">
        <div class="room-name">${escapeHtml(charge.room_type)}</div>
        <div class="user-category">${escapeHtml(charge.user_type)}</div>
      </div>
      <div class="price-input-group">
        <span class="price-currency">Nu.</span>
        <input type="number" class="price-input" value="${charge.price}" min="0" step="50" data-id="${charge.id}" onchange="updateChargePrice(${charge.id}, this.value)">
        <span class="price-unit"></span>
      </div>
      <button class="btn-delete" onclick="deleteCharge(${charge.id})">Remove</button>
    </div>
  `).join('');
}

// ========== UPDATE PRICE ==========
function updateChargePrice(id, newPrice) {
  const charge = chargesData.find(c => c.id === id);
  if (charge) {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      charge.price = price;
      showToast(`Price updated to Nu. ${formatPrice(price)}`, 'success');
    } else {
      showToast('Invalid price value', 'error');
      renderChargesPage();
    }
  }
}

// ========== DELETE CHARGE ==========
function deleteCharge(id) {
  if (confirm('Are you sure you want to remove this charge?')) {
    chargesData = chargesData.filter(c => c.id !== id);
    renderChargesPage();
    showToast('Charge removed successfully', 'success');
  }
}

// ========== ADD NEW CHARGE ==========
function openAddRoomModal() {
  document.getElementById('addRoomModal').classList.add('open');
  document.getElementById('newRoomType').value = '';
  document.getElementById('newUserType').value = '';
  document.getElementById('newPrice').value = '';
}

function closeAddRoomModal() {
  document.getElementById('addRoomModal').classList.remove('open');
}

function addNewCharge() {
  const roomType = document.getElementById('newRoomType').value.trim();
  const userType = document.getElementById('newUserType').value.trim();
  const price = parseFloat(document.getElementById('newPrice').value);
  
  if (!roomType) {
    showToast('Please enter a room type', 'error');
    return;
  }
  
  if (!userType) {
    showToast('Please enter a user category', 'error');
    return;
  }
  
  if (isNaN(price) || price < 0) {
    showToast('Please enter a valid price', 'error');
    return;
  }
  
  // Check if combination already exists
  const exists = chargesData.some(c => 
    c.room_type.toLowerCase() === roomType.toLowerCase() && 
    c.user_type.toLowerCase() === userType.toLowerCase()
  );
  
  if (exists) {
    showToast('This room type and user category combination already exists', 'error');
    return;
  }
  
  const newCharge = {
    id: nextId++,
    room_type: roomType,
    user_type: userType,
    price: price
  };
  
  chargesData.push(newCharge);
  renderChargesPage();
  closeAddRoomModal();
  showToast(`Added ${roomType} for ${userType} at Nu. ${formatPrice(price)}`, 'success');
}

// ========== SAVE ALL CHARGES ==========
function saveAllCharges() {
  // In a real application, this would make an API call
  console.log('Saving charges:', chargesData);
  showToast('All room charges saved successfully!', 'success');
}

// ========== RENDER FULL PAGE ==========
function renderFullPage() {
  const html = `
    <div class="action-buttons">
      <button class="btn-add" onclick="openAddRoomModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add New Charge
      </button>
      <button class="btn-primary" onclick="saveAllCharges()">Save All Charges</button>
    </div>
    
    <div class="charges-grid" id="chargesGrid"></div>
    
    <div class="note-box">
      <h4>⚠️ Important Note</h4>
      <p>These charges are global and apply to all guesthouses across all RUB colleges. Guesthouse managers cannot override these prices. Make sure the prices are correct before saving.</p>
    </div>
  `;
  
  document.getElementById('page-body').innerHTML = html;
  renderChargesPage();
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
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  if (element) element.classList.add('active');
  
  const pageTitles = {
    bookings: ['All Bookings', 'View all guesthouse bookings'],
    charges: ['Room Charges', 'Set standardized room pricing across all guesthouses'],
    guesthouses: ['Guesthouses', 'Manage guesthouse properties'],
    users: ['Users', 'Manage user accounts']
  };
  
  const [title, subtitle] = pageTitles[page] || ['Page', ''];
  document.getElementById('topbar-title').textContent = title;
  document.querySelector('.topbar-subtitle').textContent = subtitle;
  
  if (page === 'charges') {
    renderFullPage();
  } else {
    document.getElementById('page-body').innerHTML = `
      <div class="empty-state">
        <p>${title} — Coming Soon</p>
      </div>
    `;
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
  
  renderFullPage();
  
  document.getElementById('addRoomModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddRoomModal();
  });
}

document.addEventListener('DOMContentLoaded', init);