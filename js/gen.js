'use strict';

/* =============================================
   CLUB DATA
============================================= */
var CLUB_DATA = {
  "Y-Peer": {
    category: "Volunteering",
    aim: "To empower students as peer educators who champion health, well-being, and informed decision-making across the JNEC campus.",
    description: "Y-Peer is a youth-led peer education network dedicated to promoting health, well-being, and informed decision-making among students. Members are trained as peer educators who spread awareness on topics such as reproductive health, substance abuse prevention, and mental wellness.",
    objectives: ["Train student peer educators to deliver health awareness sessions.", "Promote a culture of openness and informed decision-making among youth.", "Collaborate with health organizations for outreach programs.", "Reduce stigma around sensitive health topics on campus."],
    adviser: "Mr. Karma Dorji", secretary: "Pema Wangchuk", members: "45+"
  },
  "Rover Scout": {
    category: "Volunteering",
    aim: "To build disciplined, service-oriented leaders through scouting activities rooted in the motto: Be Prepared.",
    description: "Rover Scout is the senior branch of the Bhutan Scout Association operating within JNEC. Rovers engage in community service, outdoor adventures, leadership development, and national events — living by the Scout motto: Be Prepared.",
    objectives: ["Develop leadership and teamwork through scouting activities.", "Participate in national and regional scout jamborees.", "Organize community service drives and environmental campaigns.", "Foster discipline, integrity, and civic responsibility."],
    adviser: "Mr. Tshering Namgay", secretary: "Dorji Lhamo", members: "60+"
  },
  "Red Cross": {
    category: "Volunteering",
    aim: "To embody the Red Cross principles of humanity and impartiality by serving the campus and broader community through humanitarian initiatives.",
    description: "The JNEC Red Cross Youth Club is affiliated with the Bhutan Red Cross Society and focuses on humanitarian aid, first aid training, blood donation drives, and disaster preparedness. Members embody the Red Cross principles of humanity and impartiality.",
    objectives: ["Organize regular blood donation camps on campus.", "Train members in first aid and basic life support.", "Support disaster relief and humanitarian initiatives.", "Raise awareness about health emergencies and prevention."],
    adviser: "Ms. Sonam Choden", secretary: "Kinley Tshering", members: "50+"
  },
  "JNEC Clean Toilet Initiative": {
    category: "Volunteering",
    aim: "To create and sustain a hygienic, respectful campus environment by promoting shared responsibility for common sanitation facilities.",
    description: "The JNEC Clean Toilet Initiative promotes hygiene, sanitation, and cleanliness across campus facilities. Members lead awareness campaigns, monitoring rosters, and maintenance drives to ensure clean and safe restroom facilities for all students.",
    objectives: ["Maintain cleanliness and hygiene standards across campus toilets.", "Run awareness campaigns on personal hygiene and sanitation.", "Coordinate with facilities management for timely repairs.", "Inspire a culture of shared responsibility for common spaces."],
    adviser: "Mr. Ugyen Tenzin", secretary: "Chimi Wangmo", members: "30+"
  },
  "Mechanical Maintenance": {
    category: "Maintenance",
    aim: "To apply mechanical engineering knowledge in maintaining campus infrastructure while building practical, hands-on technical competence.",
    description: "The Mechanical Maintenance Club is run by mechanical engineering students who maintain and repair mechanical equipment, machinery, and infrastructure across the JNEC campus. Members gain hands-on technical skills while serving the college.",
    objectives: ["Maintain and service mechanical equipment on campus.", "Provide practical exposure to real-world engineering problems.", "Assist departments with mechanical repairs and projects.", "Promote a proactive maintenance culture among students."],
    adviser: "Mr. Jigme Wangdi", secretary: "Tenzin Phuntsho", members: "35+"
  },
  "Civil Maintenance": {
    category: "Maintenance",
    aim: "To bridge classroom civil engineering knowledge with real campus infrastructure maintenance and improvement projects.",
    description: "The Civil Maintenance Club comprises civil engineering students who assist in upkeep of buildings, pathways, drainage systems, and structural elements across campus. The club bridges academic learning with real infrastructure challenges.",
    objectives: ["Monitor and maintain campus civil infrastructure.", "Assist in minor construction and renovation projects.", "Conduct structural safety audits of campus facilities.", "Apply civil engineering concepts in practical campus projects."],
    adviser: "Mr. Karma Tobgay", secretary: "Sonam Peldon", members: "28+"
  },
  "DIT Maintenance": {
    category: "Maintenance",
    aim: "To keep JNEC's digital and technical infrastructure running smoothly, empowering students as the technical backbone of the college.",
    description: "The DIT Maintenance Club is formed by IT and electronics students who manage the digital and technical infrastructure of JNEC — including computer labs, networks, projectors, and software systems. They are the technical backbone of the college.",
    objectives: ["Maintain and troubleshoot IT hardware and software systems.", "Manage computer lab upkeep and network connectivity.", "Support departments with digital tools and AV equipment.", "Train students in IT maintenance best practices."],
    adviser: "Ms. Dechen Zangmo", secretary: "Tashi Dorji", members: "40+"
  },
  "Maintenance Hobby Club": {
    category: "Maintenance",
    aim: "To cultivate a hands-on DIY culture where students bond over the shared joy of fixing, building, and making things work.",
    description: "The Maintenance Hobby Club is an informal, passion-driven group where students with interests in fixing, building, and tinkering come together. From electronics to furniture repairs, this club is for those who love to make things work.",
    objectives: ["Encourage a DIY culture among engineering students.", "Organize repair workshops and skill-sharing sessions.", "Tackle small campus fix-it projects as a team.", "Bridge hobbyist interests with practical engineering skills."],
    adviser: "Mr. Namgay Wangchuk", secretary: "Phurpa Tshering", members: "22+"
  },
  "Electrical Maintenance": {
    category: "Maintenance",
    aim: "To ensure a safe, well-lit campus by maintaining electrical systems while equipping students with real-world electrical engineering skills.",
    description: "The Electrical Maintenance Club handles the upkeep of electrical systems, wiring, lighting, and power distribution across JNEC's campus. Electrical engineering students gain practical exposure while ensuring a safe and well-lit campus environment.",
    objectives: ["Maintain electrical installations and systems across campus.", "Identify and fix electrical faults promptly and safely.", "Conduct electrical safety audits and awareness sessions.", "Collaborate with the facilities team on power infrastructure."],
    adviser: "Mr. Rinzin Dorji", secretary: "Karma Yangdon", members: "32+"
  },
  "Helping Hand Club": {
    category: "Social Service",
    aim: "To build an empathetic campus culture by reaching out compassionately to those in need — within the college and beyond.",
    description: "The Helping Hand Club is dedicated to supporting vulnerable members of the JNEC community and beyond. From fundraising to direct assistance, members embody compassion in action — reaching out to those who need a helping hand.",
    objectives: ["Provide support to financially disadvantaged students.", "Organize fundraisers and charity events.", "Coordinate with NGOs for broader social impact.", "Build an empathetic and community-minded campus culture."],
    adviser: "Ms. Pema Lhamo", secretary: "Tenzin Wangchuk", members: "38+"
  },
  "JNEC GNH": {
    category: "Social Service",
    aim: "To embed Bhutan's Gross National Happiness philosophy into campus life through mindfulness, sustainability, and cultural appreciation.",
    description: "Inspired by Bhutan's philosophy of Gross National Happiness, the JNEC GNH Club promotes holistic well-being, mindfulness, cultural appreciation, and sustainable living among students. It is a space for reflection, creativity, and meaningful connection.",
    objectives: ["Promote the principles of GNH among the student community.", "Organize mindfulness, meditation, and wellness activities.", "Celebrate Bhutanese culture, values, and traditions.", "Encourage sustainable and responsible campus living."],
    adviser: "Mr. Tshewang Rinzin", secretary: "Deki Wangmo", members: "45+"
  },
  "JNEC Salon": {
    category: "Social Service",
    aim: "To provide accessible grooming and personal care to all students while training volunteers in practical salon skills.",
    description: "The JNEC Salon Club provides affordable grooming and personal care services to students, operated by trained student volunteers. It combines skill development with social service, ensuring every student can present themselves with confidence.",
    objectives: ["Offer free or subsidized grooming services to students.", "Train student volunteers in basic salon skills.", "Promote personal hygiene and self-care awareness.", "Generate a sense of service and community care."],
    adviser: "Ms. Tshering Pem", secretary: "Yeshey Dorji", members: "20+"
  },
  "Thakor Namsung Tshokpa": {
    category: "Social Service",
    aim: "To preserve Bhutanese cultural heritage and strengthen community solidarity through shared traditions and communal events.",
    description: "Thakor Namsung Tshokpa is a cultural and social service club rooted in Bhutanese traditions of communal solidarity. The club organizes events that honor Bhutanese heritage while fostering unity, mutual support, and shared identity among students.",
    objectives: ["Preserve and celebrate Bhutanese cultural traditions.", "Foster community solidarity and mutual support.", "Organize cultural programs and community gatherings.", "Strengthen the bond between students of shared heritage."],
    adviser: "Mr. Ugyen Namgay", secretary: "Sangay Tshering", members: "55+"
  },
  "Integrity Club": {
    category: "Social Service",
    aim: "To cultivate a campus culture where honesty, accountability, and ethical conduct are not just values — but lived daily practices.",
    description: "The Integrity Club promotes ethical conduct, transparency, and accountability within JNEC. Through awareness campaigns, audits, and open forums, the club nurtures a culture where honesty and integrity are lived values — not just words.",
    objectives: ["Promote a culture of honesty, ethics, and accountability.", "Conduct campus integrity awareness campaigns.", "Publish annual integrity audit reports.", "Facilitate open forums for ethical discussion and feedback."],
    adviser: "Mr. Dorji Tshering", secretary: "Kinley Wangmo", members: "30+"
  },
  "Entrepreneurship Club": {
    category: "Entrepreneurship",
    aim: "To ignite entrepreneurial spirit in every student — transforming ideas into ventures and dreamers into doers.",
    description: "The JNEC Entrepreneurship Club is the launchpad for student innovators and business-minded thinkers. From pitch competitions to startup mentoring, the club creates an ecosystem where ideas become ventures and students become entrepreneurs.",
    objectives: ["Foster entrepreneurial thinking and innovation on campus.", "Organize startup pitches, hackathons, and ideathons.", "Connect students with mentors, investors, and industry leaders.", "Support student ventures from ideation to early-stage growth."],
    adviser: "Mr. Sonam Wangdi", secretary: "Pema Dorji", members: "50+"
  },
  "JNEC Music Club": {
    category: "Entertainment",
    aim: "To celebrate music as a universal language — nurturing talent, preserving Bhutanese musical heritage, and uniting the campus community.",
    description: "The JNEC Music Club is the creative heart of the college's musical life. From classical Bhutanese melodies to contemporary compositions, members rehearse, perform, and collaborate — celebrating music as a universal language that unites the campus community.",
    objectives: ["Nurture musical talent across genres and instruments.", "Perform at college events, festivals, and competitions.", "Organize open mic nights and music workshops.", "Preserve and promote Bhutanese musical heritage."],
    adviser: "Ms. Karma Choden", secretary: "Tashi Namgay", members: "40+"
  },
  "Culture Club": {
    category: "Entertainment",
    aim: "To celebrate and safeguard the rich cultural diversity of JNEC through performance, art, and intercultural dialogue.",
    description: "The Culture Club is the guardian of JNEC's rich cultural diversity. Through dance, drama, traditional performances, and cultural exhibitions, the club brings students together to celebrate their roots and explore new artistic horizons.",
    objectives: ["Organize cultural performances for college and community events.", "Promote diversity, inclusion, and cultural exchange.", "Train students in traditional Bhutanese arts and crafts.", "Represent JNEC at inter-college cultural competitions."],
    adviser: "Ms. Deki Pem", secretary: "Sonam Tobgay", members: "70+"
  },
  "Media Club": {
    category: "Entertainment",
    aim: "To document, amplify, and share the stories of JNEC through professional multimedia storytelling and digital communication.",
    description: "The JNEC Media Club is the college's storytelling powerhouse — producing videos, photos, news articles, and social media content that document campus life. Members develop skills in journalism, videography, graphic design, and digital communication.",
    objectives: ["Document and share JNEC events through multimedia content.", "Train students in photography, videography, and journalism.", "Manage JNEC's social media presence and publications.", "Produce the college newsletter and annual magazine."],
    adviser: "Mr. Sangay Dorji", secretary: "Choki Wangmo", members: "35+"
  },
  "Radio Club": {
    category: "Entertainment",
    aim: "To give every student a voice — broadcasting creativity, news, and expression through the JNEC campus radio channel.",
    description: "The JNEC Radio Club operates the campus radio channel, giving students a platform to broadcast music, news, interviews, and creative programs. It's where budding radio jockeys, sound engineers, and content creators find their voice.",
    objectives: ["Operate and manage the JNEC campus radio channel.", "Produce engaging radio programs and podcasts.", "Train students in broadcasting and audio production.", "Provide a creative platform for student expression and debate."],
    adviser: "Mr. Tenzin Norbu", secretary: "Pema Zangmo", members: "25+"
  },
  "JNEC Karate": {
    category: "Sports",
    aim: "To develop disciplined, physically fit, and mentally resilient martial artists who embody the spirit of Budo on and off the mat.",
    description: "JNEC Karate is the premier martial arts club on campus, training students in the discipline of Shotokan Karate. Under certified instructors, members develop physical fitness, self-defense skills, mental focus, and the warrior spirit of Budo.",
    objectives: ["Train students in Shotokan Karate techniques and kata.", "Participate in district, national, and inter-college championships.", "Promote physical fitness and mental discipline.", "Develop character, respect, and perseverance through martial arts."],
    adviser: "Mr. Karma Wangdi", secretary: "Thinley Dorji", members: "48+"
  }
};

