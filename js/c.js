/* ════════════════════════════════════════
   JNEC Certificate Page – certificate.js
   • One-time generation (localStorage)
   • 90% attendance gate
   • E-signature pads (Advisor + Dean)
   • Auto-fill student details
   • Print-to-PDF download
════════════════════════════════════════ */

/* ──────────────────────────────────────
   STUDENT DATA  (replace with backend data)
────────────────────────────────────── */
const STUDENT = {
  name:        'Sonam Penjor',
  studentNo:   '05230064',
  club:        'Entrepreneurship Club Member',
  from:        'July 2023',
  to:          'June 2025',
  attendance:  96,          // percentage value
  initials:    'SP',
  firstName:   'Sonam'
};

/* ──────────────────────────────────────
   STORAGE KEYS
────────────────────────────────────── */
const KEY_GENERATED   = `cert_generated_${STUDENT.studentNo}`;
const KEY_SIG_ADVISOR = `cert_sig_advisor_${STUDENT.studentNo}`;
const KEY_SIG_DEAN    = `cert_sig_dean_${STUDENT.studentNo}`;

/* ──────────────────────────────────────
   E-SIGNATURE STATE
────────────────────────────────────── */
let activeSigTarget = null;   // 'advisor' | 'dean'
let padCtx          = null;
let isDrawing       = false;
let lastPt          = { x: 0, y: 0 };
let hasDrawnOnPad   = false;

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  fillStudentDetails();
  setupEligibilityBanner();
  checkGeneratedStatus();
});

/* ════════════════════════════════════════
   FILL DETAILS
════════════════════════════════════════ */
function fillStudentDetails() {
  // Topbar profile
  document.getElementById('profile-avatar').textContent = STUDENT.initials;
  document.getElementById('profile-name').textContent   = STUDENT.firstName;

  // Certificate fields
  document.getElementById('f-name').textContent   = STUDENT.name;
  document.getElementById('f-studno').textContent = STUDENT.studentNo;
  document.getElementById('f-role').textContent   = STUDENT.club;
  document.getElementById('f-from').textContent   = STUDENT.from;
  document.getElementById('f-to').textContent     = STUDENT.to;
}

/* ════════════════════════════════════════
   ELIGIBILITY BANNER
════════════════════════════════════════ */
function setupEligibilityBanner() {
  const banner = document.getElementById('eligibility-banner');
  const title  = document.getElementById('banner-title');
  const desc   = document.getElementById('banner-desc');

  if (STUDENT.attendance >= 90) {
    title.textContent = 'You are eligible to generate your certificate';
    desc.innerHTML    = `Your attendance of <strong>${STUDENT.attendance}%</strong> meets the minimum 90% requirement.`;
  } else {
    banner.classList.add('ineligible');
    // swap icon to X
    banner.querySelector('.banner-icon-wrap').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`;
    title.textContent = 'You are not eligible to generate a certificate';
    desc.innerHTML    = `Your attendance of <strong>${STUDENT.attendance}%</strong> does not meet the minimum 90% requirement.`;
  }
}

/* ════════════════════════════════════════
   CHECK GENERATED STATUS
════════════════════════════════════════ */
function checkGeneratedStatus() {
  const btn  = document.getElementById('btn-generate');
  const note = document.getElementById('already-note');

  if (STUDENT.attendance < 90) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      Not Eligible`;
    return;
  }

  if (localStorage.getItem(KEY_GENERATED)) {
    // Already generated — disable button but show note + still allow viewing
    btn.disabled = true;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      Certificate Generated`;
    note.style.display = 'flex';

    // Add a view button dynamically
    if (!document.getElementById('btn-view-cert')) {
      const viewBtn = document.createElement('button');
      viewBtn.id        = 'btn-view-cert';
      viewBtn.className = 'btn-primary';
      viewBtn.style.marginTop = '12px';
      viewBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        View Certificate`;
      viewBtn.onclick = showCertificate;
      document.querySelector('.ready-card-inner').appendChild(viewBtn);
    }
  }
}

/* ════════════════════════════════════════
   GENERATE CERTIFICATE  (first-time)
════════════════════════════════════════ */
window.generateCertificate = function () {
  if (STUDENT.attendance < 90) return;

  // Mark as generated
  if (!localStorage.getItem(KEY_GENERATED)) {
    localStorage.setItem(KEY_GENERATED, new Date().toISOString());
  }

  showCertificate();
  checkGeneratedStatus();
};

/* ════════════════════════════════════════
   SHOW / HIDE VIEWS
════════════════════════════════════════ */
function showCertificate() {
  document.getElementById('view-pregenerate').style.display  = 'none';
  document.getElementById('view-certificate').style.display  = 'block';

  // Restore saved signatures
  restoreSig('advisor', 'canvas-advisor', 'ph-advisor', KEY_SIG_ADVISOR);
  restoreSig('dean',    'canvas-dean',    'ph-dean',    KEY_SIG_DEAN);

  // Prompt for signatures if not yet done
  if (!localStorage.getItem(KEY_SIG_ADVISOR)) {
    setTimeout(() => openSig('advisor'), 300);
  } else if (!localStorage.getItem(KEY_SIG_DEAN)) {
    setTimeout(() => openSig('dean'), 300);
  }
}

