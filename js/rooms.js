// ========== ROOM STATUS STYLES ==========
const statusStyles = {
  available: { bg: '#d1fae5', color: '#065f46', dot: '#10b981', label: 'Available', border: '#a7f3d0' },
  partial:   { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', label: 'Partial',    border: '#fde68a' },
  occupied:  { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Occupied',   border: '#fecaca' },
  maintenance: { bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af', label: 'Maintenance', border: '#e5e7eb' }
};

const floorOptions = [
  { value: '1', label: 'Ground Floor', prefix: 'GF' },
  { value: '2', label: 'First Floor',  prefix: 'FF' },
  { value: '3', label: 'Second Floor', prefix: 'SF' },
  { value: '4', label: 'Third Floor',  prefix: 'TF' }
];

const amenityOptions = ['WiFi', 'Attached bath', 'AC', 'TV', 'Hot water', 'Heater', 'Parking'];

// ========== MOCK DATA ==========
let roomsData = [
  { id: 1, floor_number: 1, room_number: '1', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 2, floor_number: 1, room_number: '2', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 3, floor_number: 1, room_number: '3', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 4, floor_number: 1, room_number: '4', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 5, floor_number: 1, room_number: '5', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 6, floor_number: 1, room_number: '6', room_type: 'executive', total_beds: 2, status: 'available', booking_status: 'partial', booked_beds: 1, free_beds: 1, bed_bookings: [{ guest_name: 'Karma Wangchuk', check_in: '2026-05-16', check_out: '2026-05-18', num_guests: 1, is_active: false }] },
  { id: 7, floor_number: 1, room_number: '7', room_type: 'executive', total_beds: 2, status: 'maintenance', booking_status: 'maintenance', booked_beds: 0, free_beds: 0, bed_bookings: [] },
  { id: 8, floor_number: 2, room_number: '1', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'partial', booked_beds: 1, free_beds: 2, bed_bookings: [] },
  { id: 9, floor_number: 2, room_number: '2', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 10, floor_number: 2, room_number: '3', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 11, floor_number: 2, room_number: '4', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 12, floor_number: 2, room_number: '5', room_type: 'normal', total_beds: 3, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 3, bed_bookings: [] },
  { id: 13, floor_number: 2, room_number: '6', room_type: 'executive', total_beds: 2, status: 'available', booking_status: 'partial', booked_beds: 1, free_beds: 1, bed_bookings: [] },
  { id: 14, floor_number: 2, room_number: '7', room_type: 'executive', total_beds: 2, status: 'available', booking_status: 'available', booked_beds: 0, free_beds: 2, bed_bookings: [] }
];

let nextId = 15;
let currentEditRoom = null;
let currentDeleteRoom = null;
let openMenuId = null;

// Add form state
let addForm = {
  floor_number: '1',
  num_rooms: '1',
  room_type: 'normal',
  total_beds: '2',
  status: 'available',
  amenities: []
};

let editForm = {
  floor_number: '1',
  room_number: '',
  room_type: 'normal',
  total_beds: '2',
  status: 'available',
  amenities: []
};

// ========== HELPER FUNCTIONS ==========
function setTopbarDate() {
  const dateEl = document.getElementById('topbarDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.alert-message');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `alert-message alert-${type === 'success' ? 'success' : 'error'}`;
  toast.innerHTML = `${type === 'success' ? '✓' : '⚠'} ${message}`;
  
  const pageBody = document.getElementById('page-body');
  pageBody.insertBefore(toast, pageBody.firstChild);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function updateAddPreview() {
  const floor = floorOptions.find(f => f.value === addForm.floor_number);
  const prefix = floor?.prefix || 'GF';
  const count = parseInt(addForm.num_rooms) || 0;
  const existingNumbers = roomsData.filter(r => String(r.floor_number) === addForm.floor_number).map(r => parseInt(r.room_number));
  const start = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  
  const preview = Array.from({ length: count }, (_, i) => ({
    label: `${prefix}-${start + i}`,
    room_num: String(start + i)
  }));
  
  const previewDiv = document.getElementById('previewList');
  const previewCount = document.getElementById('previewCount');
  if (previewDiv) {
    if (preview.length > 0) {
      previewDiv.innerHTML = preview.map(p => `<span class="preview-tag">${p.label} · ${addForm.total_beds} bed${parseInt(addForm.total_beds) > 1 ? 's' : ''}</span>`).join('');
    } else {
      previewDiv.innerHTML = '<span style="color:#9aa6b5;">No rooms to preview</span>';
    }
  }
  if (previewCount) previewCount.textContent = count;
}

function toggleAmenity(amenity, isEdit = false) {
  if (isEdit) {
    if (editForm.amenities.includes(amenity)) {
      editForm.amenities = editForm.amenities.filter(a => a !== amenity);
    } else {
      editForm.amenities.push(amenity);
    }
    renderEditModal();
  } else {
    if (addForm.amenities.includes(amenity)) {
      addForm.amenities = addForm.amenities.filter(a => a !== amenity);
    } else {
      addForm.amenities.push(amenity);
    }
    renderAddModal();
  }
}

// ========== RENDER MAIN PAGE ==========
function renderMainPage() {
  const totalRooms = roomsData.length;
  const totalBeds = roomsData.reduce((sum, r) => sum + r.total_beds, 0);
  const available = roomsData.filter(r => r.booking_status === 'available').length;
  const partial = roomsData.filter(r => r.booking_status === 'partial').length;
  const occupied = roomsData.filter(r => r.booking_status === 'occupied').length;
  const maintenance = roomsData.filter(r => r.status === 'maintenance' || r.booking_status === 'maintenance').length;
  
  const roomsByFloor = {};
  roomsData.forEach(room => {
    const key = String(room.floor_number);
    if (!roomsByFloor[key]) roomsByFloor[key] = [];
    roomsByFloor[key].push(room);
  });
  
  const html = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value">${totalRooms}</div><div class="stat-label">Total Rooms</div></div>
      <div class="stat-card"><div class="stat-value">${totalBeds}</div><div class="stat-label">Total Beds</div></div>
      <div class="stat-card"><div class="stat-value">${available}</div><div class="stat-label">Available</div></div>
      <div class="stat-card"><div class="stat-value">${partial}</div><div class="stat-label">Partial</div></div>
      <div class="stat-card"><div class="stat-value">${occupied}</div><div class="stat-label">Occupied</div></div>
      <div class="stat-card"><div class="stat-value">${maintenance}</div><div class="stat-label">Maintenance</div></div>
    </div>
    
    <div class="section-header">
      <div><span class="section-title">All Rooms</span><span class="section-count">(${totalRooms})</span></div>
      <button class="btn-add" onclick="openAddRoomsModal()">+ Add Rooms</button>
    </div>
    
    <div class="legend">
      <div class="legend-item"><span class="legend-dot" style="background:#10b981"></span><span class="legend-label">Available</span></div>
      <div class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span><span class="legend-label">Partial</span></div>
      <div class="legend-item"><span class="legend-dot" style="background:#dc2626"></span><span class="legend-label">Occupied</span></div>
      <div class="legend-item"><span class="legend-dot" style="background:#9ca3af"></span><span class="legend-label">Maintenance</span></div>
      <div class="legend-hint">Click a Partial room to see bed details</div>
    </div>
    
    ${Object.keys(roomsByFloor).sort().map(floorKey => {
      const floorRooms = roomsByFloor[floorKey];
      const floor = floorOptions.find(f => f.value === floorKey);
      const prefix = floor?.prefix || 'GF';
      const floorLabel = floor?.label || `Floor ${floorKey}`;
      
      return `
        <div class="floor-section">
          <div class="floor-header">
            <div class="floor-title">${floorLabel}</div>
            <span class="floor-count">${floorRooms.length} room${floorRooms.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="rooms-grid">
            ${floorRooms.sort((a,b) => parseInt(a.room_number) - parseInt(b.room_number)).map(room => {
              const status = room.booking_status || room.status;
              const ss = statusStyles[status] || statusStyles.available;
              const isClickable = status === 'partial' || status === 'occupied';
              const isPartial = status === 'partial';
              const isMaintenance = status === 'maintenance';
              
              return `
                <div class="room-card ${isClickable && !isMaintenance ? 'clickable' : ''}" style="--border-color:${ss.border}" onclick="${isClickable && !isMaintenance ? `openBedDetailsModal(${room.id})` : 'return false'}">
                  <div class="three-dot-menu" onclick="event.stopPropagation()">
                    <button class="menu-btn" onclick="toggleMenu(${room.id}, event)">•••</button>
                    <div id="menu-${room.id}" class="menu-dropdown" style="display:none">
                      <button class="menu-item edit" onclick="openEditRoomModal(${room.id}); closeMenu(${room.id})">Edit Room</button>
                      <button class="menu-item delete" onclick="openDeleteModal(${room.id}); closeMenu(${room.id})">Delete Room</button>
                    </div>
                  </div>
                  <div class="room-number">${prefix}-${room.room_number}</div>
                  <span class="room-type-badge ${room.room_type === 'executive' ? 'room-type-executive' : 'room-type-normal'}">${room.room_type === 'executive' ? 'Executive' : 'Normal'}</span>
                  <div class="room-beds">${isPartial ? `<strong>${room.booked_beds || 0}</strong> / ${room.total_beds} beds booked` : isMaintenance ? 'Under Maintenance' : `${room.total_beds} bed${room.total_beds > 1 ? 's' : ''}`}</div>
                  <div class="status-badge"><span class="status-dot" style="background:${ss.dot}"></span>${ss.label}</div>
                  ${isPartial ? `<span class="free-badge">${room.free_beds} free</span>` : ''}
                  ${isClickable && !isMaintenance ? `<div class="click-hint">Click to view bed details</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')}
  `;
  
  document.getElementById('page-body').innerHTML = html;
}

// ========== MENU FUNCTIONS ==========
function toggleMenu(roomId, event) {
  event.stopPropagation();
  const menu = document.getElementById(`menu-${roomId}`);
  if (openMenuId && openMenuId !== roomId) {
    const prevMenu = document.getElementById(`menu-${openMenuId}`);
    if (prevMenu) prevMenu.style.display = 'none';
  }
  if (menu.style.display === 'none' || menu.style.display === '') {
    menu.style.display = 'block';
    openMenuId = roomId;
  } else {
    menu.style.display = 'none';
    openMenuId = null;
  }
}

function closeMenu(roomId) {
  const menu = document.getElementById(`menu-${roomId}`);
  if (menu) menu.style.display = 'none';
  if (openMenuId === roomId) openMenuId = null;
}

// ========== ADD ROOMS ==========
function openAddRoomsModal() {
  addForm = {
    floor_number: '1',
    num_rooms: '1',
    room_type: 'normal',
    total_beds: '2',
    status: 'available',
    amenities: []
  };
  renderAddModal();
  document.getElementById('addRoomsModal').classList.add('open');
}

function renderAddModal() {
  const html = `
    <div class="form-row">
      <div class="form-group">
        <label>Floor</label>
        <select id="addFloor" class="form-select" onchange="updateAddForm('floor_number', this.value); updateAddPreview()">
          ${floorOptions.map(f => `<option value="${f.value}" ${addForm.floor_number === f.value ? 'selected' : ''}>${f.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Number of Rooms</label>
        <input type="number" id="addNumRooms" class="form-input" value="${addForm.num_rooms}" min="1" max="20" onchange="updateAddForm('num_rooms', this.value); updateAddPreview()">
      </div>
      <div class="form-group">
        <label>Room Type</label>
        <select id="addRoomType" class="form-select" onchange="updateAddForm('room_type', this.value)">
          <option value="normal" ${addForm.room_type === 'normal' ? 'selected' : ''}>Normal Room</option>
          <option value="executive" ${addForm.room_type === 'executive' ? 'selected' : ''}>Executive Room</option>
        </select>
      </div>
      <div class="form-group">
        <label>Beds per Room</label>
        <select id="addTotalBeds" class="form-select" onchange="updateAddForm('total_beds', this.value); updateAddPreview()">
          ${[1,2,3,4,5].map(n => `<option value="${n}" ${addForm.total_beds === String(n) ? 'selected' : ''}>${n} bed${n > 1 ? 's' : ''}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="addStatus" class="form-select" onchange="updateAddForm('status', this.value)">
        <option value="available" ${addForm.status === 'available' ? 'selected' : ''}>Available</option>
        <option value="maintenance" ${addForm.status === 'maintenance' ? 'selected' : ''}>Under Maintenance</option>
      </select>
    </div>
    <div class="form-group">
      <label>Amenities</label>
      <div class="amenities-group" id="addAmenities"></div>
    </div>
    <div class="preview-box">
      <div class="preview-title">Preview — <span id="previewCount">${addForm.num_rooms}</span> rooms</div>
      <div class="preview-list" id="previewList"></div>
    </div>
  `;
  
  document.getElementById('addRoomsBody').innerHTML = html;
  
  const amenitiesDiv = document.getElementById('addAmenities');
  if (amenitiesDiv) {
    amenitiesDiv.innerHTML = amenityOptions.map(a => `
      <div class="amenity-chip ${addForm.amenities.includes(a) ? 'selected' : ''}" onclick="toggleAmenity('${a}', false)">${a}</div>
    `).join('');
  }
  
  updateAddPreview();
}

function updateAddForm(field, value) {
  addForm[field] = value;
  renderAddModal();
}

function submitAddRooms() {
  const count = parseInt(addForm.num_rooms);
  if (!count || count < 1) {
    showToast('Please enter a valid number of rooms', 'error');
    return;
  }
  
  const floor = floorOptions.find(f => f.value === addForm.floor_number);
  const existingNumbers = roomsData.filter(r => String(r.floor_number) === addForm.floor_number).map(r => parseInt(r.room_number));
  const start = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  
  for (let i = 0; i < count; i++) {
    const roomNum = String(start + i);
    roomsData.push({
      id: nextId++,
      floor_number: parseInt(addForm.floor_number),
      room_number: roomNum,
      room_type: addForm.room_type,
      total_beds: parseInt(addForm.total_beds),
      status: addForm.status,
      booking_status: addForm.status === 'maintenance' ? 'maintenance' : 'available',
      booked_beds: 0,
      free_beds: addForm.status === 'maintenance' ? 0 : parseInt(addForm.total_beds),
      bed_bookings: []
    });
  }
  
  closeAddRoomsModal();
  renderMainPage();
  showToast(`${count} room${count > 1 ? 's' : ''} created successfully!`, 'success');
}

function closeAddRoomsModal() {
  document.getElementById('addRoomsModal').classList.remove('open');
}

// ========== EDIT ROOM ==========
function openEditRoomModal(roomId) {
  const room = roomsData.find(r => r.id === roomId);
  if (!room) return;
  
  currentEditRoom = room;
  editForm = {
    floor_number: String(room.floor_number),
    room_number: room.room_number,
    room_type: room.room_type,
    total_beds: String(room.total_beds),
    status: room.status,
    amenities: []
  };
  
  renderEditModal();
  document.getElementById('editRoomModal').classList.add('open');
}

function renderEditModal() {
  const html = `
    <div class="form-row">
      <div class="form-group">
        <label>Floor</label>
        <select id="editFloor" class="form-select" onchange="updateEditForm('floor_number', this.value)">
          ${floorOptions.map(f => `<option value="${f.value}" ${editForm.floor_number === f.value ? 'selected' : ''}>${f.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Room Number</label>
        <input type="text" id="editRoomNumber" class="form-input" value="${editForm.room_number}" onchange="updateEditForm('room_number', this.value)">
      </div>
      <div class="form-group">
        <label>Room Type</label>
        <select id="editRoomType" class="form-select" onchange="updateEditForm('room_type', this.value)">
          <option value="normal" ${editForm.room_type === 'normal' ? 'selected' : ''}>Normal Room</option>
          <option value="executive" ${editForm.room_type === 'executive' ? 'selected' : ''}>Executive Room</option>
        </select>
      </div>
      <div class="form-group">
        <label>Number of Beds</label>
        <select id="editTotalBeds" class="form-select" onchange="updateEditForm('total_beds', this.value)">
          ${[1,2,3,4,5].map(n => `<option value="${n}" ${editForm.total_beds === String(n) ? 'selected' : ''}>${n} bed${n > 1 ? 's' : ''}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Room Status</label>
      <select id="editStatus" class="form-select" onchange="updateEditForm('status', this.value)">
        <option value="available" ${editForm.status === 'available' ? 'selected' : ''}>Available</option>
        <option value="maintenance" ${editForm.status === 'maintenance' ? 'selected' : ''}>Under Maintenance</option>
      </select>
    </div>
    <div class="form-group">
      <label>Amenities</label>
      <div class="amenities-group" id="editAmenities"></div>
    </div>
  `;
  
  document.getElementById('editRoomBody').innerHTML = html;
  
  const amenitiesDiv = document.getElementById('editAmenities');
  if (amenitiesDiv) {
    amenitiesDiv.innerHTML = amenityOptions.map(a => `
      <div class="amenity-chip ${editForm.amenities.includes(a) ? 'selected' : ''}" onclick="toggleAmenity('${a}', true)">${a}</div>
    `).join('');
  }
}

function updateEditForm(field, value) {
  editForm[field] = value;
  renderEditModal();
}

function saveEditRoom() {
  if (currentEditRoom) {
    currentEditRoom.floor_number = parseInt(editForm.floor_number);
    currentEditRoom.room_number = editForm.room_number;
    currentEditRoom.room_type = editForm.room_type;
    currentEditRoom.total_beds = parseInt(editForm.total_beds);
    currentEditRoom.status = editForm.status;
    currentEditRoom.booking_status = editForm.status === 'maintenance' ? 'maintenance' : (currentEditRoom.booked_beds > 0 ? 'partial' : 'available');
    currentEditRoom.free_beds = editForm.status === 'maintenance' ? 0 : (currentEditRoom.total_beds - (currentEditRoom.booked_beds || 0));
    
    closeEditRoomModal();
    renderMainPage();
    showToast(`Room ${editForm.room_number} updated successfully!`, 'success');
  }
}

function closeEditRoomModal() {
  document.getElementById('editRoomModal').classList.remove('open');
  currentEditRoom = null;
}

// ========== DELETE ROOM ==========
function openDeleteModal(roomId) {
  currentDeleteRoom = roomsData.find(r => r.id === roomId);
  if (currentDeleteRoom) {
    document.getElementById('deleteMessage').innerHTML = `Are you sure you want to delete <strong>Room ${currentDeleteRoom.room_number}</strong>? This cannot be undone.`;
    document.getElementById('deleteModal').classList.add('open');
  }
}

function confirmDelete() {
  if (currentDeleteRoom) {
    roomsData = roomsData.filter(r => r.id !== currentDeleteRoom.id);
    closeDeleteModal();
    renderMainPage();
    showToast(`Room ${currentDeleteRoom.room_number} deleted successfully!`, 'success');
    currentDeleteRoom = null;
  }
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
  currentDeleteRoom = null;
}

// ========== BED DETAILS MODAL ==========
function openBedDetailsModal(roomId) {
  const room = roomsData.find(r => r.id === roomId);
  if (!room) return;
  
  const floor = floorOptions.find(f => f.value === String(room.floor_number));
  const prefix = floor?.prefix || 'GF';
  const roomLabel = `${prefix}-${room.room_number}`;
  const bookedBeds = room.booked_beds || 0;
  const freeBeds = room.free_beds || (room.total_beds - bookedBeds);
  
  document.getElementById('bedModalTitle').innerHTML = `${roomLabel} — Bed Details`;
  
  let bedHtml = `
    <div class="stats-summary">
      <div class="stat-summary-card"><div class="stat-summary-value" style="color:#172D3D">${room.total_beds}</div><div class="stat-summary-label">Total Beds</div></div>
      <div class="stat-summary-card"><div class="stat-summary-value" style="color:#b91c1c">${bookedBeds}</div><div class="stat-summary-label">Booked Beds</div></div>
      <div class="stat-summary-card"><div class="stat-summary-value" style="color:#065f46">${freeBeds}</div><div class="stat-summary-label">Free Beds</div></div>
    </div>
    
    <div class="preview-title">Bed Layout</div>
    <div class="bed-grid">
  `;
  
  for (let i = 0; i < room.total_beds; i++) {
    const isBooked = i < bookedBeds;
    bedHtml += `
      <div class="bed-card ${isBooked ? 'booked' : 'free'}">
        <div class="bed-number">Bed ${i + 1}</div>
        <div class="bed-status" style="color:${isBooked ? '#b91c1c' : '#065f46'}">${isBooked ? 'Booked' : 'Free'}</div>
      </div>
    `;
  }
  
  bedHtml += `</div>`;
  
  if (room.bed_bookings && room.bed_bookings.length > 0) {
    bedHtml += `<div class="preview-title">Current Bookings</div><div class="bookings-list">`;
    room.bed_bookings.forEach(b => {
      bedHtml += `
        <div class="booking-item" style="border-color:${b.is_active ? '#fecaca' : '#fde68a'}; background:${b.is_active ? '#fff5f5' : '#fffbeb'}">
          <div class="booking-name">${b.guest_name}</div>
          <div class="booking-dates">${formatDate(b.check_in)} → ${formatDate(b.check_out)} · ${b.num_guests} bed${b.num_guests > 1 ? 's' : ''}</div>
        </div>
      `;
    });
    bedHtml += `</div>`;
  }
  
  if (freeBeds > 0 && room.status !== 'maintenance') {
    bedHtml += `<div class="available-message">✓ ${freeBeds} bed${freeBeds > 1 ? 's' : ''} still available — guests can book this room</div>`;
  }
  
  document.getElementById('bedDetailsBody').innerHTML = bedHtml;
  document.getElementById('bedDetailsModal').classList.add('open');
}

function closeBedDetailsModal() {
  document.getElementById('bedDetailsModal').classList.remove('open');
}

// ========== NAVIGATION ==========
function navigateTo(page, element) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (element) element.classList.add('active');
  
  if (page === 'rooms') {
    renderMainPage();
  }
}

// ========== INITIALIZATION ==========
function init() {
  setTopbarDate();
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) navigateTo(page, item);
    });
  });
  
  renderMainPage();
  
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        modal.classList.remove('open');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', init);