/* CATEGORY → CLUBS mapping */
var CAT_CLUBS = {
  "Volunteering":    ["Y-Peer", "Rover Scout", "Red Cross", "JNEC Clean Toilet Initiative"],
  "Maintenance":     ["Mechanical Maintenance", "Civil Maintenance", "DIT Maintenance", "Maintenance Hobby Club", "Electrical Maintenance"],
  "Social Service":  ["Helping Hand Club", "JNEC GNH", "JNEC Salon", "Thakor Namsung Tshokpa", "Integrity Club"],
  "Entrepreneurship":["Entrepreneurship Club"],
  "Entertainment":   ["JNEC Music Club", "Culture Club", "Media Club", "Radio Club"],
  "Sports":          ["JNEC Karate"]
};

/* CATEGORY COLORS */
var CAT_BG = {
  "Volunteering":"#e1f5ee","Maintenance":"#f1efe8","Social Service":"#faece7",
  "Entrepreneurship":"#faeeda","Entertainment":"#faeeda","Sports":"#e6f1fb"
};
var CAT_TC = {
  "Volunteering":"#085041","Maintenance":"#2c2c2a","Social Service":"#712b13",
  "Entrepreneurship":"#633806","Entertainment":"#633806","Sports":"#0c447c"
};

/* Build flat clubs array */
var ALL_CLUBS = Object.keys(CLUB_DATA).map(function(name){
  return Object.assign({ name: name }, CLUB_DATA[name]);
});

