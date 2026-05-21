/* ══════════════════════════════════════
   clubdetailspanel.js  — v18
   Changes from v17:
   ─ Removed bullet dots from Objectives list
     (list-style: none, padding-left: 0)
   ─ All other features identical to v17
══════════════════════════════════════ */

/* ════════════════════════════════════
   CLUB DATA
════════════════════════════════════ */
const CLUB_DATA = {
  "Y-Peer": {
    category: "Volunteer",
    aim: "To empower students as peer educators who champion health, well-being, and informed decision-making across the JNEC campus.",
    description: "Y-Peer is a youth-led peer education network dedicated to promoting health, well-being, and informed decision-making among students. Members are trained as peer educators who spread awareness on topics such as reproductive health, substance abuse prevention, and mental wellness.",
    objectives: [
      "Train student peer educators to deliver health awareness sessions.",
      "Promote a culture of openness and informed decision-making among youth.",
      "Collaborate with health organizations for outreach programs.",
      "Reduce stigma around sensitive health topics on campus."
    ],
    adviser: "Mr. Karma Dorji",
    secretary: "Pema Wangchuk",
    memberCap: 50,
    stats: { "Founded": "2018", "Members": "45+", "Sessions / Year": "12+", "Category": "Volunteer" }
  },
  "Rover Scout": {
    category: "Volunteer",
    aim: "To build disciplined, service-oriented leaders through scouting activities rooted in the motto: Be Prepared.",
    description: "Rover Scout is the senior branch of the Bhutan Scout Association operating within JNEC. Rovers engage in community service, outdoor adventures, leadership development, and national events — living by the Scout motto: Be Prepared.",
    objectives: [
      "Develop leadership and teamwork through scouting activities.",
      "Participate in national and regional scout jamborees.",
      "Organize community service drives and environmental campaigns.",
      "Foster discipline, integrity, and civic responsibility."
    ],
    adviser: "Mr. Tshering Namgay",
    secretary: "Dorji Lhamo",
    memberCap: 60,
    stats: { "Founded": "2012", "Members": "60+", "Camps / Year": "4+", "Category": "Volunteer" }
  },
  "Red Cross": {
    category: "Volunteer",
    aim: "To embody the Red Cross principles of humanity and impartiality by serving the campus and broader community through humanitarian initiatives.",
    description: "The JNEC Red Cross Youth Club is affiliated with the Bhutan Red Cross Society and focuses on humanitarian aid, first aid training, blood donation drives, and disaster preparedness. Members embody the Red Cross principles of humanity and impartiality.",
    objectives: [
      "Organize regular blood donation camps on campus.",
      "Train members in first aid and basic life support.",
      "Support disaster relief and humanitarian initiatives.",
      "Raise awareness about health emergencies and prevention."
    ],
    adviser: "Ms. Sonam Choden",
    secretary: "Kinley Tshering",
    memberCap: 55,
    stats: { "Founded": "2015", "Members": "50+", "Drives / Year": "6+", "Category": "Volunteer" }
  },
  "JNEC Clean Toilet Initiative": {
    category: "Volunteer",
    aim: "To create and sustain a hygienic, respectful campus environment by promoting shared responsibility for common sanitation facilities.",
    description: "The JNEC Clean Toilet Initiative promotes hygiene, sanitation, and cleanliness across campus facilities. Members lead awareness campaigns, monitoring rosters, and maintenance drives to ensure clean and safe restroom facilities for all students.",
    objectives: [
      "Maintain cleanliness and hygiene standards across campus toilets.",
      "Run awareness campaigns on personal hygiene and sanitation.",
      "Coordinate with facilities management for timely repairs.",
      "Inspire a culture of shared responsibility for common spaces."
    ],
    adviser: "Mr. Ugyen Tenzin",
    secretary: "Chimi Wangmo",
    memberCap: 30,
    stats: { "Founded": "2020", "Members": "30+", "Inspections / Month": "8", "Category": "Volunteer" }
  },
  "Mechanical Maintenance": {
    category: "Maintenance",
    aim: "To apply mechanical engineering knowledge in maintaining campus infrastructure while building practical, hands-on technical competence.",
    description: "The Mechanical Maintenance Club is run by mechanical engineering students who maintain and repair mechanical equipment, machinery, and infrastructure across the JNEC campus. Members gain hands-on technical skills while serving the college.",
    objectives: [
      "Maintain and service mechanical equipment on campus.",
      "Provide practical exposure to real-world engineering problems.",
      "Assist departments with mechanical repairs and projects.",
      "Promote a proactive maintenance culture among students."
    ],
    adviser: "Mr. Jigme Wangdi",
    secretary: "Tenzin Phuntsho",
    memberCap: 35,
    stats: { "Founded": "2014", "Members": "35+", "Projects / Year": "10+", "Category": "Maintenance" }
  },
  "Civil Maintenance": {
    category: "Maintenance",
    aim: "To bridge classroom civil engineering knowledge with real campus infrastructure maintenance and improvement projects.",
    description: "The Civil Maintenance Club comprises civil engineering students who assist in upkeep of buildings, pathways, drainage systems, and structural elements across campus. The club bridges academic learning with real infrastructure challenges.",
    objectives: [
      "Monitor and maintain campus civil infrastructure.",
      "Assist in minor construction and renovation projects.",
      "Conduct structural safety audits of campus facilities.",
      "Apply civil engineering concepts in practical campus projects."
    ],
    adviser: "Mr. Karma Tobgay",
    secretary: "Sonam Peldon",
    memberCap: 30,
    stats: { "Founded": "2015", "Members": "28+", "Projects / Year": "8+", "Category": "Maintenance" }
  },
  "DIT Maintenance": {
    category: "Maintenance",
    aim: "To keep JNEC's digital and technical infrastructure running smoothly, empowering students as the technical backbone of the college.",
    description: "The DIT Maintenance Club is formed by IT and electronics students who manage the digital and technical infrastructure of JNEC — including computer labs, networks, projectors, and software systems. They are the technical backbone of the college.",
    objectives: [
      "Maintain and troubleshoot IT hardware and software systems.",
      "Manage computer lab upkeep and network connectivity.",
      "Support departments with digital tools and AV equipment.",
      "Train students in IT maintenance best practices."
    ],
    adviser: "Ms. Dechen Zangmo",
    secretary: "Tashi Dorji",
    memberCap: 40,
    stats: { "Founded": "2016", "Members": "40+", "Tickets Resolved / Month": "50+", "Category": "Maintenance" }
  },
  "Maintenance Hobby Club": {
    category: "Maintenance",
    aim: "To cultivate a hands-on DIY culture where students bond over the shared joy of fixing, building, and making things work.",
    description: "The Maintenance Hobby Club is an informal, passion-driven group where students with interests in fixing, building, and tinkering come together. From electronics to furniture repairs, this club is for those who love to make things work.",
    objectives: [
      "Encourage a DIY culture among engineering students.",
      "Organize repair workshops and skill-sharing sessions.",
      "Tackle small campus fix-it projects as a team.",
      "Bridge hobbyist interests with practical engineering skills."
    ],
    adviser: "Mr. Namgay Wangchuk",
    secretary: "Phurpa Tshering",
    memberCap: 25,
    stats: { "Founded": "2019", "Members": "22+", "Workshops / Year": "6+", "Category": "Maintenance" }
  },
  "Electrical Maintenance": {
    category: "Maintenance",
    aim: "To ensure a safe, well-lit campus by maintaining electrical systems while equipping students with real-world electrical engineering skills.",
    description: "The Electrical Maintenance Club handles the upkeep of electrical systems, wiring, lighting, and power distribution across JNEC's campus. Electrical engineering students gain practical exposure while ensuring a safe and well-lit campus environment.",
    objectives: [
      "Maintain electrical installations and systems across campus.",
      "Identify and fix electrical faults promptly and safely.",
      "Conduct electrical safety audits and awareness sessions.",
      "Collaborate with the facilities team on power infrastructure."
    ],
    adviser: "Mr. Rinzin Dorji",
    secretary: "Karma Yangdon",
    memberCap: 35,
    stats: { "Founded": "2014", "Members": "32+", "Maintenance Jobs / Month": "15+", "Category": "Maintenance" }
  },
  "Helping Hand Club": {
    category: "Social Service",
    aim: "To build an empathetic campus culture by reaching out compassionately to those in need — within the college and beyond.",
    description: "The Helping Hand Club is dedicated to supporting vulnerable members of the JNEC community and beyond. From fundraising to direct assistance, members embody compassion in action — reaching out to those who need a helping hand.",
    objectives: [
      "Provide support to financially disadvantaged students.",
      "Organize fundraisers and charity events.",
      "Coordinate with NGOs for broader social impact.",
      "Build an empathetic and community-minded campus culture."
    ],
    adviser: "Ms. Pema Lhamo",
    secretary: "Tenzin Wangchuk",
    memberCap: 40,
    stats: { "Founded": "2017", "Members": "38+", "Events / Year": "8+", "Category": "Social Service" }
  },
  "JNEC GNH": {
    category: "Social Service",
    aim: "To embed Bhutan's Gross National Happiness philosophy into campus life through mindfulness, sustainability, and cultural appreciation.",
    description: "Inspired by Bhutan's philosophy of Gross National Happiness, the JNEC GNH Club promotes holistic well-being, mindfulness, cultural appreciation, and sustainable living among students. It is a space for reflection, creativity, and meaningful connection.",
    objectives: [
      "Promote the principles of GNH among the student community.",
      "Organize mindfulness, meditation, and wellness activities.",
      "Celebrate Bhutanese culture, values, and traditions.",
      "Encourage sustainable and responsible campus living."
    ],
    adviser: "Mr. Tshewang Rinzin",
    secretary: "Deki Wangmo",
    memberCap: 50,
    stats: { "Founded": "2016", "Members": "45+", "Events / Year": "10+", "Category": "Social Service" }
  },
  "JNEC Salon": {
    category: "Social Service",
    aim: "To provide accessible grooming and personal care to all students while training volunteers in practical salon skills.",
    description: "The JNEC Salon Club provides affordable grooming and personal care services to students, operated by trained student volunteers. It combines skill development with social service, ensuring every student can present themselves with confidence.",
    objectives: [
      "Offer free or subsidized grooming services to students.",
      "Train student volunteers in basic salon skills.",
      "Promote personal hygiene and self-care awareness.",
      "Generate a sense of service and community care."
    ],
    adviser: "Ms. Tshering Pem",
    secretary: "Yeshey Dorji",
    memberCap: 20,
    stats: { "Founded": "2021", "Members": "20+", "Sessions / Month": "4+", "Category": "Social Service" }
  },
  "Thakor Namsung Tshokpa": {
    category: "Social Service",
    aim: "To preserve Bhutanese cultural heritage and strengthen community solidarity through shared traditions and communal events.",
    description: "Thakor Namsung Tshokpa is a cultural and social service club rooted in Bhutanese traditions of communal solidarity. The club organizes events that honor Bhutanese heritage while fostering unity, mutual support, and shared identity among students.",
    objectives: [
      "Preserve and celebrate Bhutanese cultural traditions.",
      "Foster community solidarity and mutual support.",
      "Organize cultural programs and community gatherings.",
      "Strengthen the bond between students of shared heritage."
    ],
    adviser: "Mr. Ugyen Namgay",
    secretary: "Sangay Tshering",
    memberCap: 60,
    stats: { "Founded": "2018", "Members": "55+", "Events / Year": "6+", "Category": "Social Service" }
  },
  "Integrity Club": {
    category: "Social Service",
    aim: "To cultivate a campus culture where honesty, accountability, and ethical conduct are not just values — but lived daily practices.",
    description: "The Integrity Club promotes ethical conduct, transparency, and accountability within JNEC. Through awareness campaigns, audits, and open forums, the club nurtures a culture where honesty and integrity are lived values — not just words.",
    objectives: [
      "Promote a culture of honesty, ethics, and accountability.",
      "Conduct campus integrity awareness campaigns.",
      "Publish annual integrity audit reports.",
      "Facilitate open forums for ethical discussion and feedback."
    ],
    adviser: "Mr. Dorji Tshering",
    secretary: "Kinley Wangmo",
    memberCap: 30,
    stats: { "Founded": "2019", "Members": "30+", "Audits / Year": "2", "Category": "Social Service" }
  },
  "Entrepreneurship Club": {
    category: "Entrepreneurship",
    aim: "To ignite entrepreneurial spirit in every student — transforming ideas into ventures and dreamers into doers.",
    description: "The JNEC Entrepreneurship Club is the launchpad for student innovators and business-minded thinkers. From pitch competitions to startup mentoring, the club creates an ecosystem where ideas become ventures and students become entrepreneurs.",
    objectives: [
      "Foster entrepreneurial thinking and innovation on campus.",
      "Organize startup pitches, hackathons, and ideathons.",
      "Connect students with mentors, investors, and industry leaders.",
      "Support student ventures from ideation to early-stage growth."
    ],
    adviser: "Mr. Sonam Wangdi",
    secretary: "Pema Dorji",
    memberCap: 55,
    stats: { "Founded": "2017", "Members": "50+", "Events / Year": "8+", "Category": "Entrepreneurship" }
  },
  "JNEC Music Club": {
    category: "Entertainment",
    aim: "To celebrate music as a universal language — nurturing talent, preserving Bhutanese musical heritage, and uniting the campus community.",
    description: "The JNEC Music Club is the creative heart of the college's musical life. From classical Bhutanese melodies to contemporary compositions, members rehearse, perform, and collaborate — celebrating music as a universal language that unites the campus community.",
    objectives: [
      "Nurture musical talent across genres and instruments.",
      "Perform at college events, festivals, and competitions.",
      "Organize open mic nights and music workshops.",
      "Preserve and promote Bhutanese musical heritage."
    ],
    adviser: "Ms. Karma Choden",
    secretary: "Tashi Namgay",
    memberCap: 45,
    stats: { "Founded": "2013", "Members": "40+", "Performances / Year": "10+", "Category": "Entertainment" }
  },
  "Culture Club": {
    category: "Entertainment",
    aim: "To celebrate and safeguard the rich cultural diversity of JNEC through performance, art, and intercultural dialogue.",
    description: "The Culture Club is the guardian of JNEC's rich cultural diversity. Through dance, drama, traditional performances, and cultural exhibitions, the club brings students together to celebrate their roots and explore new artistic horizons.",
    objectives: [
      "Organize cultural performances for college and community events.",
      "Promote diversity, inclusion, and cultural exchange.",
      "Train students in traditional Bhutanese arts and crafts.",
      "Represent JNEC at inter-college cultural competitions."
    ],
    adviser: "Ms. Deki Pem",
    secretary: "Sonam Tobgay",
    memberCap: 75,
    stats: { "Founded": "2012", "Members": "70+", "Shows / Year": "8+", "Category": "Entertainment" }
  },
  "Media Club": {
    category: "Entertainment",
    aim: "To document, amplify, and share the stories of JNEC through professional multimedia storytelling and digital communication.",
    description: "The JNEC Media Club is the college's storytelling powerhouse — producing videos, photos, news articles, and social media content that document campus life. Members develop skills in journalism, videography, graphic design, and digital communication.",
    objectives: [
      "Document and share JNEC events through multimedia content.",
      "Train students in photography, videography, and journalism.",
      "Manage JNEC's social media presence and publications.",
      "Produce the college newsletter and annual magazine."
    ],
    adviser: "Mr. Sangay Dorji",
    secretary: "Choki Wangmo",
    memberCap: 40,
    stats: { "Founded": "2016", "Members": "35+", "Publications / Year": "4+", "Category": "Entertainment" }
  },
  "Radio Club": {
    category: "Entertainment",
    aim: "To give every student a voice — broadcasting creativity, news, and expression through the JNEC campus radio channel.",
    description: "The JNEC Radio Club operates the campus radio channel, giving students a platform to broadcast music, news, interviews, and creative programs. It's where budding radio jockeys, sound engineers, and content creators find their voice.",
    objectives: [
      "Operate and manage the JNEC campus radio channel.",
      "Produce engaging radio programs and podcasts.",
      "Train students in broadcasting and audio production.",
      "Provide a creative platform for student expression and debate."
    ],
    adviser: "Mr. Tenzin Norbu",
    secretary: "Pema Zangmo",
    memberCap: 28,
    stats: { "Founded": "2020", "Members": "25+", "Shows / Week": "5+", "Category": "Entertainment" }
  },
  "JNEC Karate": {
    category: "Sports",
    aim: "To develop disciplined, physically fit, and mentally resilient martial artists who embody the spirit of Budo on and off the mat.",
    description: "JNEC Karate is the premier martial arts club on campus, training students in the discipline of Shotokan Karate. Under certified instructors, members develop physical fitness, self-defense skills, mental focus, and the warrior spirit of Budo.",
    objectives: [
      "Train students in Shotokan Karate techniques and kata.",
      "Participate in district, national, and inter-college championships.",
      "Promote physical fitness and mental discipline.",
      "Develop character, respect, and perseverance through martial arts."
    ],
    adviser: "Mr. Karma Wangdi",
    secretary: "Thinley Dorji",
    memberCap: 50,
    stats: { "Founded": "2014", "Members": "48+", "Tournaments / Year": "4+", "Category": "Sports" }
  }
};

