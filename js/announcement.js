'use strict';

/* ══════════════════════════════════════════════
   announcement.js
══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   1. SIDEBAR NAV ACTIVE STATE
══════════════════════════════════════════════ */
(function initNav() {
  var current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.classList.remove('active');
    var href = (item.getAttribute('href') || '').split('/').pop();
    if (href === current) item.classList.add('active');
  });
})();

/* ══════════════════════════════════════════════
   2. MY CLUB BUTTON — active state
══════════════════════════════════════════════ */
(function initMyClubLink() {
  var link = document.querySelector('.my-club-link');
  if (!link) return;
  if (window.location.pathname.split('/').pop() === 'generalpage.html') {
    link.classList.add('active-page');
  }
})();

/* ══════════════════════════════════════════════
   3. HAMBURGER / SIDEBAR TOGGLE
══════════════════════════════════════════════ */
(function initHamburger() {
  var btn     = document.getElementById('hamburger-btn');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (!btn || !sidebar) return;

  function openSidebar()  { sidebar.classList.add('open');    if (overlay) overlay.classList.add('active'); }
  function closeSidebar() { sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('active'); }

  btn.addEventListener('click', function() {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  if (overlay) overlay.addEventListener('click', closeSidebar);
  sidebar.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });
})();

/* ══════════════════════════════════════════════
   4. DATA
══════════════════════════════════════════════ */
var ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Photography Workshop – Saturday 10 AM',
    desc: 'Join us for a hands-on photography session in the college courtyard. Bring your camera or phone. All skill levels are welcome.',
    fullBody: 'Join us for a hands-on photography session in the college courtyard this Saturday at 10 AM. The workshop will cover composition basics, lighting techniques, and mobile photography tips. All skill levels are welcome — no prior experience needed. Please bring your camera or smartphone. Refreshments will be provided. The session is expected to run for approximately two hours. For queries, contact the Media Club email.',
    category: 'event',
    date: 'Apr 5, 2026',
    month: 'April 2026',
    postedBy: 'Club Advisor: Mr. Tenzin Dorji',
    unread: true,
    image: '../image/photography.jpg'
  },
  {
    id: 2,
    title: 'Annual Magazine Submission Deadline',
    desc: 'All article and photo submissions for the annual magazine must be sent to the club email by April 10. Late entries will not be accepted.',
    fullBody: 'All article and photo submissions for the annual JNEC Media Club magazine must be submitted to the official club email by April 10, 2026. Late entries will not be accepted under any circumstances. Please ensure your submissions are in the correct format: articles in .docx, photos in high-resolution .jpg or .png. Each member may submit up to two articles and five photos.',
    category: 'reminder',
    date: 'Apr 3, 2026',
    month: 'April 2026',
    postedBy: 'Club Secretary: Karma Wangchuk',
    unread: true,
    image: '../image/2.1.png'
  },
  {
    id: 3,
    title: 'Weekly Editorial Meeting – Thursday 4 PM',
    desc: 'Regular team sync to review content pipeline and assign reporting duties for upcoming events.',
    fullBody: 'Our weekly editorial meeting will be held this Thursday at 4 PM in Room 204. The agenda includes reviewing the current content pipeline, assigning reporting duties for upcoming campus events, and a brief update on the magazine timeline. All core members are expected to attend.',
    category: 'general',
    date: 'Apr 1, 2026',
    month: 'April 2026',
    postedBy: 'Club Secretary: Karma Wangchuk',
    unread: false
  },
  {
    id: 4,
    title: 'Blood Donation Drive – April 8',
    desc: 'JNEC Blood Donation Camp will be held at the Main Hall. All eligible students are encouraged to participate.',
    fullBody: 'The JNEC Red Cross Club is organizing a Blood Donation Drive on April 8, 2026 at the Main Hall from 9 AM to 3 PM. All eligible students, faculty, and staff are encouraged to participate. Eligibility: age 18–65, weight above 50 kg, no recent illness or medication.',
    category: 'event',
    date: 'Apr 6, 2026',
    month: 'April 2026',
    postedBy: 'Club Advisor: Dr. Rinzin Namgyal',
    unread: true,
    image: '../image/blooddrive.jpg'
  },
  {
    id: 5,
    title: 'Q1 Audit Report Now Available',
    desc: 'The Q1 2026 campus audit report has been published. Members are encouraged to read and share feedback.',
    fullBody: 'The Q1 2026 Campus Integrity Audit Report has been officially published and is now available for all members to review. Members are strongly encouraged to read the full report and submit feedback via the official feedback form before April 15.',
    category: 'general',
    date: 'Apr 4, 2026',
    month: 'April 2026',
    postedBy: 'Club Advisor: Ms. Pema Lhamo',
    unread: true,
    image: '../image/audit.jpg'
  },
  {
    id: 6,
    title: 'Ethics Workshop – Next Wednesday',
    desc: 'A workshop on anti-corruption values and good governance will be held in Seminar Hall A at 2 PM.',
    fullBody: 'The Integrity Club invites all members to attend an Ethics and Good Governance Workshop on Wednesday, April 9, 2026 at 2 PM in Seminar Hall A. Topics include ethical decision-making and how students can champion integrity in everyday life.',
    category: 'event',
    date: 'Apr 2, 2026',
    month: 'April 2026',
    postedBy: 'Club Secretary: Sonam Tobgay',
    unread: false
  },
  {
    id: 7,
    title: 'First Aid Training Session',
    desc: 'Certified trainers will conduct a basic first aid certification session for all new members this Friday.',
    fullBody: 'The Red Cross Club will be hosting a First Aid Training Session this Friday. Training will cover CPR, wound management, fracture handling, and emergency response protocols. Upon completion, participants will receive a basic first aid certification.',
    category: 'event',
    date: 'Mar 28, 2026',
    month: 'March 2026',
    postedBy: 'Club Secretary: Dechen Zangmo',
    unread: false,
    image: '../image/firstaid.jpg'
  },
  {
    id: 8,
    title: 'Work Plan for March Uploaded',
    desc: 'The monthly work plan has been uploaded to the Work Plan section. Please review before the next meeting.',
    fullBody: 'The Work Plan for March 2026 has been uploaded to the Work Plan section of the student portal. All members are requested to review the plan before the next general meeting.',
    category: 'reminder',
    date: 'Mar 20, 2026',
    month: 'March 2026',
    postedBy: 'Club Captain',
    unread: false
  }
];