var CATEGORIES = Object.keys(CAT_CLUBS);
var MAX_MY_CLUBS = 3;
var MY_CLUBS_KEY = 'jnec_student_my_clubs';
var currentFilter = 'All';
var currentClubName = null;

/* =============================================
   DASHBOARD URL MAPPING
   -----------------------------------------------
   Map each club name to its dashboard HTML file.
   Update the paths below to match your actual
   dashboard file names/locations.
============================================= */
var CLUB_DASHBOARDS = {
  "Y-Peer":                    "../html/dashboard.html",
  "Rover Scout":               "../html/dashboard.html",
  "Red Cross":                 "../html/dashboard.html",
  "JNEC Clean Toilet Initiative": "../html/dashboard.html",
  "Mechanical Maintenance":    "../html/dashboard.html",
  "Civil Maintenance":         "../html/dashboard.html",
  "DIT Maintenance":           "../html/dashboard.html",
  "Maintenance Hobby Club":    "../html/dashboard.html",
  "Electrical Maintenance":    "../html/dashboard.html",
  "Helping Hand Club":         "../html/dashboard.html",
  "JNEC GNH":                  "../html/dashboard.html",
  "JNEC Salon":                "../html/dashboard.html",
  "Thakor Namsung Tshokpa":   "../html/dashboard.html",
  "Integrity Club":            "../html/dashboard.html",
  "Entrepreneurship Club":     "../html/dashboard.html",
  "JNEC Music Club":           "../html/dashboard.html",
  "Culture Club":              "../html/dashboard.html",
  "Media Club":                "../html/dashboard.html",   /* <-- your existing media dashboard */
  "Radio Club":                ".../html/dashboard.html",
  "JNEC Karate":               "../html/dashboard.html"
};

