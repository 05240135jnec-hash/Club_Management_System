// ========== DATABASE (localStorage persistence) ==========
let students = [];
let lecturers = [];

function loadData() {
  const savedStudents = localStorage.getItem('rub_students');
  const savedLecturers = localStorage.getItem('rub_lecturers');
  
  if (savedStudents) {
    students = JSON.parse(savedStudents);
  } else {
    students = [
      { id: 'S001', name: 'Kinley Dorji', program: 'BSc IT', year: '3rd Year', email: 'kinley@rub.edu.bt', citizenship: 'Bhutanese', gender: 'Male' },
      { id: 'S002', name: 'Pema Lhamo', program: 'BA Economics', year: '2nd Year', email: 'pema@rub.edu.bt', citizenship: 'Bhutanese', gender: 'Female' },
      { id: 'S003', name: 'Tshering Wangdi', program: 'BEng Civil', year: '4th Year', email: 'tshering@rub.edu.bt', citizenship: 'Bhutanese', gender: 'Male' },
      { id: 'S004', name: 'Sonam Choden', program: 'BSc Biology', year: '1st Year', email: 'sonam@rub.edu.bt', citizenship: 'Bhutanese', gender: 'Female' }
    ];
  }
  
  if (savedLecturers) {
    lecturers = JSON.parse(savedLecturers);
  } else {
    lecturers = [
      { id: 'L001', name: 'Dr. Karma Tenzin', department: 'Computer Science', rank: 'Associate Professor', email: 'karma@rub.edu.bt', citizenship: 'Bhutanese', gender: 'Male' },
      { id: 'L002', name: 'Prof. Dechen Pem', department: 'Economics', rank: 'Professor', email: 'dechen@rub.edu.bt', citizenship: 'Bhutanese', gender: 'Female' }
    ];
  }
}

function saveData() {
  localStorage.setItem('rub_students', JSON.stringify(students));
  localStorage.setItem('rub_lecturers', JSON.stringify(lecturers));
}

let currentTab = 'student';
let currentManageTab = 'student';
let currentFetchTab = 'student';

// ========== PAGE RENDERING ==========
const pageTitles = {
  'upload-users': { title: 'Upload RUB user data', subtitle: 'Add students and lecturers so they can be auto-fetched during booking' },
  'manage-users': { title: 'Manage users', subtitle: 'View, edit or remove students and lecturers in the database' },
  'fetch-verify': { title: 'Fetch / verify a user', subtitle: 'Simulate how the booking form fetches user data' },
  'dashboard': { title: 'Dashboard', subtitle: 'Overview of guest house bookings' },
  'announcements': { title: 'Announcements', subtitle: 'Club announcements and updates' },
  'attendance': { title: 'My Attendance', subtitle: 'Track your attendance records' },
  'workplus': { title: 'Work Plus', subtitle: 'Additional work materials' },
  'gallery': { title: 'Gallery', subtitle: 'Photo gallery of events' },
  'clubpage': { title: 'Club Page', subtitle: 'Club information and details' },
  'guesthouses': { title: 'Guesthouses', subtitle: 'Manage guest house properties' },
  'bookings': { title: 'All Bookings', subtitle: 'View all guest house bookings' },
  'settings': { title: 'Settings', subtitle: 'System configuration' }
};

function showPage(pageId) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${pageId}"]`).classList.add('active');
  
  const titleInfo = pageTitles[pageId] || pageTitles['upload-users'];
  document.getElementById('topbar-title').textContent = titleInfo.title;
  document.querySelector('.topbar-subtitle').textContent = titleInfo.subtitle;
  
  if (pageId === 'upload-users') renderUploadPage();
  else if (pageId === 'manage-users') renderManagePage();
  else if (pageId === 'fetch-verify') renderFetchPage();
  else renderPlaceholder(pageId);
}

