/* ══════════════════════════════════════
   clubsearch.js  — v2
   Live Club Search Feature

   What it does:
   ─ Listens to the existing #searchInput
   ─ Shows a live dropdown of matching clubs
   ─ Each result shows ONLY the club name (no icon, no category badge)
   ─ Clicking a result opens the club detail panel
     (calls openClubPanel from clubdetailspanel.js)
   ─ Keyboard navigation (↑ ↓ Enter Escape)
   ─ Closes on outside click or Escape
   ─ Does NOT affect hamburger, stat counters,
     My Clubs section, or enrollment modal
══════════════════════════════════════ */

/* ════════════════════════════════════
   ALL CLUBS — name + category
   Mirrors the data in clubdetailspanel.js
   and myclub.js — single source of truth
   kept here to avoid cross-file dependency.
════════════════════════════════════ */
const ALL_CLUBS = [
  { name: "Y-Peer",                       category: "Volunteer"       },
  { name: "Rover Scout",                  category: "Volunteer"       },
  { name: "Red Cross",                    category: "Volunteer"       },
  { name: "JNEC Clean Toilet Initiative", category: "Volunteer"       },
  { name: "Mechanical Maintenance",       category: "Maintenance"     },
  { name: "Civil Maintenance",            category: "Maintenance"     },
  { name: "DIT Maintenance",              category: "Maintenance"     },
  { name: "Maintenance Hobby Club",       category: "Maintenance"     },
  { name: "Electrical Maintenance",       category: "Maintenance"     },
  { name: "Helping Hand Club",            category: "Social Service"  },
  { name: "JNEC GNH",                    category: "Social Service"  },
  { name: "JNEC Salon",                   category: "Social Service"  },
  { name: "Thakor Namsung Tshokpa",       category: "Social Service"  },
  { name: "Integrity Club",              category: "Social Service"  },
  { name: "Entrepreneurship Club",        category: "Entrepreneurship"},
  { name: "JNEC Music Club",             category: "Entertainment"   },
  { name: "Culture Club",                category: "Entertainment"   },
  { name: "Media Club",                  category: "Entertainment"   },
  { name: "Radio Club",                  category: "Entertainment"   },
  { name: "JNEC Karate",                 category: "Sports"          }
];