/* =============================================
   MY CLUBS — localStorage
============================================= */
function loadMyClubs() {
  try { return JSON.parse(localStorage.getItem(MY_CLUBS_KEY)) || []; }
  catch(e) { return []; }
}
function saveMyClubs(arr) { localStorage.setItem(MY_CLUBS_KEY, JSON.stringify(arr)); }
function isJoined(name) { return loadMyClubs().some(function(c){ return c.name === name; }); }

/* =============================================
   GO TO CLUB DASHBOARD
   Called when a filled "My Club" slot is clicked.
   Redirects to that club's dashboard page.
============================================= */
function goToClubDashboard(name) {
  var url = CLUB_DASHBOARDS[name];
  if (url) {
    window.location.href = url;
  } else {
    /* Fallback: if no dashboard mapped, open the detail modal */
    openClubModal(name);
  }
}

function renderMyClubs() {
  var arr = loadMyClubs();
  var row = document.getElementById('myclub-cards-row');
  var hint = document.getElementById('myclub-empty-hint');
  if (hint) hint.style.display = arr.length === 0 ? 'block' : 'none';
  if (!row) return;

  var hints = ['Browse clubs and click Join Club', 'You can join up to 3 clubs', 'More clubs, more experiences!'];
  var html = '';
  for (var i = 0; i < MAX_MY_CLUBS; i++) {
    if (arr[i]) {
      /* ---- CHANGED: onclick now calls goToClubDashboard() instead of openClubModal() ---- */
      html += '<div class="myclub-slot filled" onclick="goToClubDashboard(\'' + esc(arr[i].name) + '\')" title="Go to ' + esc(arr[i].name) + ' dashboard">' +
        '<div class="myclub-slot-avatar">' + arr[i].name.charAt(0).toUpperCase() + '</div>' +
        '<div class="myclub-slot-info">' +
          '<div class="myclub-slot-name">' + esc(arr[i].name) + '</div>' +
          '<span class="myclub-slot-cat">' + esc(arr[i].category || '') + '</span>' +
        '</div>' +
        '<div class="myclub-slot-arrow">›</div>' +
      '</div>';
    } else {
      html += '<div class="myclub-slot empty">' +
        '<div class="slot-icon">+</div>' +
        '<div class="slot-txt">' + hints[i] + '</div>' +
      '</div>';
    }
  }
  row.innerHTML = html;
}

