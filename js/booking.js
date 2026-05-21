// ========== CONSTANTS ==========
const PURPOSES = ['Academic visit / Research', 'Conference / Workshop', 'Official college business', 'Tourism / Personal', 'Other'];
const BANK_APPS = ['BOB mPay', 'BNBL mConnect', 'BIB ePay', 'Druk PNB', 'T-Bank', 'Other'];
const SERVICE_CHARGE = 35;

// ========== MOCK DATA ==========
const MOCK_GUESTHOUSES = {
  '1': {
    id: 1,
    name: 'JNEC Guesthouse',
    location: 'Jigme Namgyel Engineering College',
    address: 'Dewathang, Samdrup Jongkhar, Bhutan',
    description: 'A guest house providing temporary lodging facilities for guests, travelers, students, staff, and visitors.',
    cover_photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
  }
};

function getGuesthouseById(id) {
  return MOCK_GUESTHOUSES[id] || MOCK_GUESTHOUSES['1'];
}

// ========== MAIN COMPONENT ==========
class BookingForm {
  constructor(containerId, guesthouseId) {
    this.container = document.getElementById(containerId);
    this.guesthouseId = guesthouseId || '1';
    this.guesthouse = null;
    this.loading = true;
    this.scrolled = false;
    this.step = 1;
    this.error = '';
    this.paying = false;
    this.payError = '';
    this.done = false;
    
    // Form state
    this.form = { checkin: '', checkout: '', num_beds: '1', room_type: 'normal', purpose: PURPOSES[0] };
    this.bhutaneseOpen = false;
    this.subType = '';
    this.intlOpen = false;
    
    // Verification states
    this.studentId = '';
    this.studentVerify = null;
    this.studentData = null;
    this.staffId = '';
    this.staffVerify = null;
    this.staffData = null;
    this.cid = '';
    this.cidVerify = null;
    this.cidData = null;
    
    // International guest
    this.intlForm = { name: '', nationality: '', passport: '', phone: '' };
    
    // Guest info
    this.guestInfo = { name: '', email: '', phone: '', notes: '' };
    
    // Payment
    this.payForm = { bank_app: 'BOB mPay', account: '' };
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    this.render();
    this.setupScrollListener();
  }
  
  async loadData() {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.guesthouse = getGuesthouseById(this.guesthouseId);
    this.loading = false;
  }
  