window.showPreview = function () {
  document.getElementById('view-certificate').style.display  = 'none';
  document.getElementById('view-pregenerate').style.display  = 'block';
};

/* ════════════════════════════════════════
   DOWNLOAD (print to PDF)
════════════════════════════════════════ */
window.downloadCert = function () {
  window.print();
};

/* ════════════════════════════════════════
   E-SIGNATURE  –  OPEN / CLOSE
════════════════════════════════════════ */
window.openSig = function (target) {
  activeSigTarget = target;
  const label = target === 'advisor' ? 'Club Advisor Signature' : 'Dean, Student Affairs Signature';
  document.getElementById('sig-panel-title').textContent = label;

  // Init canvas
  const pad = document.getElementById('sig-pad');
  padCtx = pad.getContext('2d');
  hasDrawnOnPad = false;
  clearPad();

  // Wire up events
  pad.onmousedown  = onPadDown;
  pad.onmousemove  = onPadMove;
  pad.onmouseup    = onPadUp;
  pad.onmouseleave = onPadUp;
  pad.ontouchstart = (e) => { e.preventDefault(); onPadDown(e.touches[0]); };
  pad.ontouchmove  = (e) => { e.preventDefault(); onPadMove(e.touches[0]); };
  pad.ontouchend   = onPadUp;

  document.getElementById('sig-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closeSig = function () {
  document.getElementById('sig-overlay').style.display = 'none';
  document.body.style.overflow = '';
};

window.closeSigOverlay = function (e) {
  if (e.target === document.getElementById('sig-overlay')) closeSig();
};

/* ════════════════════════════════════════
   E-SIGNATURE  –  DRAWING
════════════════════════════════════════ */
function getPos(e) {
  const pad  = document.getElementById('sig-pad');
  const rect = pad.getBoundingClientRect();
  const scX  = pad.width  / rect.width;
  const scY  = pad.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scX,
    y: (e.clientY - rect.top)  * scY
  };
}

function onPadDown(e) {
  isDrawing = true;
  lastPt    = getPos(e);
  padCtx.beginPath();
  padCtx.arc(lastPt.x, lastPt.y, 1, 0, Math.PI * 2);
  padCtx.fillStyle = '#1a1a2e';
  padCtx.fill();
  hasDrawnOnPad = true;
  document.getElementById('sig-hint').style.opacity = '0';
}

function onPadMove(e) {
  if (!isDrawing) return;
  const pt = getPos(e);
  padCtx.beginPath();
  padCtx.moveTo(lastPt.x, lastPt.y);
  padCtx.lineTo(pt.x, pt.y);
  padCtx.strokeStyle = '#1a1a2e';
  padCtx.lineWidth   = 2.4;
  padCtx.lineCap     = 'round';
  padCtx.lineJoin    = 'round';
  padCtx.stroke();
  lastPt = pt;
}

function onPadUp() { isDrawing = false; }

function clearPad() {
  if (!padCtx) return;
  const pad = document.getElementById('sig-pad');
  padCtx.clearRect(0, 0, pad.width, pad.height);
  padCtx.fillStyle = '#fafbff';
  padCtx.fillRect(0, 0, pad.width, pad.height);
  document.getElementById('sig-hint').style.opacity = '1';
  hasDrawnOnPad = false;
}
window.clearSigPad = clearPad;

/* ════════════════════════════════════════
   E-SIGNATURE  –  SAVE
════════════════════════════════════════ */
window.saveSig = function () {
  if (!hasDrawnOnPad) {
    alert('Please draw your signature first.');
    return;
  }

  const pad     = document.getElementById('sig-pad');
  const dataURL = pad.toDataURL('image/png');
  const storageKey = activeSigTarget === 'advisor' ? KEY_SIG_ADVISOR : KEY_SIG_DEAN;
  const canvasId   = activeSigTarget === 'advisor' ? 'canvas-advisor' : 'canvas-dean';
  const phId       = activeSigTarget === 'advisor' ? 'ph-advisor'     : 'ph-dean';

  localStorage.setItem(storageKey, dataURL);
  paintSigOnCert(canvasId, phId, dataURL);
  closeSig();

  // After advisor, prompt dean if not yet signed
  if (activeSigTarget === 'advisor' && !localStorage.getItem(KEY_SIG_DEAN)) {
    setTimeout(() => openSig('dean'), 350);
  }
};

/* ════════════════════════════════════════
   HELPERS – paint signature on cert canvas
════════════════════════════════════════ */
function paintSigOnCert(canvasId, phId, dataURL) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw with slight transparency to look natural
    ctx.globalAlpha = 0.9;
    ctx.drawImage(img, 0, 4, canvas.width, canvas.height - 8);
    ctx.globalAlpha = 1;
  };
  img.src = dataURL;
  // Hide placeholder
  const ph = document.getElementById(phId);
  if (ph) ph.classList.add('hidden');
}

function restoreSig(target, canvasId, phId, storageKey) {
  const data = localStorage.getItem(storageKey);
  if (data) paintSigOnCert(canvasId, phId, data);
}