/* =============================================
   SCROLL PROGRESS + NAV DARKEN
============================================= */
window.addEventListener('scroll', function(){
  var scrollTop = window.scrollY;
  var docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var bar = document.getElementById('scroll-progress');
  if (bar) bar.style.width = (docH > 0 ? (scrollTop / docH) * 100 : 0) + '%';
  var nav = document.getElementById('main-nav');
  if (nav) nav.classList.toggle('scrolled', scrollTop > 100);
});

/* =============================================
   HAMBURGER
============================================= */
var menuOpen = false;
var hamburger = document.getElementById('hamburger');
var mobileMenu = document.getElementById('mobile-menu');

function closeMobileMenu() {
  menuOpen = false;
  if (hamburger) hamburger.classList.remove('open');
  if (mobileMenu) mobileMenu.classList.remove('open');
  document.body.classList.remove('menu-open');
}

if (hamburger) {
  hamburger.addEventListener('click', function(e){
    e.stopPropagation();
    menuOpen = !menuOpen;
    hamburger.classList.toggle('open', menuOpen);
    if (mobileMenu) mobileMenu.classList.toggle('open', menuOpen);
    document.body.classList.toggle('menu-open', menuOpen);
  });
}
document.addEventListener('click', function(e){
  if (menuOpen && mobileMenu && !mobileMenu.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
    closeMobileMenu();
  }
});

/* =============================================
   RIPPLE
============================================= */
document.addEventListener('click', function(e){
  var btn = e.target.closest('.ripple-btn');
  if (!btn) return;
  var ripple = document.createElement('span');
  ripple.className = 'ripple-wave';
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
  btn.appendChild(ripple);
  setTimeout(function(){ ripple.remove(); }, 600);
});

/* =============================================
   FADE IN OBSERVER
============================================= */
var fadeObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function observeCards() {
  document.querySelectorAll('.fade-in-card').forEach(function(el){ fadeObserver.observe(el); });
}

