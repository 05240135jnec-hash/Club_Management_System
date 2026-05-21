/* =====================================================
   JNEC Club Management — Club Blog
   blog.js
   ===================================================== */

'use strict';

// ═══════════════════════════════════════════════════
// BLOG DATA
// (Written by club adviser or secretary — students view only)
// ═══════════════════════════════════════════════════
const blogs = [
  {
    id: 1,
    title: 'Social Service',
    author: 'Jigme Lhadon',
    authorInitials: 'JL',
    date: '13 Apr 2026',
    rawDate: '2026-04-13',
    coverImg: '',
    excerpt: 'Cleaning services play an important role in maintaining hygiene, comfort, and a healthy environment in homes, offices, a...',
    content: `
      <p>Cleaning services play an important role in maintaining hygiene, comfort, and a healthy environment in homes, offices, and public spaces. These services are designed to remove dust, dirt, and harmful germs that can accumulate over time.</p>
      <p>Professional cleaners use proper tools, techniques, and cleaning products to ensure that every area is thoroughly cleaned and sanitized. This not only improves the appearance of a space but also promotes better health and well-being.</p>
      <p>Regular cleaning reduces the risk of illness caused by bacteria and viruses. It also enhances productivity, as people tend to work better in clean and organized environments. In public spaces, cleaning services help maintain a positive image and ensure safety for everyone.</p>
      <p>Our club actively participates in social service initiatives, contributing to the cleanliness of our campus and surrounding community. We believe that small acts of service can create a big difference in the lives of others and foster a culture of responsibility and care.</p>
    `,
  },
  {
    id: 2,
    title: 'Annual Tech Fest 2026 Recap',
    author: 'Dorji Wangchuk',
    authorInitials: 'DW',
    date: '05 Apr 2026',
    rawDate: '2026-04-05',
    coverImg: '',
    excerpt: 'The Annual Tech Fest 2026 was a grand success with over 300 students participating in various competitions and workshops...',
    content: `
      <p>The Annual Tech Fest 2026 was a grand success with over 300 students participating in various competitions and workshops. This year's theme was "Innovate for Bhutan" — encouraging students to build solutions relevant to our local context.</p>
      <p>Highlights included a hackathon that ran for 24 hours, a robotics showcase, and a panel discussion on the future of technology in Bhutan. Teams from different departments collaborated, resulting in impressive projects that addressed real-world challenges.</p>
      <p>Our club played a key role in organizing the media coverage for the event. Club members captured photographs, recorded videos, and managed the live streaming for participants joining remotely.</p>
      <p>We are proud of all the students who participated and grateful to the faculty advisers who supported the event. The Tech Fest continues to be one of the most anticipated events on our college calendar.</p>
    `,
  },
  {
    id: 3,
    title: 'Welcome to the New Academic Year',
    author: 'Tshering Choden',
    authorInitials: 'TC',
    date: '01 Mar 2026',
    rawDate: '2026-03-01',
    coverImg: '',
    excerpt: 'Welcome back to another exciting year at JNEC! The club committee is thrilled to introduce new members and exciting plans...',
    content: `
      <p>Welcome back to another exciting year at JNEC! The club committee is thrilled to introduce new members and share our exciting plans for the academic year ahead.</p>
      <p>This year, we have onboarded 24 new members who bring fresh perspectives and new skills to our club. We held an orientation session to familiarize them with our club values, ongoing projects, and the roles they will play.</p>
      <p>Our calendar this year includes documentary productions, photography workshops, inter-college competitions, and a special end-of-year showcase. We encourage all students to participate actively and contribute their talents.</p>
      <p>The club adviser has emphasized the importance of creativity, teamwork, and discipline — values that will guide everything we do this year. We look forward to an impactful and memorable year together.</p>
    `,
  },
  {
    id: 4,
    title: 'Photography Workshop: Mastering Light',
    author: 'Kinley Pem',
    authorInitials: 'KP',
    date: '18 Feb 2026',
    rawDate: '2026-02-18',
    coverImg: '',
    excerpt: 'Light is the fundamental element of photography. Our two-day workshop helped students understand natural and artificial lighting...',
    content: `
      <p>Light is the fundamental element of photography. Our two-day workshop helped students understand natural and artificial lighting to capture stunning images regardless of the environment.</p>
      <p>Day one focused on theory — understanding the color temperature of light, the golden hour, and how to read a histogram. Students practiced using reflectors and diffusers in outdoor settings around the campus.</p>
      <p>Day two was entirely hands-on. Students set up a makeshift studio using budget-friendly equipment and experimented with portrait and product photography. Peer critiques at the end of each session helped everyone improve quickly.</p>
      <p>We were joined by a guest photographer from Thimphu who shared his professional experience and answered student questions. The feedback from participants was overwhelmingly positive, and we plan to run a follow-up session on post-processing techniques next month.</p>
    `,
  },
  {
    id: 5,
    title: "Fresher's Orientation Night — A Night to Remember",
    author: 'Jigme Lhadon',
    authorInitials: 'JL',
    date: '10 Jan 2026',
    rawDate: '2026-01-10',
    coverImg: '',
    excerpt: "The Fresher's Orientation Night brought together first-year students for an evening of performances, games, and community building...",
    content: `
      <p>The Fresher's Orientation Night brought together first-year students for an evening of performances, games, and community building. Organized entirely by senior club members, the event was designed to help newcomers feel at home at JNEC.</p>
      <p>The evening began with a cultural performance showcasing Bhutanese traditional dances, followed by musical performances from the college's music club. Club members also organized interactive games that encouraged freshers to mingle and build friendships.</p>
      <p>One of the highlights was a short documentary about the college's history, produced and edited by our media club. It was well-received and sparked many conversations about JNEC's journey and achievements over the years.</p>
      <p>We wrapped up the night with a group photo and a promise to make this year the most memorable one yet. The freshers left inspired and excited to get involved in club activities.</p>
    `,
  },
  {
    id: 6,
    title: 'Club Constitution & Code of Conduct Update',
    author: 'Dorji Wangchuk',
    authorInitials: 'DW',
    date: '15 Dec 2025',
    rawDate: '2025-12-15',
    coverImg: '',
    excerpt: 'The club constitution has been updated to reflect our growing membership and evolving goals. All members are encouraged to review...',
    content: `
      <p>The club constitution has been updated to reflect our growing membership and evolving goals. All members are encouraged to review the revised document, which outlines new policies on attendance, leadership elections, and disciplinary procedures.</p>
      <p>Key changes include a clearer definition of member roles and responsibilities, an updated process for proposing and approving new projects, and guidelines for digital content ownership within the club.</p>
      <p>The code of conduct section has been expanded to address online behavior, including the responsible use of social media when representing the club. Members are expected to maintain the club's reputation both online and offline.</p>
      <p>Copies of the updated constitution are available from the club secretary. A Q&A session will be held next week for members who have questions or concerns about the changes.</p>
    `,
  },
  {
    id: 7,
    title: 'Reflecting on Our Semester: Achievements & Lessons',
    author: 'Tshering Choden',
    authorInitials: 'TC',
    date: '30 Nov 2025',
    rawDate: '2025-11-30',
    coverImg: '',
    excerpt: 'As the semester draws to a close, we take a moment to reflect on what we have accomplished together and the lessons we carry forward...',
    content: `
      <p>As the semester draws to a close, we take a moment to reflect on what we have accomplished together and the lessons we carry forward into the next chapter.</p>
      <p>This semester, we successfully completed three major projects: the Teacher's Day documentary, the Sports Day drone coverage, and the Colour Grading Masterclass. Each project pushed our skills and tested our ability to work under pressure and tight deadlines.</p>
      <p>We also faced challenges — scheduling conflicts, equipment issues, and moments of self-doubt. But through every obstacle, the team showed resilience and a commitment to excellence.</p>
      <p>Looking ahead, we encourage every member to set personal goals for the coming semester. Identify one skill you want to master, one project you want to lead, and one peer you want to mentor. Together, we will continue to grow.</p>
    `,
  },
  {
    id: 8,
    title: 'Introducing Our New Club Logo & Brand Identity',
    author: 'Kinley Pem',
    authorInitials: 'KP',
    date: '12 Nov 2025',
    rawDate: '2025-11-12',
    coverImg: '',
    excerpt: 'After weeks of design iterations and member feedback, we are proud to unveil the new JNEC Media Club logo and brand identity...',
    content: `
      <p>After weeks of design iterations and member feedback, we are proud to unveil the new JNEC Media Club logo and brand identity. The redesign reflects our evolution as a club and our commitment to creativity and professionalism.</p>
      <p>The new logo features a stylized camera lens combined with a subtle reference to Bhutan's traditional architecture. It was designed by one of our own members — a testament to the talent within our club.</p>
      <p>Along with the logo, we have established a consistent color palette and typography system that will be used across all club materials, from event posters to social media content.</p>
      <p>The brand guidelines document will be shared with all members. We ask that everyone follow these guidelines when creating content on behalf of the club. Consistency in presentation reinforces the professionalism we strive for in everything we do.</p>
    `,
  },
];

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
let currentSearch = '';
let currentSort   = 'newest';