/* ════════════════════════════════════
   MEMBER CAP HELPERS
════════════════════════════════════ */
function getClubEnrolledCount(clubName) {
  try {
    const raw = localStorage.getItem('jnec_club_enrollments');
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data[clubName] || 0;
  } catch { return 0; }
}

function incrementClubEnrolledCount(clubName) {
  try {
    const raw = localStorage.getItem('jnec_club_enrollments');
    const data = raw ? JSON.parse(raw) : {};
    data[clubName] = (data[clubName] || 0) + 1;
    localStorage.setItem('jnec_club_enrollments', JSON.stringify(data));
  } catch { /* silent fail */ }
}

function isClubFull(clubName) {
  const cap = CLUB_DATA[clubName]?.memberCap;
  if (cap === null || cap === undefined) return false;
  return getClubEnrolledCount(clubName) >= cap;
}

function getRemainingSlots(clubName) {
  const cap = CLUB_DATA[clubName]?.memberCap;
  if (cap === null || cap === undefined) return null;
  return Math.max(0, cap - getClubEnrolledCount(clubName));
}

/* ════════════════════════════════════
   INJECT HTML STRUCTURES
════════════════════════════════════ */
function injectPanelHTML() {
  if (document.getElementById('clubPanelOverlay')) return;

  const style = document.createElement('style');
  style.textContent = `
    /* ── Section wrapper ── */
    .panel-section {
      margin-bottom: 22px;
    }
    .panel-section:last-of-type {
      margin-bottom: 0;
    }

    /* ── Section header row ── */
    .panel-section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    /* Numbered circle badge — hidden */
    .panel-section-number {
      display: none;
    }

    /* Section label text */
    .panel-section-label-text {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #1a2332;
      letter-spacing: 0.01em;
      text-transform: uppercase;
    }

    /* Thin separator line — hidden */
    .panel-section-divider {
      display: none;
    }

    /* Section body text */
    .panel-section-body {
      font-size: 13.5px;
      line-height: 1.75;
      color: #4a4a4a;
    }

    /* Objectives list — no bullets, no indent */
    .panel-section-body ul {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }
    .panel-section-body ul li {
      font-size: 13.5px;
      color: #4a4a4a;
      line-height: 1.65;
      padding: 3px 0;
    }
  `;
  document.head.appendChild(style);

  const html = `
    <!-- Club Panel Overlay -->
    <div class="panel-overlay" id="clubPanelOverlay"></div>

    <!-- Club Detail Modal -->
    <div class="club-panel" id="clubPanel" role="dialog" aria-modal="true" aria-labelledby="panelClubName">

      <!-- Header -->
      <div class="panel-header" id="panelHeader">
        <button class="panel-close-btn" id="panelCloseBtn" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
        <div class="panel-header-row">
          <h2 class="panel-club-name" id="panelClubName"></h2>
          <button class="panel-join-btn" id="panelJoinBtn">
            <span class="join-btn-text">Join Club</span>
          </button>
        </div>
        <div class="panel-category-tag" id="panelCategoryTag"></div>
      </div>

      <!-- Body: strictly 1. Aim → 2. Objectives → 3. Description -->
      <div class="panel-body" id="panelBody">

        <!-- Member cap full banner -->
        <div class="panel-cap-banner" id="panelCapBanner" style="display:none;">
          <i class="fas fa-triangle-exclamation"></i>
          <div id="panelCapBannerText"></div>
        </div>

        <!-- ① AIM -->
        <div class="panel-section" id="sectionAim">
          <div class="panel-section-header">
            <span class="panel-section-number">1</span>
            <span class="panel-section-label-text">Aim</span>
          </div>
          <div class="panel-section-divider"></div>
          <div class="panel-section-body" id="panelAim"></div>
        </div>

        <!-- ② OBJECTIVES -->
        <div class="panel-section" id="sectionObjectives">
          <div class="panel-section-header">
            <span class="panel-section-number">2</span>
            <span class="panel-section-label-text">Objectives</span>
          </div>
          <div class="panel-section-divider"></div>
          <div class="panel-section-body">
            <ul id="panelObjectivesList"></ul>
          </div>
        </div>

        <!-- ③ DESCRIPTION -->
        <div class="panel-section" id="sectionDescription">
          <div class="panel-section-header">
            <span class="panel-section-number">3</span>
            <span class="panel-section-label-text">Description</span>
          </div>
          <div class="panel-section-divider"></div>
          <div class="panel-section-body" id="panelDescription"></div>
        </div>

        <!-- Hidden leadership cards (still populated for stats row) -->
        <div class="panel-people-row" id="panelPeopleRow" style="display:none!important;">
          <div class="panel-person-card">
            <div class="panel-person-info">
              <div class="panel-person-role">Adviser</div>
              <div class="panel-person-name" id="panelAdviser"></div>
            </div>
          </div>
          <div class="panel-person-card">
            <div class="panel-person-info">
              <div class="panel-person-role">Secretary</div>
              <div class="panel-person-name" id="panelSecretary"></div>
            </div>
          </div>
        </div>

        <!-- BOTTOM STATS ROW -->
        <div class="panel-stats-row" id="panelStatsRow">
          <div class="panel-stat-item">
            <div class="panel-stat-label">Members</div>
            <div class="panel-stat-value" id="panelMembersCount">0+</div>
          </div>
          <div class="panel-stat-item">
            <div class="panel-stat-label">Club Advisor</div>
            <div class="panel-stat-value" id="panelAdviserStat"></div>
          </div>
          <div class="panel-stat-item">
            <div class="panel-stat-label">Club Secretary</div>
            <div class="panel-stat-value" id="panelSecretaryStat"></div>
          </div>
        </div>

      </div>
    </div>

    <!-- Enrollment Key Overlay -->
    <div class="enroll-overlay" id="enrollOverlay">
      <div class="enroll-modal">

        <!-- Original dark header bar — hidden via CSS -->
        <div class="enroll-modal-header">
          <div class="enroll-modal-header-icon"><i class="fas fa-key"></i></div>
          <div class="enroll-modal-header-text">
            <div class="enroll-modal-title">Enter Enrollment Key</div>
            <div class="enroll-modal-subtitle" id="enrollModalSubtitle">Enter the key provided by your club advisor.</div>
          </div>
          <button class="enroll-modal-close" id="enrollModalCloseOld" aria-label="Close"><i class="fas fa-times"></i></button>
        </div>

        <div class="enroll-modal-body">

          <button class="enroll-modal-close-inner" id="enrollModalClose" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>

          <div class="enroll-modal-body-title">Enter Enrollment Key</div>
          <div class="enroll-modal-body-subtitle">Enter the key provided by your club advisor.</div>

          <div class="enroll-club-name-tag" id="enrollClubNameTag">
            <i class="fas fa-shield-halved"></i>
            <span id="enrollClubNameSpan"></span>
          </div>

          <div class="enroll-cap-msg" id="enrollCapMsg">
            <i class="fas fa-triangle-exclamation"></i>
            <div id="enrollCapMsgText"></div>
          </div>

          <div class="enroll-field" id="enrollFormFields">
            <label for="enrollKeyInput">Enrollment Key</label>
            <div class="enroll-key-wrap">
              <input
                type="password"
                class="enroll-key-input"
                id="enrollKeyInput"
                placeholder="e.g. CLUB2025"
                autocomplete="off"
                spellcheck="false"
              />
              <button class="enroll-key-toggle" id="enrollKeyToggle" aria-label="Toggle visibility" type="button">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="enroll-hint">
              <i class="fas fa-circle-info"></i>
              <span>The key is provided by your club advisor or notice board.</span>
            </div>
            <div class="enroll-error-msg" id="enrollErrorMsg">
              <i class="fas fa-circle-exclamation"></i>
              <span id="enrollErrorText">Incorrect key. Please try again.</span>
            </div>
          </div>

          <!-- Centered Enroll Now button wrapper -->
          <div class="enroll-submit-wrap">
            <button class="enroll-submit-btn" id="enrollSubmitBtn" type="button">
              <span class="btn-spinner"></span>
              <span class="btn-text">Enroll Now</span>
            </button>
          </div>

          <div class="enroll-success" id="enrollSuccess">
            <div class="enroll-success-icon"><i class="fas fa-check"></i></div>
            <div class="enroll-success-title">Enrolled Successfully!</div>
            <div class="enroll-success-msg" id="enrollSuccessMsg">
              You have joined the club. It will now appear in your My Clubs section.
            </div>
            <button class="enroll-success-close-btn" id="enrollSuccessCloseBtn">Done</button>
          </div>

        </div>
      </div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
}

/* ════════════════════════════════════
   STATE
════════════════════════════════════ */
let currentClubName = null;

/* ════════════════════════════════════
   MEMBERS COUNT UPDATER
════════════════════════════════════ */
function updateMembersCard(clubName) {
  const data = CLUB_DATA[clubName];
  if (!data) return;
  const enrolled = getClubEnrolledCount(clubName);
  const countEl = document.getElementById('panelMembersCount');
  if (countEl) countEl.textContent = enrolled + '+';
}

/* ════════════════════════════════════
   OPEN / CLOSE PANEL
════════════════════════════════════ */
function openClubPanel(clubName) {
  const data = CLUB_DATA[clubName];
  if (!data) return;

  currentClubName = clubName;

  /* ── Header ── */
  document.getElementById('panelCategoryTag').textContent = data.category;
  document.getElementById('panelClubName').textContent = clubName;

  /* ── Section 1: Aim ── */
  document.getElementById('panelAim').textContent = data.aim;

  /* ── Section 2: Objectives ── */
  const objList = document.getElementById('panelObjectivesList');
  objList.innerHTML = data.objectives
    .map(obj => `<li>${escHtml(obj)}</li>`)
    .join('');

  /* ── Section 3: Description ── */
  document.getElementById('panelDescription').textContent = data.description;

  /* ── Leadership (hidden, for stats row) ── */
  document.getElementById('panelAdviser').textContent   = data.adviser;
  document.getElementById('panelSecretary').textContent = data.secretary;

  /* ── Stats row ── */
  document.getElementById('panelAdviserStat').textContent   = data.adviser;
  document.getElementById('panelSecretaryStat').textContent = data.secretary;
  updateMembersCard(clubName);

  /* ── Member cap banner ── */
  const capBanner     = document.getElementById('panelCapBanner');
  const capBannerText = document.getElementById('panelCapBannerText');
  if (isClubFull(clubName)) {
    const cap = data.memberCap;
    capBannerText.innerHTML = `<strong>Membership is currently full.</strong> This club has reached its maximum capacity of <strong>${cap} members</strong>. New enrollments are not being accepted at this time. Please check back later or contact the club adviser.`;
    capBanner.style.display = 'flex';
  } else {
    capBanner.style.display = 'none';
  }

  updateJoinButton(clubName);

  document.getElementById('clubPanelOverlay').classList.add('active');
  document.getElementById('clubPanel').classList.add('open');
  document.body.style.overflow = 'hidden';

  const panelBody = document.getElementById('panelBody');
  if (panelBody) panelBody.scrollTop = 0;
}

function closeClubPanel() {
  document.getElementById('clubPanelOverlay').classList.remove('active');
  document.getElementById('clubPanel').classList.remove('open');
  document.body.style.overflow = '';
  currentClubName = null;
}

/* ════════════════════════════════════
   UPDATE JOIN BUTTON
   ─ 3 states: Already Joined / Club Full / Join Club
   ─ No icon in any state
════════════════════════════════════ */
function updateJoinButton(clubName) {
  const btn      = document.getElementById('panelJoinBtn');
  const MyClubs  = window.MyClubs;
  const alreadyJoined = MyClubs && MyClubs.isClubJoined(clubName);
  const clubCapFull   = isClubFull(clubName);

  if (alreadyJoined) {
    btn.disabled = true;
    btn.style.background = '#3a7d55';
    btn.style.color      = '#ffffff';
    btn.style.boxShadow  = '0 3px 10px rgba(58,125,85,0.3)';
    btn.innerHTML = '<span class="join-btn-text">Already Joined</span>';
  } else if (clubCapFull) {
    btn.disabled = true;
    btn.style.background = '#c9a84c';
    btn.style.color      = '#ffffff';
    btn.style.boxShadow  = '0 3px 10px rgba(201,168,76,0.3)';
    btn.innerHTML = '<span class="join-btn-text">Club Full</span>';
  } else {
    btn.disabled = false;
    btn.style.background = '';
    btn.style.color      = '';
    btn.style.boxShadow  = '';
    btn.innerHTML = '<span class="join-btn-text">Join Club</span>';
  }
}

/* ════════════════════════════════════
   ENROLLMENT MODAL
════════════════════════════════════ */
function openEnrollModal(clubName) {
  const overlay = document.getElementById('enrollOverlay');
  document.getElementById('enrollClubNameSpan').textContent = clubName;

  /* Reset state */
  document.getElementById('enrollKeyInput').value = '';
  document.getElementById('enrollKeyInput').classList.remove('error');
  document.getElementById('enrollErrorMsg').classList.remove('visible');
  document.getElementById('enrollSuccess').classList.remove('visible');
  document.getElementById('enrollFormFields').style.display = '';

  const submitWrap = document.getElementById('enrollSubmitBtn').closest('.enroll-submit-wrap');
  if (submitWrap) submitWrap.style.display = '';

  document.getElementById('enrollSubmitBtn').classList.remove('loading');
  document.getElementById('enrollSubmitBtn').disabled = false;
  document.getElementById('enrollSubmitBtn').style.opacity = '';

  /* Check member cap */
  const capMsg     = document.getElementById('enrollCapMsg');
  const capMsgText = document.getElementById('enrollCapMsgText');
  if (isClubFull(clubName)) {
    const cap      = CLUB_DATA[clubName]?.memberCap;
    const enrolled = getClubEnrolledCount(clubName);
    capMsgText.innerHTML = `<strong>This club is currently full.</strong> The maximum capacity of <strong>${cap} members</strong> has been reached (${enrolled}/${cap} enrolled). Enrollment is closed. Please contact your club adviser for more information.`;
    capMsg.classList.add('visible');
    document.getElementById('enrollFormFields').style.display = 'none';
    document.getElementById('enrollSubmitBtn').disabled = true;
    document.getElementById('enrollSubmitBtn').style.opacity = '0.5';
  } else {
    capMsg.classList.remove('visible');
    document.getElementById('enrollFormFields').style.display = '';
    document.getElementById('enrollSubmitBtn').disabled = false;
    document.getElementById('enrollSubmitBtn').style.opacity = '';
  }

  overlay.classList.add('active');

  if (!isClubFull(clubName)) {
    setTimeout(() => {
      const input = document.getElementById('enrollKeyInput');
      if (input) input.focus();
    }, 150);
  }
}

function closeEnrollModal() {
  document.getElementById('enrollOverlay').classList.remove('active');
}

/* ════════════════════════════════════
   SUBMIT ENROLLMENT
════════════════════════════════════ */
function submitEnrollment() {
  if (isClubFull(currentClubName)) {
    const cap = CLUB_DATA[currentClubName]?.memberCap;
    document.getElementById('enrollErrorText').textContent =
      `This club has reached its maximum capacity of ${cap} members. Enrollment is closed.`;
    document.getElementById('enrollErrorMsg').classList.add('visible');
    return;
  }

  const input = document.getElementById('enrollKeyInput');
  const key   = input.value.trim();

  if (!key) {
    input.classList.add('error');
    document.getElementById('enrollErrorText').textContent = 'Please enter an enrollment key.';
    document.getElementById('enrollErrorMsg').classList.add('visible');
    input.focus();
    return;
  }

  input.classList.remove('error');
  document.getElementById('enrollErrorMsg').classList.remove('visible');

  const submitBtn = document.getElementById('enrollSubmitBtn');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    if (isClubFull(currentClubName)) {
      const cap = CLUB_DATA[currentClubName]?.memberCap;
      document.getElementById('enrollErrorText').textContent =
        `Sorry — this club just reached its maximum of ${cap} members while you were enrolling.`;
      document.getElementById('enrollErrorMsg').classList.add('visible');
      input.classList.add('error');
      return;
    }

    const MyClubs = window.MyClubs;
    if (MyClubs) {
      const added = MyClubs.addMyClub(currentClubName, CLUB_DATA[currentClubName]?.category);
      if (!added) {
        document.getElementById('enrollErrorText').textContent =
          MyClubs.isClubJoined(currentClubName)
            ? 'You have already joined this club.'
            : 'You have reached the maximum of 3 clubs.';
        document.getElementById('enrollErrorMsg').classList.add('visible');
        input.classList.add('error');
        return;
      }
    }

    incrementClubEnrolledCount(currentClubName);
    updateMembersCard(currentClubName);

    document.getElementById('enrollFormFields').style.display = 'none';

    const submitWrap = submitBtn.closest('.enroll-submit-wrap');
    if (submitWrap) submitWrap.style.display = 'none';

    document.getElementById('enrollSuccess').classList.add('visible');
    document.getElementById('enrollSuccessMsg').textContent =
      `You have successfully joined "${currentClubName}". It now appears in your My Clubs section.`;

    updateJoinButton(currentClubName);

    const capBanner     = document.getElementById('panelCapBanner');
    const capBannerText = document.getElementById('panelCapBannerText');
    if (capBanner && isClubFull(currentClubName)) {
      const cap = CLUB_DATA[currentClubName]?.memberCap;
      capBannerText.innerHTML = `<strong>Membership is now full.</strong> This club has just reached its maximum capacity of <strong>${cap} members</strong>. New enrollments are closed.`;
      capBanner.style.display = 'flex';
    }

  }, 900);
}

/* ════════════════════════════════════
   BIND ALL EVENTS
════════════════════════════════════ */
function bindEvents() {
  /* Nav dropdown club links */
  document.querySelectorAll('.nav-links .dropdown a[data-club]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clubName = link.getAttribute('data-club');
      const navLinks = document.getElementById('navLinks');
      if (navLinks && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        const hamburger = document.getElementById('hamburger');
        if (hamburger) {
          const icon = hamburger.querySelector('i');
          if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-times'); }
        }
      }
      openClubPanel(clubName);
    });
  });

  /* Panel close */
  document.getElementById('panelCloseBtn').addEventListener('click', closeClubPanel);
  document.getElementById('clubPanelOverlay').addEventListener('click', closeClubPanel);

  /* Join button → enroll modal */
  document.getElementById('panelJoinBtn').addEventListener('click', () => {
    if (!currentClubName) return;
    if (document.getElementById('panelJoinBtn').disabled) return;
    openEnrollModal(currentClubName);
  });

  /* Enroll modal close */
  document.getElementById('enrollModalClose').addEventListener('click', closeEnrollModal);
  const oldClose = document.getElementById('enrollModalCloseOld');
  if (oldClose) oldClose.addEventListener('click', closeEnrollModal);

  document.getElementById('enrollOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('enrollOverlay')) closeEnrollModal();
  });

  /* Password toggle */
  document.getElementById('enrollKeyToggle').addEventListener('click', () => {
    const input = document.getElementById('enrollKeyInput');
    const icon  = document.getElementById('enrollKeyToggle').querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });

  /* Enter in key input */
  document.getElementById('enrollKeyInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitEnrollment();
  });

  /* Submit */
  document.getElementById('enrollSubmitBtn').addEventListener('click', submitEnrollment);

  /* Success close */
  document.getElementById('enrollSuccessCloseBtn').addEventListener('click', closeEnrollModal);

  /* Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('enrollOverlay').classList.contains('active')) {
        closeEnrollModal();
      } else if (document.getElementById('clubPanel').classList.contains('open')) {
        closeClubPanel();
      }
    }
  });
}

/* ════════════════════════════════════
   UTILITY
════════════════════════════════════ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
function initClubDetailPanel() {
  injectPanelHTML();
  bindEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClubDetailPanel);
} else {
  initClubDetailPanel();
}