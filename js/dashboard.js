'use strict';

/* ══════════════════════════════════════════════
   dashboard.js
══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   1. SIDEBAR NAV ACTIVE STATE
══════════════════════════════════════════════ */
(function initNav() {
  var current = window.location.pathname.split('/').pop();
  if (!current) current = 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.classList.remove('active');
    var href = (item.getAttribute('href') || '').split('/').pop();
    if (href === current) item.classList.add('active');
    var fresh = item.cloneNode(true);
    item.parentNode.replaceChild(fresh, item);
    if (href === current) {
      fresh.addEventListener('click', function(e) { e.preventDefault(); });
    }
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
var STUDENT = { name: 'Jigme', initials: 'JL' };

var CLUBS = [
  {
    id: 'media',
    name: 'Media Club',
    members: 26,
    announcements: 3,
    attendance: 82,
    announceList: [
      {
        title: 'Photography workshop – Saturday 10 AM',
        desc: 'Join us for a hands-on photography session in the college courtyard. Bring your camera or phone. The session will be guided by our senior members and is open to all skill levels. Equipment will be provided for those who do not have their own. Refreshments will be served after the session.',
        date: 'Apr 5, 2026',
        postedBy: 'Club Advisor',
        postedName: 'Mr. Tenzin Dorji',
        unread: true,
        image: '../image/photography.jpg'
      },
      {
        title: 'Annual magazine submission deadline',
        desc: 'All article and photo submissions for the annual magazine must be sent to the club email by April 10. Late submissions will not be accepted. Refer to the style guide shared last week. Each submission should include a short author bio and a high-resolution photo.',
        date: 'Apr 3, 2026',
        postedBy: 'Club Secretary',
        postedName: 'Karma Wangchuk',
        unread: true,
        image: '../image/2.1.png'
      },
      {
        title: 'Weekly editorial meeting – Thursday 4 PM',
        desc: 'Regular team sync to review content pipeline and assign reporting duties for upcoming events. All core team members are expected to attend. Venue: Media Room 2B. Agenda will be shared by Wednesday evening.',
        date: 'Apr 1, 2026',
        postedBy: 'Club Secretary',
        postedName: 'Karma Wangchuk',
        unread: false
        /* NO image — text-only */
      }
    ]
  },
  {
    id: 'integrity',
    name: 'Integrity Club',
    members: 44,
    announcements: 2,
    attendance: 74,
    announceList: [
      {
        title: 'Q1 Audit Report now available',
        desc: 'The Q1 2026 campus audit report has been published. Members are encouraged to read the full report on the club portal and share feedback during the next meeting.',
        date: 'Apr 4, 2026',
        postedBy: 'Club Advisor',
        postedName: 'Ms. Pema Lhamo',
        unread: true,
        image: '../image/audit.jpg'
      },
      {
        title: 'Ethics workshop – next Wednesday',
        desc: 'A workshop on anti-corruption values and good governance will be held in Seminar Hall A at 2 PM. External facilitators from the Royal Civil Service Commission will lead the session.',
        date: 'Apr 2, 2026',
        postedBy: 'Club Secretary',
        postedName: 'Sonam Tobgay',
        unread: false
        /* NO image */
      }
    ]
  },
  {
    id: 'redcross',
    name: 'Red Cross Club',
    members: 52,
    announcements: 4,
    attendance: 88,
    announceList: [
      {
        title: 'Blood donation drive – April 8',
        desc: 'JNEC Blood Donation Camp will be held at the Main Hall from 9 AM to 3 PM. All eligible students (above 18, weight above 50 kg) are encouraged to participate. Certificates will be issued.',
        date: 'Apr 6, 2026',
        postedBy: 'Club Advisor',
        postedName: 'Dr. Rinzin Namgyal',
        unread: true,
        image: '../image/blooddrive.jpg'
      },
      {
        title: 'First aid training session',
        desc: 'Certified trainers will conduct a basic first aid certification session for all new members this Friday at 2 PM in the Science Block Auditorium. Attendance is mandatory for new members.',
        date: 'Apr 4, 2026',
        postedBy: 'Club Secretary',
        postedName: 'Dechen Zangmo',
        unread: true,
        image: '../image/firstaid.jpg'
      },
      {
        title: 'Disaster preparedness drill',
        desc: 'A campus-wide emergency drill will take place next Monday morning. All members must report by 8 AM in field uniform. The drill will simulate a building evacuation scenario.',
        date: 'Apr 3, 2026',
        postedBy: 'Club Advisor',
        postedName: 'Dr. Rinzin Namgyal',
        unread: false
        /* NO image */
      },
      {
        title: 'Monthly meeting – April 12',
        desc: 'Monthly club meeting to review upcoming events and assign volunteer duties for the semester. Venue: Conference Room 1. Agenda will be shared by Sunday.',
        date: 'Apr 1, 2026',
        postedBy: 'Club Secretary',
        postedName: 'Dechen Zangmo',
        unread: false
        /* NO image */
      }
    ]
  }
];

/* ══════════════════════════════════════════════
   5. CURRENT CLUB STATE
══════════════════════════════════════════════ */
var currentClubIndex = 0;

/* ══════════════════════════════════════════════
   6. MODAL — open / close
══════════════════════════════════════════════ */
function openModal(announcement) {
  var backdrop   = document.getElementById('announce-modal');
  var titleEl    = document.getElementById('modal-title');
  var dateEl     = document.getElementById('modal-date');
  var postedByEl = document.getElementById('modal-posted-by');
  var descEl     = document.getElementById('modal-desc');
  var badgeEl    = document.getElementById('modal-badge-wrap');
  var imgWrap    = document.getElementById('modal-img-wrap');
  var imgEl      = document.getElementById('modal-img');
  if (!backdrop) return;

  titleEl.textContent = announcement.title;
  dateEl.textContent  = announcement.date;
  descEl.textContent  = announcement.desc;

  if (postedByEl) {
    if (announcement.postedBy || announcement.postedName) {
      var label = announcement.postedBy   ? announcement.postedBy + ': '  : '';
      var name  = announcement.postedName ? announcement.postedName        : '';
      postedByEl.textContent = 'By ' + label + name;
      postedByEl.style.display = '';
    } else {
      postedByEl.style.display = 'none';
    }
  }

  if (badgeEl) badgeEl.style.display = announcement.unread ? 'inline-flex' : 'none';

  if (announcement.image) {
    imgEl.src = announcement.image;
    imgEl.alt = announcement.title;
    imgWrap.classList.remove('no-image');
    imgWrap.classList.add('has-image');
    imgEl.onerror = function() {
      imgWrap.classList.add('no-image');
      imgWrap.classList.remove('has-image');
    };
  } else {
    imgWrap.classList.add('no-image');
    imgWrap.classList.remove('has-image');
  }

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  var backdrop = document.getElementById('announce-modal');
  if (!backdrop) return;
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════
   7. MODAL EVENT LISTENERS
══════════════════════════════════════════════ */
(function initModal() {
  var closeBtn = document.getElementById('modal-close-btn');
  var backdrop = document.getElementById('announce-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) closeModal();
    });
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });
})();