  setupScrollListener() {
    const handleScroll = () => {
      const newScrolled = window.scrollY > 40;
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
  
  // Helper methods
  getNights() {
    if (!this.form.checkin || !this.form.checkout) return 0;
    return Math.max(0, Math.round((new Date(this.form.checkout) - new Date(this.form.checkin)) / 86400000));
  }
  
  getGuestTypeKey() {
    if (this.intlOpen) return 'international';
    return this.subType || '';
  }
  
  isVerified() {
    if (this.intlOpen) {
      return this.intlForm.name && this.intlForm.passport && this.intlForm.nationality;
    }
    if (this.subType === 'rub_student') return this.studentVerify === 'verified';
    if (this.subType === 'rub_staff') return this.staffVerify === 'verified';
    if (this.subType === 'non_rub') return this.cidVerify === 'verified';
    return false;
  }
  
  getGuestTypeLabel() {
    if (this.intlOpen) return 'International Guest';
    if (this.subType === 'rub_student') return 'RUB Student';
    if (this.subType === 'rub_staff') return 'RUB Staff';
    if (this.subType === 'non_rub') return 'Non-RUB Bhutanese';
    return 'Not Selected';
  }
  
  // Step validations
  step1Valid() {
    if (!this.form.checkin) { this.error = 'Please select a check-in date.'; return false; }
    if (!this.form.checkout) { this.error = 'Please select a check-out date.'; return false; }
    if (this.getNights() <= 0) { this.error = 'Check-out must be after check-in.'; return false; }
    if (!this.getGuestTypeKey()) { this.error = 'Please select a guest category.'; return false; }
    if (!this.isVerified()) { this.error = 'Please complete verification for your guest category.'; return false; }
    this.error = '';
    return true;
  }
  
  step2Valid() {
    if (!this.guestInfo.name.trim()) { this.error = 'Please enter your full name.'; return false; }
    if (!this.guestInfo.email.trim()) { this.error = 'Please enter your email address.'; return false; }
    if (!this.guestInfo.email.includes('@')) { this.error = 'Please enter a valid email address.'; return false; }
    this.error = '';
    return true;
  }
  
  // Navigation
  nextStep() {
    if (this.step === 1 && this.step1Valid()) this.step = 2;
    else if (this.step === 2 && this.step2Valid()) this.step = 3;
    else if (this.step === 3) this.step = 4;
    this.render();
  }
  
  prevStep() {
    if (this.step > 1) this.step--;
    this.error = '';
    this.render();
  }
  
  // Verification functions
  async verifyStudentId() {
    if (!this.studentId.trim()) return;
    this.studentVerify = 'loading';
    this.render();
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (this.studentId === 'S001' || this.studentId === '2021001' || this.studentId === 'RUB2024001') {
      this.studentData = { name: 'Kinley Dorji', college: 'Jigme Namgyel Engineering College', program: 'BSc in Information Technology', year: 3 };
      this.studentVerify = 'verified';
      this.guestInfo.name = this.guestInfo.name || this.studentData.name;
    } else {
      this.studentVerify = 'error';
      this.studentData = null;
    }
    this.render();
  }
  
  async verifyStaffId() {
    if (!this.staffId.trim()) return;
    this.staffVerify = 'loading';
    this.render();
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (this.staffId === 'L001' || this.staffId === 'EMP001' || this.staffId === 'RUB-STAFF-001') {
      this.staffData = { name: 'Dr. Karma Tenzin', college: 'Jigme Namgyel Engineering College', designation: 'Associate Professor, Department of Computer Science' };
      this.staffVerify = 'verified';
      this.guestInfo.name = this.guestInfo.name || this.staffData.name;
    } else {
      this.staffVerify = 'error';
      this.staffData = null;
    }
    this.render();
  }
  
  async verifyCid() {
    if (!this.cid.trim()) return;
    this.cidVerify = 'loading';
    this.render();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (this.cid.length >= 10) {
      this.cidData = { name: 'Pema Lhamo Wangmo', dob: '1995-03-15', dzongkhag: 'Thimphu', village: 'Kawajangsa' };
      this.cidVerify = 'verified';
      this.guestInfo.name = this.guestInfo.name || this.cidData.name;
    } else {
      this.cidVerify = 'error';
      this.cidData = null;
    }
    this.render();
  }
  
  async handlePayment() {
    if (!this.payForm.account.trim()) {
      this.payError = 'Please enter your account number.';
      this.render();
      return;
    }
    
    this.paying = true;
    this.render();
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.done = true;
    this.paying = false;
    this.render();
  }
  
  // UI Helpers
  getMinDate() {
    return new Date().toISOString().split('T')[0];
  }
  
  getStepStatus(stepNum) {
    if (this.step > stepNum) return 'completed';
    if (this.step === stepNum) return 'active';
    return 'pending';
  }
  
  renderVerifyBadge(status, successMsg, errorMsg, loadingMsg = 'Verifying with database...') {
    if (!status) return '';
    if (status === 'verified') {
      return `<div class="verify-badge success">✓ ${successMsg}</div>`;
    }
    if (status === 'error') {
      return `<div class="verify-badge error">✗ ${errorMsg}</div>`;
    }
    return `<div class="verify-badge loading">◌ ${loadingMsg}</div>`;
  }
  
  renderNavbar() {
    return `
      <nav class="navbar ${this.scrolled ? 'scrolled' : ''}">
        <div class="navbar-left">
          <div class="navbar-logo">R</div>
          <span class="navbar-brand">RUB GuestHouse</span>
          <span class="navbar-guesthouse">${this.guesthouse?.name || ''}</span>
        </div>
        <div class="navbar-right">
          <button class="back-btn" onclick="window.bookingApp?.goBack()">
            ←
            <span>Back to Guesthouse</span>
          </button>
        </div>
      </nav>
    `;
  }
  
  renderStepBar() {
    const steps = [
      { num: 1, label: 'Stay & Category' },
      { num: 2, label: 'Guest Information' },
      { num: 3, label: 'Review Booking' },
      { num: 4, label: 'Payment' }
    ];
    
    return `
      <div class="step-bar">
        ${steps.map((step, idx) => {
          const status = this.getStepStatus(step.num);
          return `
            <div class="step-item">
              <div class="step-number ${status}">
                ${status === 'completed' ? '✓' : step.num}
              </div>
              <div class="step-label ${status}">${step.label}</div>
              ${idx < steps.length - 1 ? `<div class="step-connector ${status === 'completed' ? 'completed' : 'pending'}"></div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  renderError() {
    if (!this.error) return '';
    return `<div class="error-message">⚠ ${this.error}</div>`;
  }
  
  renderSuccess() {
    return `
      <div class="success-container">
        ${this.renderNavbar()}
        <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:24px;">
          <div class="success-card">
            <div class="success-icon">✓</div>
            <h2 class="success-title">Booking Confirmed!</h2>
            <p class="success-text">Your booking at <strong>${this.guesthouse?.name}</strong> has been successfully confirmed. A confirmation email has been sent to <strong>${this.guestInfo.email}</strong>.</p>
            <button class="btn-primary" onclick="window.bookingApp?.goBack()">Back to Guesthouse</button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderStep1() {
    const nights = this.getNights();
    const isVerified = this.isVerified();
    
    return `
      <div class="form-card">
        <div class="card-header">
          
          <div>
            <div class="card-title">Stay Details</div>
            <div class="card-subtitle">Tell us about your stay</div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">College</label>
          <div class="form-input" style="background:#f8fafc; border-color:#e2e8f0; color:#1a2a3a; font-weight:500;">${this.guesthouse?.location || this.guesthouse?.name || '—'}</div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Check-in Date</label>
            <input type="date" class="form-input" value="${this.form.checkin}" min="${this.getMinDate()}" onchange="window.bookingApp?.updateForm('checkin', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Check-out Date</label>
            <input type="date" class="form-input" value="${this.form.checkout}" min="${this.form.checkin || this.getMinDate()}" onchange="window.bookingApp?.updateForm('checkout', this.value)">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Number of Beds</label>
            <input type="number" class="form-input" min="1" max="10" value="${this.form.num_beds}" onchange="window.bookingApp?.updateForm('num_beds', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Room Type</label>
            <select class="form-select" onchange="window.bookingApp?.updateForm('room_type', this.value)">
              <option value="normal" ${this.form.room_type === 'normal' ? 'selected' : ''}>Standard Room</option>
              <option value="executive" ${this.form.room_type === 'executive' ? 'selected' : ''}>Executive Room</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Purpose of Visit</label>
          <select class="form-select" onchange="window.bookingApp?.updateForm('purpose', this.value)">
            ${PURPOSES.map(p => `<option value="${p}" ${this.form.purpose === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div class="form-card">
        <div class="card-header">
         
          <div>
            <div class="card-title">Guest Category</div>
            <div class="card-subtitle">Select your guest type</div>
          </div>
        </div>
        
        <!-- Bhutanese Option -->
        <div class="category-box ${this.bhutaneseOpen ? 'active' : ''}" onclick="window.bookingApp?.toggleBhutanese()">
          <div class="category-header">
            <div class="category-radio ${this.bhutaneseOpen ? 'selected' : ''}"></div>
            <div class="category-icon"></div>
            <div class="category-info">
              <h4>Bhutanese Citizen</h4>
              <p>RUB Student · RUB Staff · Non-RUB Citizen</p>
            </div>
          </div>
          
          ${this.bhutaneseOpen ? `
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e8edf2;">
              <div style="font-size: 12px; font-weight: 600; color: #1a2a3a; margin-bottom: 14px;">SELECT YOUR CATEGORY</div>
              
              <!-- RUB Student -->
              <div class="subtype-option ${this.subType === 'rub_student' ? 'selected' : ''}" onclick="event.stopPropagation(); window.bookingApp?.setSubType('rub_student')">
                <div class="subtype-header">
                  <div class="subtype-radio ${this.subType === 'rub_student' ? 'selected' : ''}"></div>
                  <span class="subtype-title">RUB Student</span>
                  <span class="subtype-badge">Student ID required</span>
                </div>
                ${this.subType === 'rub_student' ? `
                  <div class="verify-input-group">
                    <input type="text" class="form-input" value="${this.studentId}" placeholder="Enter your Student ID" oninput="window.bookingApp?.setStudentId(this.value)">
                    <button class="verify-btn" onclick="event.stopPropagation(); window.bookingApp?.verifyStudentId()" ${this.studentVerify === 'loading' ? 'disabled' : ''}>${this.studentVerify === 'loading' ? 'Verifying...' : 'Verify ID'}</button>
                  </div>
                  ${this.renderVerifyBadge(this.studentVerify, `Verified: ${this.studentData?.name}`, 'Student ID not found. Please check and try again.')}
                  ${this.studentVerify === 'verified' && this.studentData ? `
                    <div class="verified-card">
                      <div class="verified-header">RUB VERIFIED STUDENT</div>
                      <div class="verified-body">
                        <div class="verified-name">${this.studentData.name}</div>
                        <div class="verified-details">${this.studentData.college} · ${this.studentData.program} · Year ${this.studentData.year}</div>
                      </div>
                    </div>
                  ` : ''}
                ` : ''}
              </div>
              
              <!-- RUB Staff -->
              <div class="subtype-option ${this.subType === 'rub_staff' ? 'selected' : ''}" onclick="event.stopPropagation(); window.bookingApp?.setSubType('rub_staff')">
                <div class="subtype-header">
                  <div class="subtype-radio ${this.subType === 'rub_staff' ? 'selected' : ''}"></div>
                  <span class="subtype-title">RUB Staff / Faculty</span>
                  <span class="subtype-badge">Employee ID required</span>
                </div>
                ${this.subType === 'rub_staff' ? `
                  <div class="verify-input-group">
                    <input type="text" class="form-input" value="${this.staffId}" placeholder="Enter your Employee ID" oninput="window.bookingApp?.setStaffId(this.value)">
                    <button class="verify-btn" onclick="event.stopPropagation(); window.bookingApp?.verifyStaffId()" ${this.staffVerify === 'loading' ? 'disabled' : ''}>${this.staffVerify === 'loading' ? 'Verifying...' : 'Verify ID'}</button>
                  </div>
                  ${this.renderVerifyBadge(this.staffVerify, `Verified: ${this.staffData?.name}`, 'Employee ID not found. Please check and try again.')}
                  ${this.staffVerify === 'verified' && this.staffData ? `
                    <div class="verified-card">
                      <div class="verified-header">RUB VERIFIED STAFF</div>
                      <div class="verified-body">
                        <div class="verified-name">${this.staffData.name}</div>
                        <div class="verified-details">${this.staffData.college} · ${this.staffData.designation}</div>
                      </div>
                    </div>
                  ` : ''}
                ` : ''}
              </div>
              
              <!-- Non-RUB Bhutanese -->
              <div class="subtype-option ${this.subType === 'non_rub' ? 'selected' : ''}" onclick="event.stopPropagation(); window.bookingApp?.setSubType('non_rub')">
                <div class="subtype-header">
                  <div class="subtype-radio ${this.subType === 'non_rub' ? 'selected' : ''}"></div>
                  <span class="subtype-title">Non-RUB Bhutanese</span>
                  <span class="subtype-badge">CID verification via NDI</span>
                </div>
                ${this.subType === 'non_rub' ? `
                  <div class="verify-input-group">
                    <input type="text" class="form-input" value="${this.cid}" placeholder="Enter your 11-digit CID number" oninput="window.bookingApp?.setCid(this.value)">
                    <button class="verify-btn" onclick="event.stopPropagation(); window.bookingApp?.verifyCid()" ${this.cidVerify === 'loading' ? 'disabled' : ''}>${this.cidVerify === 'loading' ? 'Verifying...' : 'Verify via NDI'}</button>
                  </div>
                  ${this.renderVerifyBadge(this.cidVerify, 'NDI Verified: CID confirmed', 'CID not found in Bhutan NDI database.')}
                  ${this.cidVerify === 'verified' && this.cidData ? `
                    <div class="ndi-card">
                      <div class="ndi-header">BHUTAN NDI — VERIFIED IDENTITY</div>
                      <div class="ndi-content">
                        
                        <div class="ndi-info">
                          <div class="ndi-name">${this.cidData.name}</div>
                          <div class="ndi-detail-grid">
                            <div><span class="ndi-detail-label">CID</span><div class="ndi-detail-value">${this.cid}</div></div>
                            <div><span class="ndi-detail-label">Date of Birth</span><div class="ndi-detail-value">${this.cidData.dob}</div></div>
                            <div><span class="ndi-detail-label">Dzongkhag</span><div class="ndi-detail-value">${this.cidData.dzongkhag}</div></div>
                            <div><span class="ndi-detail-label">Status</span><div class="ndi-detail-value">Verified</div></div>
                          </div>
                        </div>
                      </div>
                      <div class="ndi-footer">✓ Identity successfully verified via Bhutan NDI</div>
                    </div>
                  ` : ''}
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
        
        <!-- International Option -->
        <div class="category-box ${this.intlOpen ? 'active' : ''}" onclick="window.bookingApp?.toggleInternational()">
          <div class="category-header">
            <div class="category-radio ${this.intlOpen ? 'selected' : ''}"></div>
            <div class="category-icon"></div>
            <div class="category-info">
              <h4>International Guest</h4>
              <p>Non-Bhutanese passport holder</p>
            </div>
          </div>
          ${this.intlOpen ? `
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e8edf2;">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input type="text" class="form-input" value="${this.intlForm.name}" placeholder="As shown in passport" oninput="window.bookingApp?.updateIntlForm('name', this.value)">
                </div>
                <div class="form-group">
                  <label class="form-label">Nationality *</label>
                  <input type="text" class="form-input" value="${this.intlForm.nationality}" placeholder="e.g., American, Indian" oninput="window.bookingApp?.updateIntlForm('nationality', this.value)">
                </div>
                <div class="form-group">
                  <label class="form-label">Passport Number *</label>
                  <input type="text" class="form-input" value="${this.intlForm.passport}" placeholder="Enter passport number" oninput="window.bookingApp?.updateIntlForm('passport', this.value)">
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Number</label>
                  <input type="text" class="form-input" value="${this.intlForm.phone}" placeholder="With country code" oninput="window.bookingApp?.updateIntlForm('phone', this.value)">
                </div>
              </div>
              ${this.intlForm.name && this.intlForm.passport && this.intlForm.nationality ? `
                <div class="verify-badge success">✓ Information verified — Ready to proceed</div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
      
      <button class="btn-primary" onclick="window.bookingApp?.nextStep()">Continue →</button>
    `;
  }
  
  renderStep2() {
    return `
      <div class="form-card">
        <div class="card-header">
          <div class="card-icon">📋</div>
          <div>
            <div class="card-title">Contact Information</div>
            <div class="card-subtitle">We'll send confirmation to this email</div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" class="form-input" value="${this.guestInfo.name}" placeholder="Enter your full name" oninput="window.bookingApp?.updateGuestInfo('name', this.value)">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" class="form-input" value="${this.guestInfo.email}" placeholder="you@example.com" oninput="window.bookingApp?.updateGuestInfo('email', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" class="form-input" value="${this.guestInfo.phone}" placeholder="e.g., 17XXXXXX" oninput="window.bookingApp?.updateGuestInfo('phone', this.value)">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Special Requests (Optional)</label>
          <textarea class="form-textarea" placeholder="Any special requirements or preferences..." oninput="window.bookingApp?.updateGuestInfo('notes', this.value)">${this.guestInfo.notes}</textarea>
        </div>
      </div>
      
      <div class="btn-group">
        <button class="btn-secondary" onclick="window.bookingApp?.prevStep()">← Back</button>
        <button class="btn-primary" style="flex:2;" onclick="window.bookingApp?.nextStep()">Review Booking →</button>
      </div>
    `;
  }
  
  renderStep3() {
    const nights = this.getNights();
    const reviewItems = [
      ['Guesthouse', this.guesthouse?.name],
      ['College', this.guesthouse?.location],
      ['Check-in Date', this.form.checkin],
      ['Check-out Date', this.form.checkout],
      ['Duration', `${nights} night${nights !== 1 ? 's' : ''}`],
      ['Number of Beds', this.form.num_beds],
      ['Room Type', this.form.room_type === 'normal' ? 'Standard Room' : 'Executive Room'],
      ['Guest Category', this.getGuestTypeLabel()],
      ['Purpose of Visit', this.form.purpose],
      ['Guest Name', this.guestInfo.name],
      ['Email Address', this.guestInfo.email],
      ['Phone Number', this.guestInfo.phone || 'Not provided']
    ];
    
    return `
      <div class="form-card">
        <div class="card-header">
          
          <div>
            <div class="card-title">Review Your Booking</div>
            <div class="card-subtitle">Please verify all details before proceeding</div>
          </div>
        </div>
        
        ${reviewItems.map(([label, value]) => `
          <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f0f2f5;">
            <span style="color:#1a2a3a; font-weight:600; font-size:13px;">${label}</span>
            <span style="font-weight:700; color:#0f2a3f; font-size:13px; text-align:right;">${value || '—'}</span>
          </div>
        `).join('')}
        
        <div style="margin-top: 20px; padding: 16px; background: #fef3e8; border-radius: 16px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="font-weight: 700; color: #0f2a3f;">Service Charge: Nu. ${SERVICE_CHARGE}</span>
          </div>
          <p style="font-size: 12px; color: #5a6e7c; line-height: 1.5;">A one-time service charge will be deducted to confirm your booking. Room charges are payable upon arrival at the guesthouse.</p>
        </div>
      </div>
      
      <div class="btn-group">
        <button class="btn-secondary" onclick="window.bookingApp?.prevStep()">← Back</button>
        <button class="btn-primary" style="flex:2;" onclick="window.bookingApp?.nextStep()">Proceed to Payment →</button>
      </div>
    `;
  }
  
  renderStep4() {
    return `
      <div class="form-card">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #fef3e8, #fae8d4); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px;">
            💳
          </div>
          <div style="font-size: 18px; font-weight: 700; color: #0f2a3f; margin-bottom: 6px;">Complete Your Booking</div>
          <div style="font-size: 13px; color: #5a6e7c;">Pay the service charge to confirm your reservation</div>
        </div>
        
        <div style="background: linear-gradient(135deg, #0f2a3f, #0a1e2e); border-radius: 20px; padding: 28px; text-align: center; margin-bottom: 28px;">
          <div style="font-size: 13px; color: rgba(201, 168, 76, 0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Service Charge Amount</div>
          <div style="font-size: 48px; font-weight: 800; color: #c9a84c;">Nu. ${SERVICE_CHARGE}</div>
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.4); margin-top: 6px;">One-time non-refundable fee</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Select Banking App</label>
          <select class="form-select" onchange="window.bookingApp?.updatePayForm('bank_app', this.value)">
            ${BANK_APPS.map(b => `<option value="${b}" ${this.payForm.bank_app === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Account Number / Mobile Number *</label>
          <input type="text" class="form-input" value="${this.payForm.account}" placeholder="Enter your account or mobile number" oninput="window.bookingApp?.updatePayForm('account', this.value)">
        </div>
        
        ${this.payError ? `<div class="error-message" style="margin-top: 16px;">⚠ ${this.payError}</div>` : ''}
        
        <div style="margin-top: 20px; padding: 12px 16px; background: #f8fafc; border-radius: 12px; font-size: 12px; color: #5a6e7c; display: flex; align-items: center; gap: 10px;">
          <span>🔒</span>
          <span>Your payment information is secure and encrypted. We do not store your banking details.</span>
        </div>
      </div>
      
      <div class="btn-group">
        <button class="btn-secondary" onclick="window.bookingApp?.prevStep()">← Back</button>
        <button class="btn-primary" style="flex:2;" onclick="window.bookingApp?.handlePayment()" ${this.paying ? 'disabled' : ''}>
          ${this.paying ? 'Processing...' : `Pay Nu. ${SERVICE_CHARGE} & Confirm`}
        </button>
      </div>
    `;
  }
  
  renderSummary() {
    const nights = this.getNights();
    const isVerified = this.isVerified();
    
    return `
      <div class="summary-card">
        <div class="summary-header">
          <h3>Booking Summary</h3>
        </div>
        <div class="summary-row">
          <span class="summary-label">College</span>
          <span class="summary-value">${this.guesthouse?.location || '—'}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Check-in Date</span>
          <span class="summary-value">${this.form.checkin || '—'}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Check-out Date</span>
          <span class="summary-value">${this.form.checkout || '—'}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Duration</span>
          <span class="summary-value">${nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : '—'}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Beds / Room Type</span>
          <span class="summary-value">${this.form.num_beds} · ${this.form.room_type === 'normal' ? 'Standard' : 'Executive'}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Guest Category</span>
          <span class="summary-value">${this.getGuestTypeLabel()}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Guest Name</span>
          <span class="summary-value">${this.guestInfo.name || '—'}</span>
        </div>
        <div class="summary-note">
          Room charges will be paid upon arrival at the guesthouse.
        </div>
      </div>
    `;
  }
  
  renderMain() {
    let stepContent = '';
    if (this.step === 1) stepContent = this.renderStep1();
    else if (this.step === 2) stepContent = this.renderStep2();
    else if (this.step === 3) stepContent = this.renderStep3();
    else if (this.step === 4) stepContent = this.renderStep4();
    
    return `
      <div class="two-column-layout">
        <div>
          ${this.renderStepBar()}
          ${this.renderError()}
          ${stepContent}
        </div>
        <div>
          ${this.renderSummary()}
        </div>
      </div>
    `;
  }
  
  render() {
    if (this.loading) {
      this.container.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;
      return;
    }
    
    if (this.done) {
      this.container.innerHTML = this.renderSuccess();
      return;
    }
    
    const html = `
      ${this.renderNavbar()}
      <div class="booking-container">
        ${this.renderMain()}
      </div>
      <footer class="footer">
        <div class="footer-left">© 2024 RUB Guesthouse Booking System</div>
        <div class="footer-right">Royal University of Bhutan</div>
      </footer>
    `;
    
    this.container.innerHTML = html;
  }
  
  // Action methods
  goHome() { window.location.href = '/'; }
  goBack() { window.location.href = `guesthouse-detail.html?id=${this.guesthouseId}`; }
  
  updateForm(field, value) { this.form[field] = value; this.render(); }
  updateGuestInfo(field, value) { this.guestInfo[field] = value; this.render(); }
  updateIntlForm(field, value) { this.intlForm[field] = value; this.render(); }
  updatePayForm(field, value) { this.payForm[field] = value; this.render(); }
  
  setStudentId(value) { this.studentId = value; this.studentVerify = null; this.render(); }
  setStaffId(value) { this.staffId = value; this.staffVerify = null; this.render(); }
  setCid(value) { this.cid = value; this.cidVerify = null; this.render(); }
  
  toggleBhutanese() { this.bhutaneseOpen = !this.bhutaneseOpen; if (this.bhutaneseOpen) this.intlOpen = false; this.render(); }
  toggleInternational() { this.intlOpen = !this.intlOpen; if (this.intlOpen) this.bhutaneseOpen = false; this.render(); }
  setSubType(type) { this.subType = this.subType === type ? '' : type; this.render(); }
  
  verifyStudentId() { this.verifyStudentId(); }
  verifyStaffId() { this.verifyStaffId(); }
  verifyCid() { this.verifyCid(); }
  
  nextStep() { this.nextStep(); }
  prevStep() { this.prevStep(); }
  handlePayment() { this.handlePayment(); }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const guesthouseId = urlParams.get('id') || '1';
  window.bookingApp = new BookingForm('root', guesthouseId);
});