/* ════════════════════════════════════
   INJECT SEARCH DROPDOWN + STYLES
════════════════════════════════════ */
function injectSearchUI() {
  /* ── Styles ── */
  const style = document.createElement('style');
  style.textContent = `
    /* Search bar wrapper needs relative positioning */
    .search-bar-wrap {
      position: relative;
    }

    /* ── Dropdown container ── */
    .club-search-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 24px;
      right: 24px;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
      z-index: 999;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.07);
      animation: searchDropIn 0.18s cubic-bezier(0.4,0,0.2,1);
    }
    @keyframes searchDropIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Dropdown header ── */
    .search-dropdown-header {
      padding: 10px 16px 8px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #aaa;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .search-dropdown-count {
      font-size: 11px;
      font-weight: 600;
      color: #1a9fd4;
      text-transform: none;
      letter-spacing: 0;
    }

    /* ── Results list ── */
    .search-results-list {
      list-style: none;
      padding: 6px 0;
      margin: 0;
      max-height: 320px;
      overflow-y: auto;
    }
    .search-results-list::-webkit-scrollbar { width: 4px; }
    .search-results-list::-webkit-scrollbar-track { background: transparent; }
    .search-results-list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

    /* ── Result item — name only, clean row ── */
    .search-result-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 18px;
      cursor: pointer;
      transition: background 0.15s;
      outline: none;
    }
    .search-result-item:hover,
    .search-result-item.keyboard-active {
      background: #f4f8ff;
    }

    /* Club name only */
    .search-result-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
      flex: 1;
      min-width: 0;
    }
    /* Highlight matched text */
    .search-result-name mark {
      background: rgba(26,159,212,0.15);
      color: #1a9fd4;
      border-radius: 3px;
      padding: 0 1px;
      font-weight: 700;
    }

    /* Arrow */
    .search-result-arrow {
      color: #ccc;
      font-size: 12px;
      flex-shrink: 0;
      transition: color 0.15s, transform 0.15s;
    }
    .search-result-item:hover .search-result-arrow,
    .search-result-item.keyboard-active .search-result-arrow {
      color: #1a9fd4;
      transform: translateX(3px);
    }

    /* ── No results ── */
    .search-no-results {
      padding: 28px 16px;
      text-align: center;
      color: #bbb;
    }
    .search-no-results i {
      font-size: 28px;
      margin-bottom: 10px;
      display: block;
      color: #ddd;
    }
    .search-no-results-title {
      font-size: 14px;
      font-weight: 600;
      color: #999;
      margin-bottom: 4px;
    }
    .search-no-results-hint {
      font-size: 12px;
      color: #ccc;
    }

    /* ── Footer hint ── */
    .search-dropdown-footer {
      padding: 8px 16px 10px;
      border-top: 1px solid #f0f0f0;
      font-size: 11px;
      color: #bbb;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .search-dropdown-footer kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 10px;
      font-family: monospace;
      color: #666;
      gap: 3px;
    }
  `;
  document.head.appendChild(style);

  /* ── Dropdown element ── */
  const dropdown = document.createElement('div');
  dropdown.className = 'club-search-dropdown';
  dropdown.id = 'clubSearchDropdown';
  dropdown.style.display = 'none';
  dropdown.setAttribute('role', 'listbox');
  dropdown.setAttribute('aria-label', 'Club search results');

  // Insert into search-bar-wrap
  const wrap = document.getElementById('searchBarWrap');
  if (wrap) {
    wrap.appendChild(dropdown);
  } else {
    document.body.appendChild(dropdown);
  }
}

/* ════════════════════════════════════
   SEARCH LOGIC
════════════════════════════════════ */
let activeIndex = -1;
let currentResults = [];

function searchClubs(query) {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  return ALL_CLUBS.filter(club =>
    club.name.toLowerCase().includes(q) ||
    club.category.toLowerCase().includes(q)
  );
}

/* Highlight matched portion of text */
function highlightMatch(text, query) {
  if (!query) return escHtml(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escHtml(text);
  return (
    escHtml(text.slice(0, idx)) +
    '<mark>' + escHtml(text.slice(idx, idx + query.length)) + '</mark>' +
    escHtml(text.slice(idx + query.length))
  );
}

/* ════════════════════════════════════
   RENDER DROPDOWN
   — Shows only club name, no icon, no category badge
════════════════════════════════════ */
function renderDropdown(query) {
  const dropdown = document.getElementById('clubSearchDropdown');
  if (!dropdown) return;

  const results = searchClubs(query);
  currentResults = results;
  activeIndex = -1;

  if (!query.trim()) {
    dropdown.style.display = 'none';
    return;
  }

  dropdown.style.display = 'block';

  if (results.length === 0) {
    dropdown.innerHTML = `
      <div class="search-no-results">
        <i class="fas fa-search-minus"></i>
        <div class="search-no-results-title">No clubs found for "${escHtml(query)}"</div>
        <div class="search-no-results-hint">Try searching by club name or category</div>
      </div>
    `;
    return;
  }

  const items = results.map((club, i) => `
    <li
      class="search-result-item"
      role="option"
      tabindex="-1"
      data-index="${i}"
      data-club="${escHtml(club.name)}"
      aria-label="${escHtml(club.name)}"
    >
      <div class="search-result-name">${highlightMatch(club.name, query)}</div>
      <i class="fas fa-arrow-right search-result-arrow"></i>
    </li>
  `).join('');

  dropdown.innerHTML = `
    <div class="search-dropdown-header">
      <span>Clubs</span>
      <span class="search-dropdown-count">${results.length} result${results.length !== 1 ? 's' : ''}</span>
    </div>
    <ul class="search-results-list" id="searchResultsList" role="listbox">
      ${items}
    </ul>
    <div class="search-dropdown-footer">
      <kbd><i class="fas fa-arrow-up"></i></kbd>
      <kbd><i class="fas fa-arrow-down"></i></kbd>
      to navigate &nbsp;·&nbsp;
      <kbd>Enter</kbd> to open &nbsp;·&nbsp;
      <kbd>Esc</kbd> to close
    </div>
  `;

  /* Bind click on each result item */
  dropdown.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const clubName = item.getAttribute('data-club');
      selectClub(clubName);
    });
    /* Prevent mousedown from blurring input */
    item.addEventListener('mousedown', e => e.preventDefault());
  });
}