/* =============================================
   HERO SLIDESHOW
============================================= */
var slideIdx = 0;
var slideIds = ['slide1','slide2','slide3'];
setInterval(function(){
  document.getElementById(slideIds[slideIdx]).classList.remove('active');
  slideIdx = (slideIdx + 1) % 3;
  document.getElementById(slideIds[slideIdx]).classList.add('active');
}, 5000);

/* =============================================
   TYPEWRITER
============================================= */
(function(){
  var chars = 'Find your Club\nat JNEC'.split('');
  var idx = 0;
  var el = document.getElementById('typewriter');
  function step() {
    if (idx <= chars.length) {
      var plain = chars.slice(0, idx).join('');
      var html = '', i = 0;
      while (i < plain.length) {
        if (plain.slice(i, i+10) === 'Find your ') { html += 'Find your '; i += 10; }
        else if (plain.slice(i, i+4) === 'Club') { html += '<em>Club</em>'; i += 4; }
        else if (plain[i] === '\n') { html += '<br>'; i++; }
        else { html += plain[i]; i++; }
      }
      if (el) el.innerHTML = html;
      idx++;
      setTimeout(step, 65);
    }
  }
  setTimeout(step, 400);
})();

/* =============================================
   NAVBAR CATEGORIES — desktop dropdowns (FIXED)
============================================= */
function buildNavCats() {
  var container = document.getElementById('nav-cats');
  if (!container) return;
  container.innerHTML = '';

  CATEGORIES.forEach(function(cat){
    var item = document.createElement('div');
    item.className = 'nav-cat-item';

    var btn = document.createElement('button');
    btn.className = 'nav-cat-btn';
    btn.innerHTML = esc(cat) + ' <span class="arr">▾</span>';

    var dd = document.createElement('div');
    dd.className = 'cat-dropdown';

    CAT_CLUBS[cat].forEach(function(clubName){
      var ddItem = document.createElement('div');
      ddItem.className = 'cat-dd-item';
      ddItem.textContent = clubName;
      ddItem.addEventListener('mousedown', function(e){
        e.preventDefault();
        openClubModal(clubName);
        closeAllDropdowns();
      });
      dd.appendChild(ddItem);
    });

    item.appendChild(btn);
    item.appendChild(dd);
    container.appendChild(item);

    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = dd.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        var btnRect = btn.getBoundingClientRect();
        dd.style.top  = (btnRect.bottom + 6) + 'px';
        dd.style.left = btnRect.left + 'px';
        dd.classList.add('open');
        btn.classList.add('open');
      }
    });
  });
}

