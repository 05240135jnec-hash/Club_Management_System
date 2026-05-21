// ========== MOCK DATA ==========
const MOCK_GUESTHOUSES = {
  '1': {
    id: 1,
    name: 'JNEC Guesthouse',
    location: 'Jigme Namgyel Engineering College',
    address: 'Dewathang, Samdrup Jongkhar, Bhutan',
    description: 'A guest house is a type of accommodation that provides temporary lodging facilities for guests, travelers, students, staff, and visitors. It is usually smaller and more affordable than hotels, offering basic services such as rooms, food, internet access, and other essential facilities for a comfortable stay. Guest houses are commonly managed by institutions, organizations, or private owners to provide safe and convenient accommodation for visitors.',
    cover_photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    images: [
      { id: 1, image_path: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
      { id: 2, image_path: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800' },
      { id: 3, image_path: 'https://images.unsplash.com/photo-1564501049412-61c2a30805eb?w=800' },
      { id: 4, image_path: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800' }
    ],
    amenities: ['wifi', 'parking', 'laundry', 'ac', 'hot_water', 'heater'],
    // Room data matching your image: NORMAL ROOM and EXECUTIVE ROOM
    rooms: [
      { id: 1, name: 'NORMAL ROOM', status: 'available', available: 15, total: 30 },
      { id: 2, name: 'EXECUTIVE ROOM', status: 'available', available: 6, total: 10 }
    ]
  }
};

const AMENITY_LABELS = {
  wifi: { label: 'High-speed WiFi', icon: 'ti-wifi' },
  parking: { label: 'Free Parking', icon: 'ti-parking' },
  breakfast: { label: 'Complimentary Breakfast', icon: 'ti-coffee' },
  ac: { label: 'Air Conditioning', icon: 'ti-snowflake' },
  hot_water: { label: 'Hot Water', icon: 'ti-droplet' },
  tv: { label: 'TV', icon: 'ti-device-tv' },
  heater: { label: 'Heater', icon: 'ti-temperature' },
  conference: { label: 'Conference Room', icon: 'ti-users' },
  laundry: { label: 'Laundry', icon: 'ti-wash' },
  kitchen: { label: 'Kitchen Access', icon: 'ti-chef-hat' }
};

function getGuesthouseById(id) {
  return MOCK_GUESTHOUSES[id] || MOCK_GUESTHOUSES['1'];
}

function getAllGuesthouses() {
  return Object.values(MOCK_GUESTHOUSES);
}

// Main Component
class GuesthouseDetail {
  constructor(containerId, guesthouseId) {
    this.container = document.getElementById(containerId);
    this.guesthouseId = guesthouseId || '1';
    this.guesthouse = null;
    this.allGuesthouses = [];
    this.selectedImage = null;
    this.scrolled = false;
    this.menuOpen = false;
    this.bookModalOpen = false;
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    this.render();
    this.setupEventListeners();
    this.setupScrollListener();
  }
  
  async loadData() {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.guesthouse = getGuesthouseById(this.guesthouseId);
    this.allGuesthouses = getAllGuesthouses();
    this.selectedImage = this.guesthouse?.cover_photo || this.guesthouse?.images?.[0]?.image_path || null;
  }
  
  setupScrollListener() {
    const handleScroll = () => {
      const newScrolled = window.scrollY > 60;
      if (newScrolled !== this.scrolled) {
        this.scrolled = newScrolled;
        this.updateNavbarStyle();
      }
    };
    window.addEventListener('scroll', handleScroll);
    this.scrollHandler = handleScroll;
  }
  
  updateNavbarStyle() {
    const nav = document.querySelector('.navbar');
    if (nav) {
      if (this.scrolled) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
  }
  
  setupEventListeners() {
    const handleClickOutside = (e) => {
      const menuDropdown = document.querySelector('.menu-dropdown');
      const menuBtn = document.querySelector('.menu-btn');
      if (this.menuOpen && menuDropdown && !menuDropdown.contains(e.target) && !menuBtn?.contains(e.target)) {
        this.menuOpen = false;
        this.render();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    this.clickOutsideHandler = handleClickOutside;
  }
  
  navigateTo(path) {
    if (path === '/') {
      window.location.href = '/';
    } else if (path.startsWith('/guesthouses/')) {
      const newId = path.split('/').pop();
      if (newId && newId !== this.guesthouseId) {
        this.guesthouseId = newId;
        this.loadData().then(() => this.render());
      }
    }
  }
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.render();
  }
  
  openBookModal() {
    this.bookModalOpen = true;
    this.render();
  }
  
  closeBookModal() {
    this.bookModalOpen = false;
    this.render();
  }
  
  changeImage(imagePath) {
    this.selectedImage = imagePath;
    this.render();
  }
  
  renderNavbar() {
    const allGHOptions = this.allGuesthouses.map(gh => `
      <button class="menu-item ${gh.id == this.guesthouse?.id ? 'active' : ''}" data-id="${gh.id}" onclick="window.detailComponent?.navigateTo('/guesthouses/${gh.id}')">
        ${gh.name}
      </button>
    `).join('');
    
    return `
      <nav class="navbar ${this.scrolled ? 'scrolled' : ''}">
        <div class="navbar-left" onclick="window.location.href='/'">
          <div class="navbar-logo">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23c9a84c'/%3E%3Ctext x='50' y='68' font-size='44' text-anchor='middle' fill='%23172D3D' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E" alt="JNEC" />
          </div>
          <span class="navbar-brand">JNEC Guesthouse</span>
        </div>
        <div class="navbar-links">
          <button class="nav-link" onclick="window.location.href='/'">Home</button>
          <button class="nav-link" onclick="document.getElementById('guesthouses-section')?.scrollIntoView({behavior:'smooth'})">Browse</button>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="login-btn" onclick="window.location.href='/login'">Login</button>
          <div style="position: relative;">
            <button class="menu-btn" onclick="window.detailComponent?.toggleMenu()">
              <span></span><span></span><span></span>
            </button>
            ${this.menuOpen ? `
              <div class="menu-dropdown">
                <div class="menu-header"><span>All Guesthouses</span></div>
                ${allGHOptions}
              </div>
            ` : ''}
          </div>
        </div>
      </nav>
    `;
  }
  
  renderGallery() {
    const allImages = [
      ...(this.guesthouse.cover_photo ? [{ id: 'cover', image_path: this.guesthouse.cover_photo }] : []),
      ...(this.guesthouse.images || []),
    ];
    
    const mainImage = this.selectedImage || allImages[0]?.image_path;
    const thumb1 = allImages[1]?.image_path;
    const thumb2 = allImages[2]?.image_path;
    const remainingCount = allImages.length - 3;
    
    return `
      <div class="gallery-grid">
        <div class="gallery-main" onclick="window.detailComponent?.changeImage('${mainImage}')">
          <img src="${mainImage || ''}" alt="${this.guesthouse.name}" />
        </div>
        ${thumb1 ? `
          <div class="gallery-item" onclick="window.detailComponent?.changeImage('${thumb1}')">
            <img src="${thumb1}" alt="" />
          </div>
        ` : '<div class="gallery-item" style="background: linear-gradient(135deg, #e0e4f0, #cbd5e1);"></div>'}
        ${thumb2 ? `
          <div class="gallery-item" onclick="window.detailComponent?.changeImage('${thumb2}')">
            <img src="${thumb2}" alt="" />
            ${remainingCount > 0 ? `<div class="gallery-overlay">+${remainingCount} Photos</div>` : ''}
          </div>
        ` : '<div class="gallery-item" style="background: linear-gradient(135deg, #e0e4f0, #cbd5e1);"></div>'}
      </div>
    `;
  }
  
  // NEW: Render room statistics cards (Normal Room and Executive Room)
  renderRoomStats() {
    const rooms = this.guesthouse.rooms || [];
    
    return `
      <div class="room-stats-section">
        <div class="room-stats-grid">
          ${rooms.map(room => `
            <div class="room-card">
              <div class="room-type">${room.name}</div>
              <div class="room-stats">
                <div class="room-stat">
                  <div class="room-stat-number">${room.available || 0}</div>
                  <div class="room-stat-label">Available</div>
                </div>
                <div class="room-stat">
                  <div class="room-stat-number">${room.total || 0}</div>
                  <div class="room-stat-label">Total rooms</div>
                </div>
              </div>
              <div class="room-divider"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderAmenities() {
    const amenities = this.guesthouse.amenities || [];
    if (amenities.length === 0) return '';
    
    return `
      <div class="section-title">
        <i class="ti-package"></i>
        What this place offers
      </div>
      <div class="amenities-grid">
        ${amenities.map(key => {
          const amenity = AMENITY_LABELS[key] || { label: key, icon: 'ti-check' };
          return `
            <div class="amenity-card">
              <div class="amenity-icon"><i class="${amenity.icon}"></i></div>
              <span class="amenity-label">${amenity.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  renderBookingCard() {
    const rooms = this.guesthouse.rooms || [];
    const totalAvailable = rooms.reduce((sum, r) => sum + (r.available || 0), 0);
    const totalRooms = rooms.reduce((sum, r) => sum + (r.total || 0), 0);
    
    return `
      <div class="booking-card">
        <h3>${this.guesthouse.name}</h3>
        
        <div class="booking-stats">
          <div class="booking-stat-item">
            <span class="booking-stat-label">Total Available Rooms</span>
            <span class="booking-stat-value">${totalAvailable}</span>
          </div>
          <div class="booking-stat-item">
            <span class="booking-stat-label">Total Rooms</span>
            <span class="booking-stat-value">${totalRooms}</span>
          </div>
        </div>
        
        <button class="book-btn" onclick="window.detailComponent?.openBookModal()">
          Book Room
        </button>
        <div class="secure-note">You will not be charged yet</div>
      </div>
    `;
  }
  
  renderModal() {
    if (!this.bookModalOpen) return '';
    
    return `
      <div class="modal-overlay" onclick="window.detailComponent?.closeBookModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Book a Room</h3>
            <button class="modal-close" onclick="window.detailComponent?.closeBookModal()">
              <i class="ti-x" style="color: white; font-size: 18px;"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="modal-icon">🏨</div>
            <h4>Booking Coming Soon</h4>
            <p>The booking form is being set up. Please contact the guesthouse directly or check back soon.</p>
          </div>
          <div class="modal-footer">
            <button onclick="window.detailComponent?.closeBookModal()">Close</button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderMain() {
    return `
      <div class="main-container">
        ${this.renderGallery()}
        
        <div class="two-column">
          <!-- Left Column -->
          <div>
            <h1 class="guesthouse-title">${this.guesthouse.name}</h1>
            <div class="location-info">
              <span class="location-badge"> ${this.guesthouse.location || 'Jigme Namgyel Engineering College'}</span>
              <span class="location-badge"> ${this.guesthouse.address || 'Dewathang, Samdrup Jongkhar'}</span>
            </div>
            
            <div class="divider"></div>
            
            <!-- Description -->
            <div class="section-title">
              <i class="ti-home"></i>
              About this Guesthouse
            </div>
            <p class="description-text">${this.guesthouse.description || 'A guest house is a type of accommodation that provides temporary lodging facilities for guests, travelers, students, staff, and visitors. It is usually smaller and more affordable than hotels, offering basic services such as rooms, food, internet access, and other essential facilities for a comfortable stay.'}</p>
            
            <div class="divider"></div>
            
            <!-- Room Statistics Cards -->
            ${this.renderRoomStats()}
            
            <div class="divider"></div>
            
            <!-- Amenities -->
            ${this.renderAmenities()}
            ${(this.guesthouse.amenities?.length || 0) > 0 ? '<div class="divider"></div>' : ''}
            
            <!-- Map -->
            <div class="section-title">
              <i class="ti-map-pin"></i>
              Where you will be
            </div>
            <div class="map-container">
              <iframe title="map" width="100%" height="280" frameBorder="0" style="display: block;"
                src="https://www.openstreetmap.org/export/embed.html?bbox=91.5,26.8,92.0,27.2&layer=mapnik&marker=26.9,91.7">
              </iframe>
            </div>
            <div class="map-address">
              <i class="ti-location-pin" style="color: #c9a84c;"></i>
              <span>${this.guesthouse.address || this.guesthouse.location || 'Dewathang, Samdrup Jongkhar, Bhutan'}</span>
            </div>
          </div>
          
          <!-- Right Column - Booking Card -->
          ${this.renderBookingCard()}
        </div>
      </div>
    `;
  }
  
  render() {
    if (!this.guesthouse) {
      this.container.innerHTML = `
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
      `;
      return;
    }
    
    const html = `
      ${this.renderNavbar()}
      ${this.renderMain()}
      <footer class="footer">
        <span class="footer-text">© JNEC Guesthouse Booking System</span>
        <span class="footer-text">Jigme Namgyel Engineering College · Dewathang, Samdrup Jongkhar</span>
      </footer>
      ${this.renderModal()}
    `;
    
    this.container.innerHTML = html;
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const guesthouseId = urlParams.get('id') || '1';
  window.detailComponent = new GuesthouseDetail('root', guesthouseId);
});