/* ════════════════════════════════════
   SELECT A CLUB FROM SEARCH
════════════════════════════════════ */
function selectClub(clubName) {
  closeDropdown();

  // Clear search input and close search bar
  const input = document.getElementById('searchInput');
  if (input) input.value = '';

  const searchBarWrap = document.getElementById('searchBarWrap');
  if (searchBarWrap) searchBarWrap.classList.remove('open');

  // Open club detail panel (from clubdetailspanel.js)
  if (typeof openClubPanel === 'function') {
    openClubPanel(clubName);
  } else {
    // Fallback: wait a tick for clubdetailspanel.js to be ready
    setTimeout(() => {
      if (typeof openClubPanel === 'function') openClubPanel(clubName);
    }, 100);
  }
}

/* ════════════════════════════════════
   KEYBOARD NAVIGATION
════════════════════════════════════ */
function handleKeyboardNav(e) {
  const dropdown = document.getElementById('clubSearchDropdown');
  if (!dropdown || dropdown.style.display === 'none') return;

  const items = dropdown.querySelectorAll('.search-result-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, items.length - 1);
    updateActiveItem(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, 0);
    updateActiveItem(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIndex >= 0 && items[activeIndex]) {
      const clubName = items[activeIndex].getAttribute('data-club');
      selectClub(clubName);
    } else if (currentResults.length === 1) {
      // Auto-select if only one result
      selectClub(currentResults[0].name);
    }
  }
}

function updateActiveItem(items) {
  items.forEach((item, i) => {
    if (i === activeIndex) {
      item.classList.add('keyboard-active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('keyboard-active');
    }
  });
}

/* ════════════════════════════════════
   CLOSE DROPDOWN
════════════════════════════════════ */
function closeDropdown() {
  const dropdown = document.getElementById('clubSearchDropdown');
  if (dropdown) dropdown.style.display = 'none';
  activeIndex = -1;
  currentResults = [];
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
   BIND EVENTS
════════════════════════════════════ */
function bindSearchEvents() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  /* Live search as user types */
  input.addEventListener('input', () => {
    renderDropdown(input.value);
  });

  /* Keyboard navigation */
  input.addEventListener('keydown', handleKeyboardNav);

  /* Close dropdown on blur (with small delay to allow click) */
  input.addEventListener('blur', () => {
    setTimeout(closeDropdown, 180);
  });

  /* Reopen dropdown on focus if there's text */
  input.addEventListener('focus', () => {
    if (input.value.trim()) {
      renderDropdown(input.value);
    }
  });

  /* Close search bar (X button) — also close dropdown */
  const closeBtn = document.getElementById('searchCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeDropdown();
      /* existing generalpage.js handles clearing input & closing bar */
    });
  }

  /* Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  /* Outside click */
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('clubSearchDropdown');
    const wrap = document.getElementById('searchBarWrap');
    if (
      dropdown &&
      !dropdown.contains(e.target) &&
      wrap && !wrap.contains(e.target)
    ) {
      closeDropdown();
    }
  });
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
function initClubSearch() {
  injectSearchUI();
  bindSearchEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClubSearch);
} else {
  initClubSearch();
}