/* =============================================
   MOBILE CATEGORIES
============================================= */
function buildMobileCats() {
  var container = document.getElementById('mobile-cats');
  if (!container) return;
  container.innerHTML = '';

  CATEGORIES.forEach(function(cat){
    var section = document.createElement('div');
    section.className = 'mobile-cat-section';

    var header = document.createElement('div');
    header.className = 'mobile-cat-header';
    header.textContent = cat;
    header.addEventListener('click', function(){ section.classList.toggle('expanded'); });

    var list = document.createElement('div');
    list.className = 'mobile-cat-list';

    CAT_CLUBS[cat].forEach(function(clubName){
      var itm = document.createElement('div');
      itm.className = 'mobile-cat-club';
      itm.textContent = clubName;
      itm.addEventListener('click', function(){
        openClubModal(clubName);
        closeMobileMenu();
      });
      list.appendChild(itm);
    });

    section.appendChild(header);
    section.appendChild(list);
    container.appendChild(section);
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.cat-dropdown').forEach(function(d){ d.classList.remove('open'); });
  document.querySelectorAll('.nav-cat-btn').forEach(function(b){ b.classList.remove('open'); });
}

document.addEventListener('click', function(e){
  if (!e.target.closest('.nav-cat-item')) {
    closeAllDropdowns();
  }
});

function repositionDropdowns() {
  document.querySelectorAll('.cat-dropdown.open').forEach(function(dd){
    var btn = dd.previousElementSibling;
    if (btn) {
      var btnRect = btn.getBoundingClientRect();
      dd.style.top  = (btnRect.bottom + 6) + 'px';
      dd.style.left = btnRect.left + 'px';
    }
  });
}
window.addEventListener('scroll', repositionDropdowns, { passive: true });
window.addEventListener('resize', function(){ closeAllDropdowns(); });

/* =============================================
   FILTER PILLS
============================================= */
function buildPills() {
  var row = document.getElementById('pill-row');
  if (!row) return;

  var allPill = document.createElement('span');
  allPill.className = 'pill on';
  allPill.textContent = 'All';
  allPill.addEventListener('click', function(){ filterClubs('All', allPill); });
  row.appendChild(allPill);

  CATEGORIES.forEach(function(cat){
    var pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = cat;
    pill.addEventListener('click', function(){ filterClubs(cat, pill); });
    row.appendChild(pill);
  });
}

function filterClubs(cat, el) {
  currentFilter = cat;
  document.querySelectorAll('.pill').forEach(function(p){ p.classList.remove('on'); });
  if (el) el.classList.add('on');
  applyFilter();
}

/* =============================================
   SEARCH
============================================= */
function doSearch(q) {
  ['nav-search-input','nav-mobile-search-input'].forEach(function(id){
    var el = document.getElementById(id);
    if (el && el.value !== q) el.value = q;
  });
  applyFilter();
  if (q.length > 0) {
    setTimeout(function(){
      var sec = document.getElementById('clubs-section');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }
}

function handleSearchEnter(e) {
  if (e.key !== 'Enter') return;
  var q = getSearchQuery().toLowerCase().trim();
  if (!q) return;
  var filtered = ALL_CLUBS.filter(function(c){
    return c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });
  if (filtered.length === 1) {
    openClubModal(filtered[0].name);
  } else {
    var sec = document.getElementById('clubs-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function getSearchQuery() {
  var a = document.getElementById('nav-search-input');
  var b = document.getElementById('nav-mobile-search-input');
  return (a && a.value) || (b && b.value) || '';
}

function applyFilter() {
  var q = getSearchQuery().toLowerCase();
  var list = currentFilter === 'All' ? ALL_CLUBS : ALL_CLUBS.filter(function(c){ return c.category === currentFilter; });
  if (q) list = list.filter(function(c){ return c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q); });
  renderClubs(list);
}

/* =============================================
   RENDER CLUBS GRID
============================================= */
function renderClubs(list) {
  var g = document.getElementById('clubs-grid');
  if (!g) return;
  g.innerHTML = '';
  if (!list.length) {
    g.innerHTML = '<p style="color:#aaa;font-size:14px;padding:1rem 0;">No clubs found.</p>';
    return;
  }
  list.forEach(function(club){
    var bg = CAT_BG[club.category] || '#eee';
    var tc = CAT_TC[club.category] || '#555';
    var shortDesc = club.description.length > 100 ? club.description.slice(0, 100) + '...' : club.description;
    var card = document.createElement('div');
    card.className = 'club-card fade-in-card';
    card.innerHTML =
      '<div class="cc-body">' +
        '<div class="cc-name">' + esc(club.name) + '</div>' +
        '<div class="cc-desc">' + esc(shortDesc) + '</div>' +
        '<div class="cc-foot">' +
          '<span class="cc-mem">' + esc(club.members) + ' members</span>' +
          '<span class="cc-tag" style="background:' + bg + ';color:' + tc + ';">' + esc(club.category) + '</span>' +
        '</div>' +
        '<button class="view-btn ripple-btn">View club</button>' +
      '</div>';
    card.addEventListener('click', function(){ openClubModal(club.name); });
    card.querySelector('.view-btn').addEventListener('click', function(e){ e.stopPropagation(); openClubModal(club.name); });
    g.appendChild(card);
    fadeObserver.observe(card);
  });
}

/* =============================================
   CLUB DETAIL MODAL
============================================= */
function openClubModal(name) {
  var club = CLUB_DATA[name];
  if (!club) return;
  currentClubName = name;

  document.getElementById('m-name').textContent = name;
  document.getElementById('m-cat').textContent  = club.category;
  document.getElementById('m-aim').textContent  = club.aim;
  document.getElementById('m-desc').textContent = club.description;
  document.getElementById('m-mem').textContent  = club.members;
  document.getElementById('m-adv').textContent  = club.adviser;
  document.getElementById('m-sec').textContent  = club.secretary || '—';

  document.getElementById('m-objs').innerHTML = club.objectives.map(function(o){
    return '<div class="modal-obj-item"><div class="modal-obj-bullet"></div><div class="modal-sec-val">' + esc(o) + '</div></div>';
  }).join('');

  updateJoinBtnState(name);
  document.getElementById('club-overlay').classList.add('open');
}

function closeClubModal() {
  document.getElementById('club-overlay').classList.remove('open');
  currentClubName = null;
}

function updateJoinBtnState(name) {
  var joinBtn   = document.getElementById('modal-join-btn');
  var joinBadge = document.getElementById('modal-joined-badge');
  var arr = loadMyClubs();
  var joined = isJoined(name);
  var full   = arr.length >= MAX_MY_CLUBS;

  if (joined) {
    joinBtn.style.display   = 'none';
    joinBadge.style.display = 'inline-flex';
  } else if (full) {
    joinBtn.style.display   = 'inline-block';
    joinBtn.disabled        = true;
    joinBtn.textContent     = 'Max 3 clubs reached';
    joinBadge.style.display = 'none';
  } else {
    joinBtn.style.display   = 'inline-block';
    joinBtn.disabled        = false;
    joinBtn.textContent     = 'Join Club';
    joinBadge.style.display = 'none';
  }
}

document.getElementById('club-overlay').addEventListener('click', function(e){
  if (e.target === this) closeClubModal();
});

/* =============================================
   ENROLLMENT MODAL
============================================= */
function openEnrollModal() {
  if (!currentClubName) return;
  document.getElementById('enroll-club-name').textContent = currentClubName;
  document.getElementById('enroll-key-input').value = '';
  document.getElementById('enroll-key-input').classList.remove('err');
  document.getElementById('enroll-key-input').type = 'password';
  document.getElementById('enroll-error').style.display = 'none';
  document.getElementById('enroll-overlay').classList.add('open');
  setTimeout(function(){ document.getElementById('enroll-key-input').focus(); }, 120);
}

function closeEnrollModal() {
  document.getElementById('enroll-overlay').classList.remove('open');
}

function toggleKeyVisibility() {
  var inp = document.getElementById('enroll-key-input');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function submitEnrollment() {
  var inp   = document.getElementById('enroll-key-input');
  var errEl = document.getElementById('enroll-error');
  var key   = inp.value.trim();

  inp.classList.remove('err');
  errEl.style.display = 'none';

  if (!key) {
    inp.classList.add('err');
    errEl.textContent    = 'Please enter the enrollment key provided by your club advisor.';
    errEl.style.display  = 'block';
    inp.focus();
    return;
  }

  var arr = loadMyClubs();
  if (isJoined(currentClubName)) {
    errEl.textContent   = 'You have already joined ' + currentClubName + '.';
    errEl.style.display = 'block';
    return;
  }
  if (arr.length >= MAX_MY_CLUBS) {
    inp.classList.add('err');
    errEl.textContent   = 'You have already joined the maximum of 3 clubs.';
    errEl.style.display = 'block';
    return;
  }

  var club = CLUB_DATA[currentClubName];
  arr.push({ name: currentClubName, category: club ? club.category : '' });
  saveMyClubs(arr);

  closeEnrollModal();
  closeClubModal();
  renderMyClubs();

  setTimeout(function(){
    var sec = document.getElementById('myclub-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 250);

  showToast('✓ You have joined ' + currentClubName + '!', 'success');
}

document.getElementById('enroll-overlay').addEventListener('click', function(e){
  if (e.target === this) closeEnrollModal();
});

document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  if (document.getElementById('enroll-overlay').classList.contains('open')) {
    closeEnrollModal();
  } else if (document.getElementById('club-overlay').classList.contains('open')) {
    closeClubModal();
  }
});

/* =============================================
   TOAST
============================================= */
function showToast(msg, type) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = 'toast ' + (type || '');
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(function(){ toast.classList.remove('show'); }, 3200);
}

/* =============================================
   SCROLL TO SECTION
============================================= */
function scrollToSection(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =============================================
   UTILITY
============================================= */
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* =============================================
   INIT
============================================= */
(function init(){
  /* ---- FIX: Clear search inputs on page load so they are never pre-filled ---- */
  var searchA = document.getElementById('nav-search-input');
  var searchB = document.getElementById('nav-mobile-search-input');
  if (searchA) searchA.value = '';
  if (searchB) searchB.value = '';

  var statClubs = document.getElementById('stat-clubs');
  var statCats  = document.getElementById('stat-cats');
  if (statClubs) statClubs.textContent = ALL_CLUBS.length;
  if (statCats)  statCats.textContent  = CATEGORIES.length;

  buildNavCats();
  buildMobileCats();
  buildPills();
  renderClubs(ALL_CLUBS);
  renderMyClubs();
  observeCards();
})();