/* ══════════════════════════════════════════════
   8. HELPERS
══════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════════════
   9. RENDER DASHBOARD
══════════════════════════════════════════════ */
function renderDashboard(clubIndex) {
  var club = CLUBS[clubIndex];
  if (!club) return;

  var statsGridEl      = document.getElementById('statsGrid');
  var announceListEl   = document.getElementById('announceList');
  var greetingTitleEl  = document.getElementById('greetingTitle');
  var greetingSubEl    = document.getElementById('greetingSub');
  var topbarTitleEl    = document.getElementById('topbar-title');
  var topbarSubtitleEl = document.getElementById('topbar-subtitle');
  var notifBadgeEl     = document.getElementById('notif-badge');

  function getGreeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function animateCount(el, target, suffix) {
    if (!el) return;
    suffix = suffix || '';
    var dur = 700, start = performance.now();
    function tick(now) {
      var prog = Math.min((now - start) / dur, 1);
      var ease = 1 - Math.pow(1 - prog, 3);
      el.textContent = Math.round(target * ease) + suffix;
      if (prog < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (topbarTitleEl)    topbarTitleEl.textContent    = 'Dashboard';
  if (topbarSubtitleEl) topbarSubtitleEl.textContent = 'Welcome back to your dashboard';
  if (greetingTitleEl)  greetingTitleEl.textContent  = getGreeting() + ', ' + STUDENT.name;
  if (greetingSubEl)    greetingSubEl.textContent    = "You're viewing your dashboard for " + club.name;

  /* Stat cards */
  if (statsGridEl) {
    statsGridEl.innerHTML =
      '<div class="stat-card">' +
        '<div class="stat-label">Total Members</div>' +
        '<div class="stat-value" id="statMembers">0</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-label">Announcements</div>' +
        '<div class="stat-value" id="statAnnounce">0</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-label">My Attendance</div>' +
        '<div class="stat-value" id="statAttend">0</div>' +
      '</div>';

    requestAnimationFrame(function() {
      animateCount(document.getElementById('statMembers'),  club.members);
      animateCount(document.getElementById('statAnnounce'), club.announcements);
      animateCount(document.getElementById('statAttend'),   club.attendance, '%');
    });
  }

  /* Announcement list */
  if (!announceListEl) return;

  if (!club.announceList || club.announceList.length === 0) {
    announceListEl.innerHTML =
      '<div class="empty-state">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>' +
          '<path d="M13.73 21a2 2 0 0 1-3.46 0"/>' +
        '</svg>' +
        '<strong>No announcements yet</strong>' +
        '<p>Check back later for updates from ' + club.name + '.</p>' +
      '</div>';
  } else {
    announceListEl.innerHTML = club.announceList.map(function(a, i) {

      /*
        META COLUMN layout — always:
          TOP:    blue dot (if unread)
          MIDDLE: spacer (pushes date+by to bottom)  ← KEY FIX
          BOTTOM: thumbnail (if any) + date + posted-by

        The .announce-meta-bottom div is a flex sub-group
        that holds thumb + date + by, always aligned to the
        bottom of the column via the spacer above it.
      */

      /* Unread dot — TOP of meta */
      var dotHtml = a.unread ? '<div class="announce-unread"></div>' : '';

      /* Thumbnail (only if image exists) */
      var thumbHtml = a.image
        ? '<img class="announce-thumb" src="' + escapeHtml(a.image) + '" alt="" onerror="this.style.display=\'none\'" />'
        : '';

      /* Date */
      var dateHtml = '<span class="announce-date">' + escapeHtml(a.date) + '</span>';

      /* Posted-by */
      var postedHtml = '';
      if (a.postedBy || a.postedName) {
        var label = a.postedBy   ? a.postedBy + ': '  : '';
        var name  = a.postedName ? a.postedName        : '';
        postedHtml = '<span class="announce-posted-by">By ' + escapeHtml(label + name) + '</span>';
      }

      /*
        Structure:
          .announce-meta
            .announce-unread          ← dot at top (if unread)
            .announce-meta-spacer     ← flex:1 pushes bottom group down
            .announce-meta-bottom     ← thumb + date + by, always at bottom
      */
      return (
        '<div class="announce-item" data-index="' + i + '" style="animation-delay:' + (i * 0.07) + 's;">' +
          '<div class="announce-body">' +
            '<div class="announce-title">' + escapeHtml(a.title) + '</div>' +
            '<div class="announce-desc">'  + escapeHtml(a.desc)  + '</div>' +
            '<span class="announce-read-more">Read more &#8594;</span>' +
          '</div>' +
          '<div class="announce-meta">' +
            dotHtml +
            '<div class="announce-meta-spacer"></div>' +
            '<div class="announce-meta-bottom">' +
              thumbHtml +
              dateHtml +
              postedHtml +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    announceListEl.querySelectorAll('.announce-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(el.getAttribute('data-index'), 10);
        openModal(club.announceList[idx]);
        var dot = el.querySelector('.announce-unread');
        if (dot) dot.remove();
      });
    });
  }

  if (notifBadgeEl) notifBadgeEl.style.display = 'block';
}

/* ══════════════════════════════════════════════
   10. BOOT
══════════════════════════════════════════════ */
renderDashboard(currentClubIndex);