// ═══════════════════════════════════════════════════
// RENDER GRID
// ═══════════════════════════════════════════════════
function renderGrid() {
  const grid = document.getElementById('blogsGrid');
  if (!grid) return;

  let data = [...blogs];

  // Filter by search
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    data = data.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.excerpt.toLowerCase().includes(q)
    );
  }

  // Sort
  data.sort((a, b) => {
    const da = new Date(a.rawDate), db = new Date(b.rawDate);
    return currentSort === 'newest' ? db - da : da - db;
  });

  if (!data.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        No blog posts found.
      </div>`;
    return;
  }

  grid.innerHTML = data.map(buildCardHTML).join('');

  grid.querySelectorAll('.blog-card').forEach(card => {
    card.addEventListener('click', () => openModal(+card.dataset.id));
  });
}

// ═══════════════════════════════════════════════════
// BUILD CARD HTML
// ═══════════════════════════════════════════════════
function buildCardHTML(b) {
  const coverHTML = b.coverImg
    ? `<img src="${b.coverImg}" alt="${b.title}" />`
    : `<div class="cover-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round">
           <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
           <circle cx="8.5" cy="8.5" r="1.5"/>
           <polyline points="21 15 16 10 5 21"/>
         </svg>
       </div>`;

  return `
    <div class="blog-card" data-id="${b.id}">
      <div class="card-cover">${coverHTML}</div>
      <div class="card-body">
        <div class="card-author-row">
          <div class="author-avatar">${b.authorInitials}</div>
          <span class="author-name">${b.author}</span>
          <button class="card-menu-btn" title="Options" onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.2"/>
              <circle cx="12" cy="12" r="1.2"/>
              <circle cx="12" cy="19" r="1.2"/>
            </svg>
          </button>
        </div>
        <div class="card-title">${b.title}</div>
        <div class="card-excerpt">${b.excerpt}</div>
        <div class="card-footer">
          <span class="card-date">${b.date}</span>
          <span class="card-read-more">
            Read more
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════
// MODAL — open
// ═══════════════════════════════════════════════════
function openModal(id) {
  const blog = blogs.find(b => b.id === id);
  if (!blog) return;

  document.getElementById('modalTitle').textContent        = blog.title;
  document.getElementById('modalAuthorAvatar').textContent = blog.authorInitials;
  document.getElementById('modalAuthorName').textContent   = blog.author;
  document.getElementById('modalAuthorDate').textContent   = blog.date;
  document.getElementById('modalContent').innerHTML        = blog.content;

  const imgEl         = document.getElementById('modalCoverImg');
  const placeholderEl = document.getElementById('modalCoverPlaceholder');
  if (blog.coverImg) {
    imgEl.src = blog.coverImg;
    imgEl.style.display         = 'block';
    placeholderEl.style.display = 'none';
  } else {
    imgEl.style.display         = 'none';
    placeholderEl.style.display = 'flex';
  }

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ═══════════════════════════════════════════════════
// MODAL — close
// ═══════════════════════════════════════════════════
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ═══════════════════════════════════════════════════
// SIDEBAR — hamburger toggle (mobile)
// ═══════════════════════════════════════════════════
function initSidebarToggle() {
  const hamburgerBtn   = document.getElementById('hamburgerBtn');
  const sidebar        = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openSidebar);
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Close sidebar on nav link click (mobile UX)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 640) closeSidebar();
    });
  });
}

// ═══════════════════════════════════════════════════
// SIDEBAR — active state
// ═══════════════════════════════════════════════════
function initSidebarNav() {
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const itemFile = (item.getAttribute('href') || '').split('/').pop();
    item.classList.toggle('active', itemFile === currentFile);
  });
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  initSidebarNav();
  initSidebarToggle();

  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderGrid();
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderGrid();
  });

  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});