function renderPlaceholder(pageId) {
  document.getElementById('page-body').innerHTML = `
    <div style="text-align: center; padding: 60px; background: white; border-radius: 20px;">
      <i class="ti ti-construction" style="font-size: 64px; color: #94a3b8;"></i>
      <h3 style="margin-top: 20px; color: #475569;">${pageTitles[pageId]?.title || pageId}</h3>
      <p style="color: #64748b; margin-top: 8px;">Module under development</p>
    </div>
  `;
}

// ========== UPLOAD PAGE ==========
function renderUploadPage() {
  const html = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total students</div><div class="stat-value blue" id="stat-students">${students.length}</div></div>
      <div class="stat-card"><div class="stat-label">Total lecturers</div><div class="stat-value amber" id="stat-lecturers">${lecturers.length}</div></div>
      <div class="stat-card"><div class="stat-label">Last uploaded</div><div class="stat-value green" style="font-size: 20px;">Today</div></div>
    </div>
    
    <div class="section-label">How it works</div>
    <div class="how-it-works">
      <div class="how-card"><div class="how-number">1</div><div class="how-title">Download template</div><div class="how-desc">Get CSV template with required columns</div></div>
      <div class="how-card"><div class="how-number">2</div><div class="how-title">Fill & upload</div><div class="how-desc">Fill data and upload. System validates each row</div></div>
      <div class="how-card"><div class="how-number">3</div><div class="how-title">Auto-fetch enabled</div><div class="how-desc">When user types ID, details are fetched instantly</div></div>
    </div>
    
    <div class="tabs">
      <button class="tab-btn ${currentTab === 'student' ? 'active' : ''}" onclick="setUploadTab('student')"><i class="ti ti-school"></i> Students</button>
      <button class="tab-btn ${currentTab === 'lecturer' ? 'active' : ''}" onclick="setUploadTab('lecturer')"><i class="ti ti-briefcase"></i> Lecturers</button>
    </div>
    
    <div class="template-strip">
      <span>Download the <strong>${currentTab}</strong> CSV template before uploading</span>
      <button class="btn-sm btn-outline" onclick="downloadTemplate()"><i class="ti ti-download"></i> Download template</button>
    </div>
    
    <div class="upload-zone" onclick="document.getElementById('fileInput').click()">
      <input type="file" id="fileInput" accept=".csv,.xlsx" style="display:none" onchange="handleFileUpload(this)" />
      <i class="ti ti-file-spreadsheet"></i>
      <div class="uz-title">Click to upload CSV / Excel file</div>
      <div class="uz-sub">Accepted: .csv, .xlsx · Max 5 MB · Bulk upload supported</div>
    </div>
    
    <div id="uploadProgress" style="display:none">
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    </div>
    
    <div id="uploadAlert" class="alert-success" style="display:none"><i class="ti ti-circle-check"></i> <span id="alertMsg"></span></div>
    
    <div class="section-label">Preview — uploaded records</div>
    <div class="table-wrapper">
      <table id="previewTable">
        <thead id="previewHead"></thead>
        <tbody id="previewBody"></tbody>
      </table>
    </div>
    
    <div class="flex-between">
      <button class="btn-sm btn-outline" onclick="showPage('manage-users')"><i class="ti ti-table"></i> View all records</button>
      <button class="btn-sm btn-primary" onclick="saveToDatabase()"><i class="ti ti-database"></i> Save to database</button>
    </div>
    
    <div class="section-label mt-4">Or add a single record manually</div>
    <div class="form-grid" id="manualForm"></div>
    <button class="btn-sm btn-primary" onclick="addManualRecord()"><i class="ti ti-plus"></i> Add record</button>
    <div id="manualAlert" class="alert-success" style="display:none; margin-top: 16px;"><i class="ti ti-circle-check"></i> <span id="manualMsg"></span></div>
  `;
  
  document.getElementById('page-body').innerHTML = html;
  renderPreviewTable();
  renderManualForm();
}

function setUploadTab(tab) {
  currentTab = tab;
  renderUploadPage();
}

function renderPreviewTable() {
  const data = currentTab === 'student' ? students : lecturers;
  const columns = currentTab === 'student' 
    ? ['Student ID', 'Full Name', 'Program', 'Year', 'Email', 'Citizenship']
    : ['Employee ID', 'Full Name', 'Department', 'Rank', 'Email', 'Citizenship'];
  
  document.getElementById('previewHead').innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
  document.getElementById('previewBody').innerHTML = data.slice(0, 5).map(row => {
    if (currentTab === 'student') {
      return `<tr><td><span class="badge badge-blue">${row.id}</span></td><td>${row.name}</td><td>${row.program}</td><td>${row.year}</td><td>${row.email}</td><td>${row.citizenship}</td></tr>`;
    } else {
      return `<tr><td><span class="badge badge-blue">${row.id}</span></td><td>${row.name}</td><td>${row.department}</td><td>${row.rank}</td><td>${row.email}</td><td>${row.citizenship}</td></tr>`;
    }
  }).join('');
}

function renderManualForm() {
  const fields = currentTab === 'student' 
    ? ['id', 'name', 'program', 'year', 'email', 'citizenship']
    : ['id', 'name', 'department', 'rank', 'email', 'citizenship'];
  
  const labels = currentTab === 'student'
    ? ['Student ID', 'Full Name', 'Program', 'Year', 'Email', 'Citizenship']
    : ['Employee ID', 'Full Name', 'Department', 'Rank', 'Email', 'Citizenship'];
  
  document.getElementById('manualForm').innerHTML = fields.map((f, i) => `
    <div class="field">
      <label>${labels[i]}</label>
      <input type="text" id="manual_${f}" placeholder="Enter ${labels[i].toLowerCase()}..." />
    </div>
  `).join('');
}

function downloadTemplate() {
  const headers = currentTab === 'student' 
    ? 'StudentID,FullName,Program,Year,Email,Citizenship,Gender'
    : 'EmployeeID,FullName,Department,Rank,Email,Citizenship,Gender';
  const sample = currentTab === 'student'
    ? 'S005,Namgay Wangchuk,BSc IT,1st Year,namgay@rub.edu.bt,Bhutanese,Male'
    : 'L003,Dr. Example,Mathematics,Lecturer,example@rub.edu.bt,Bhutanese,Female';
  const blob = new Blob([headers + '\n' + sample], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `RUB_${currentTab}_template.csv`;
  link.click();
}

function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  
  const progressDiv = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  progressDiv.style.display = 'block';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;
    progressFill.style.width = progress + '%';
    if (progress >= 100) clearInterval(interval);
  }, 50);
  
  const reader = new FileReader();
  reader.onload = function(e) {
    setTimeout(() => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      
      const newRecords = [];
      rows.forEach(row => {
        const id = row.StudentID || row.EmployeeID || row.id;
        const name = row.FullName || row.name;
        if (id && name) {
          if (currentTab === 'student') {
            newRecords.push({
              id: String(id),
              name: String(name),
              program: row.Program || row.program || 'N/A',
              year: row.Year || row.year || 'N/A',
              email: row.Email || row.email || '',
              citizenship: row.Citizenship || row.citizenship || 'Bhutanese',
              gender: row.Gender || row.gender || 'Not specified'
            });
          } else {
            newRecords.push({
              id: String(id),
              name: String(name),
              department: row.Department || row.department || 'N/A',
              rank: row.Rank || row.rank || 'Lecturer',
              email: row.Email || row.email || '',
              citizenship: row.Citizenship || row.citizenship || 'Bhutanese',
              gender: row.Gender || row.gender || 'Not specified'
            });
          }
        }
      });
      
      if (newRecords.length > 0) {
        if (currentTab === 'student') students.push(...newRecords);
        else lecturers.push(...newRecords);
        saveData();
        
        document.getElementById('alertMsg').textContent = `✅ ${newRecords.length} records uploaded successfully!`;
        document.getElementById('uploadAlert').style.display = 'flex';
        setTimeout(() => document.getElementById('uploadAlert').style.display = 'none', 3000);
        
        renderPreviewTable();
        document.getElementById('stat-students').textContent = students.length;
        document.getElementById('stat-lecturers').textContent = lecturers.length;
      }
      
      progressDiv.style.display = 'none';
      input.value = '';
    }, 300);
  };
  reader.readAsArrayBuffer(file);
}

function addManualRecord() {
  if (currentTab === 'student') {
    const newStudent = {
      id: document.getElementById('manual_id')?.value.trim(),
      name: document.getElementById('manual_name')?.value.trim(),
      program: document.getElementById('manual_program')?.value.trim(),
      year: document.getElementById('manual_year')?.value.trim(),
      email: document.getElementById('manual_email')?.value.trim(),
      citizenship: document.getElementById('manual_citizenship')?.value.trim() || 'Bhutanese',
      gender: 'Not specified'
    };
    if (!newStudent.id || !newStudent.name) {
      alert('Please fill Student ID and Full Name');
      return;
    }
    students.push(newStudent);
    saveData();
    document.getElementById('manualMsg').textContent = `✅ Student ${newStudent.name} added!`;
  } else {
    const newLecturer = {
      id: document.getElementById('manual_id')?.value.trim(),
      name: document.getElementById('manual_name')?.value.trim(),
      department: document.getElementById('manual_department')?.value.trim(),
      rank: document.getElementById('manual_rank')?.value.trim(),
      email: document.getElementById('manual_email')?.value.trim(),
      citizenship: document.getElementById('manual_citizenship')?.value.trim() || 'Bhutanese',
      gender: 'Not specified'
    };
    if (!newLecturer.id || !newLecturer.name) {
      alert('Please fill Employee ID and Full Name');
      return;
    }
    lecturers.push(newLecturer);
    saveData();
    document.getElementById('manualMsg').textContent = `✅ Lecturer ${newLecturer.name} added!`;
  }
  
  document.getElementById('manualAlert').style.display = 'flex';
  setTimeout(() => document.getElementById('manualAlert').style.display = 'none', 3000);
  renderPreviewTable();
  document.getElementById('stat-students').textContent = students.length;
  document.getElementById('stat-lecturers').textContent = lecturers.length;
  renderManualForm();
}

function saveToDatabase() {
  saveData();
  document.getElementById('alertMsg').textContent = '✅ All records saved to database successfully!';
  document.getElementById('uploadAlert').style.display = 'flex';
  setTimeout(() => document.getElementById('uploadAlert').style.display = 'none', 2000);
}

// ========== MANAGE PAGE ==========
function renderManagePage() {
  const html = `
    <div class="tabs">
      <button class="tab-btn ${currentManageTab === 'student' ? 'active' : ''}" onclick="setManageTab('student')">Students</button>
      <button class="tab-btn ${currentManageTab === 'lecturer' ? 'active' : ''}" onclick="setManageTab('lecturer')">Lecturers</button>
    </div>
    <div class="table-wrapper">
      <table id="manageTable">
        <thead id="manageHead"></thead>
        <tbody id="manageBody"></tbody>
      </table>
    </div>
  `;
  document.getElementById('page-body').innerHTML = html;
  renderManageTable();
}

function setManageTab(tab) {
  currentManageTab = tab;
  renderManagePage();
}

function renderManageTable() {
  const data = currentManageTab === 'student' ? students : lecturers;
  const columns = currentManageTab === 'student'
    ? ['Student ID', 'Full Name', 'Program', 'Year', 'Email', 'Citizenship', 'Actions']
    : ['Employee ID', 'Full Name', 'Department', 'Rank', 'Email', 'Citizenship', 'Actions'];
  
  document.getElementById('manageHead').innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
  document.getElementById('manageBody').innerHTML = data.map((row, idx) => {
    const rowHtml = currentManageTab === 'student'
      ? `<td>${row.id}</td><td>${row.name}</td><td>${row.program}</td><td>${row.year}</td><td>${row.email}</td><td>${row.citizenship}</td>`
      : `<td>${row.id}</td><td>${row.name}</td><td>${row.department}</td><td>${row.rank}</td><td>${row.email}</td><td>${row.citizenship}</td>`;
    return `<tr>${rowHtml}<td><button class="btn-sm btn-danger" onclick="deleteRecord(${idx})"><i class="ti ti-trash"></i> Delete</button></td></tr>`;
  }).join('');
}

function deleteRecord(idx) {
  if (confirm('Are you sure you want to delete this record?')) {
    if (currentManageTab === 'student') students.splice(idx, 1);
    else lecturers.splice(idx, 1);
    saveData();
    renderManageTable();
    if (document.getElementById('stat-students')) {
      document.getElementById('stat-students').textContent = students.length;
      document.getElementById('stat-lecturers').textContent = lecturers.length;
    }
  }
}

// ========== FETCH PAGE ==========
function renderFetchPage() {
  const html = `
    <div class="fetch-demo">
      <div class="fetch-header"><i class="ti ti-search"></i> Live fetch demo</div>
      <div class="fetch-body">
        <div class="tabs">
          <button class="tab-btn ${currentFetchTab === 'student' ? 'active' : ''}" onclick="setFetchTab('student')">Student ID</button>
          <button class="tab-btn ${currentFetchTab === 'lecturer' ? 'active' : ''}" onclick="setFetchTab('lecturer')">Employee ID</button>
        </div>
        <div class="id-search">
          <input type="text" id="fetchIdInput" placeholder="Type an ID and press Fetch..." />
          <button class="btn-sm btn-primary" onclick="performFetch()"><i class="ti ti-search"></i> Fetch</button>
        </div>
        <div id="fetchNotFound" class="not-found"><i class="ti ti-alert-circle"></i> No record found for this ID</div>
        <div id="fetchResult" class="result-card">
          <div class="result-row"><span class="result-label">Name</span><span class="result-value" id="fetchName">—</span></div>
          <div class="result-row"><span class="result-label">ID</span><span class="result-value" id="fetchId">—</span></div>
          <div class="result-row"><span class="result-label">Role</span><span class="result-value" id="fetchRole">—</span></div>
          <div class="result-row"><span class="result-label">Program/Dept</span><span class="result-value" id="fetchDept">—</span></div>
          <div class="result-row"><span class="result-label">Email</span><span class="result-value" id="fetchEmail">—</span></div>
          <div class="result-row"><span class="result-label">Citizenship</span><span class="result-value" id="fetchCiti">—</span></div>
          <div class="result-row"><span class="result-label">Rate category</span><span class="result-value"><span class="badge badge-blue">RUB Rate</span></span></div>
        </div>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <strong>Try these IDs:</strong> S001, S002, S003 (students) · L001, L002 (lecturers)
    </div>
  `;
  document.getElementById('page-body').innerHTML = html;
}

function setFetchTab(tab) {
  currentFetchTab = tab;
  renderFetchPage();
}

function performFetch() {
  const id = document.getElementById('fetchIdInput').value.trim().toUpperCase();
  const data = currentFetchTab === 'student' ? students : lecturers;
  const user = data.find(u => u.id.toUpperCase() === id);
  
  document.getElementById('fetchNotFound').style.display = 'none';
  document.getElementById('fetchResult').style.display = 'none';
  
  if (!user) {
    document.getElementById('fetchNotFound').style.display = 'block';
    return;
  }
  
  document.getElementById('fetchName').textContent = user.name;
  document.getElementById('fetchId').textContent = user.id;
  document.getElementById('fetchRole').textContent = currentFetchTab === 'student' ? 'Student' : 'Lecturer';
  document.getElementById('fetchDept').textContent = currentFetchTab === 'student' ? user.program : user.department;
  document.getElementById('fetchEmail').textContent = user.email;
  document.getElementById('fetchCiti').textContent = user.citizenship;
  document.getElementById('fetchResult').style.display = 'block';
}

// ========== INITIALIZATION ==========
loadData();

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.getAttribute('data-page');
    if (page) showPage(page);
  });
});

showPage('upload-users');