/* ══════════════════════════════════════════════
   5. STATE
══════════════════════════════════════════════ */
var activeFilter = 'all';
var searchQuery  = '';

/* ══════════════════════════════════════════════
   6. DOM REFS
══════════════════════════════════════════════ */
var listView        = document.getElementById('listView');
var detailView      = document.getElementById('detailView');
var announceSection = document.getElementById('announceSection');
var searchInput     = document.getElementById('searchInput');
var backBtn         = document.getElementById('backBtn');
var tabs            = document.querySelectorAll('.tab');

var detailImgWrap = document.getElementById('detailImgWrap');
var detailImg     = document.getElementById('detailImg');
var detailTag     = document.getElementById('detailTag');
var detailDate    = document.getElementById('detailDate');
var detailTitle   = document.getElementById('detailTitle');
var detailBody    = document.getElementById('detailBody');
var detailAuthor  = document.getElementById('detailAuthor');

/* ══════════════════════════════════════════════
   7. STAT COUNT-UP
══════════════════════════════════════════════ */
function animateCount(el, target) {
  if (!el) return;
  var dur = 700, start = performance.now();
  function tick(now) {
    var prog = Math.min((now - start) / dur, 1);
    var ease = 1 - Math.pow(1 - prog, 3);
    el.textContent = Math.round(target * ease);
    if (prog < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderStats() {
  var total  = ANNOUNCEMENTS.length;
  var unread = ANNOUNCEMENTS.filter(function(a) { return a.unread; }).length;
  animateCount(document.getElementById('statTotal'),  total);
  animateCount(document.getElementById('statUnread'), unread);
}

/* ══════════════════════════════════════════════
   8. FILTER + SEARCH
══════════════════════════════════════════════ */
function getFiltered() {
  return ANNOUNCEMENTS.filter(function(a) {
    var matchFilter = activeFilter === 'all' || a.category === activeFilter;
    var matchSearch = a.title.toLowerCase().includes(searchQuery) ||
                      a.desc.toLowerCase().includes(searchQuery);
    return matchFilter && matchSearch;
  });
}

/* ══════════════════════════════════════════════
   9. HTML ESCAPE
══════════════════════════════════════════════ */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════════════
   10. RENDER LIST
══════════════════════════════════════════════ */
function renderList() {
  var filtered = getFiltered();
  announceSection.innerHTML = '';

  if (filtered.length === 0) {
    announceSection.innerHTML =
      '<div class="empty-state">' +
        '<strong>No announcements found</strong>' +
        '<p>Try adjusting your filter or search term.</p>' +
      '</div>';
    return;
  }

  var groups = {};
  filtered.forEach(function(a) {
    if (!groups[a.month]) groups[a.month] = [];
    groups[a.month].push(a);
  });

  var gi = 0;
  Object.keys(groups).forEach(function(month) {
    var items = groups[month];
    var groupEl = document.createElement('div');
    groupEl.className = 'month-group';
    groupEl.innerHTML = '<div class="month-label">' + esc(month) + '</div>';

    items.forEach(function(a, i) {
      var dotHtml = a.unread ? '<div class="unread-dot"></div>' : '';

      var thumbHtml = a.image
        ? '<img class="announce-thumb" src="' + esc(a.image) + '" alt="" onerror="this.style.display=\'none\'" />'
        : '';

      var dateHtml = '<span class="announce-date">' + esc(a.date) + '</span>';

      var byHtml = a.postedBy
        ? '<span class="announce-posted-by">By ' + esc(a.postedBy) + '</span>'
        : '';

      var card = document.createElement('div');
      card.className = 'announce-card';
      card.style.animationDelay = ((gi * 0.05) + (i * 0.06)) + 's';

      card.innerHTML =
        '<div class="announce-body">' +
          '<div class="announce-title">' + esc(a.title) + '</div>' +
          '<div class="announce-desc">'  + esc(a.desc)  + '</div>' +
          '<div class="announce-footer">' +
            '<span class="announce-tag">' + esc(a.category) + '</span>' +
          '</div>' +
          '<span class="announce-read-more">Read more &#8594;</span>' +
        '</div>' +
        '<div class="announce-meta">' +
          dotHtml +
          '<div class="announce-meta-spacer"></div>' +
          '<div class="announce-meta-bottom">' +
            thumbHtml +
            dateHtml +
            byHtml +
          '</div>' +
        '</div>';

      card.addEventListener('click', function() { openDetail(a); });
      groupEl.appendChild(card);
    });

    announceSection.appendChild(groupEl);
    gi++;
  });
}

/* ══════════════════════════════════════════════
   11. DETAIL VIEW
══════════════════════════════════════════════ */
function openDetail(a) {
  if (a.image) {
    detailImg.src = a.image;
    detailImg.alt = a.title;
    detailImgWrap.classList.remove('no-image');
    detailImg.onerror = function() { detailImgWrap.classList.add('no-image'); };
  } else {
    detailImgWrap.classList.add('no-image');
  }

  detailTag.textContent    = a.category;
  detailDate.textContent   = a.date;
  detailTitle.textContent  = a.title;
  detailBody.textContent   = a.fullBody;
  detailAuthor.textContent = a.postedBy || '';

  listView.classList.add('hidden');
  detailView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeDetail() {
  detailView.classList.add('hidden');
  listView.classList.remove('hidden');
}

/* ══════════════════════════════════════════════
   12. EVENT LISTENERS
══════════════════════════════════════════════ */
tabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    tabs.forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    activeFilter = tab.dataset.filter;
    renderList();
  });
});

if (searchInput) {
  searchInput.addEventListener('input', function() {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderList();
  });
}

if (backBtn) {
  backBtn.addEventListener('click', closeDetail);
}

/* ══════════════════════════════════════════════
   13. INIT
══════════════════════════════════════════════ */
(function init() {
  renderStats();
  renderList();
})();