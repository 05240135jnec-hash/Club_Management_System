/* ══════════════════════════════════════════════════════
   JNEC Club Management — Gallery Page Logic
   File: gallery.js
   Linked by: gallery.html
══════════════════════════════════════════════════════ */

// ══════════════════════════════
// MEDIA CLUB ALBUM DATA
// ══════════════════════════════
const GALLERY_DATA = [
  {
    id: 1,
    title: "Photography Shoot — Campus Life",
    date: "Mar 20, 2026",
    uploadedAt: "2026-03-21T10:00:00",
    desc: "A day-long photo walk capturing candid moments, architecture, and student life across the JNEC campus.",
    cover: "YOUR_IMAGE_LINK_HERE",
    images: [
      "../image/generalpage.png",
      "../image/iluc.png",
      "../image/wc.png",
      "../image/1.jpeg",
      "../image/2.1.png",
      "../image/2.2.png",
      "../image/2.3.png",
      "../image/2.jpeg",
      "../image/3.jpeg",
      "../image/4.jpeg",
    ]
  },
  {
    id: 2,
    title: "Videography Workshop",
    date: "Feb 28, 2026",
    uploadedAt: "2026-03-01T09:30:00",
    desc: "Hands-on videography session covering camera settings, framing, lighting, and basic video editing techniques.",
    cover: "YOUR_IMAGE_LINK_HERE",
    images: [
      "../image/2.1.png",
      "../image/2.2.png",
      "../image/2.3.png",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
    ]
  },
  {
    id: 3,
    title: "Behind the Lens — BTS Coverage",
    date: "Feb 10, 2026",
    uploadedAt: "2026-02-12T14:00:00",
    desc: "Media club members documenting the annual cultural night from behind the scenes — setups, interviews, and action shots.",
    cover: "YOUR_IMAGE_LINK_HERE",
    images: [
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
    ]
  },
  {
    id: 4,
    title: "Portrait Photography Session",
    date: "Jan 15, 2026",
    uploadedAt: "2026-01-16T11:00:00",
    desc: "Studio-style portrait session for club members, practicing lighting setups, backdrops, and post-processing workflows.",
    cover: "YOUR_IMAGE_LINK_HERE",
    images: [
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
    ]
  },
  {
    id: 5,
    title: "Freshers' Orientation Coverage",
    date: "Dec 5, 2025",
    uploadedAt: "2025-12-06T08:45:00",
    desc: "Full event coverage of the freshers' orientation day — speeches, group activities, and welcome performances.",
    cover: "YOUR_IMAGE_LINK_HERE",
    images: [
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
    ]
  },
  {
    id: 6,
    title: "Editing & Post-Production Workshop",
    date: "Nov 20, 2025",
    uploadedAt: "2025-11-21T13:00:00",
    desc: "A practical workshop on photo retouching, colour grading, and exporting media for print and social platforms.",
    cover: "YOUR_IMAGE_LINK_HERE",
    images: [
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
      "YOUR_IMAGE_LINK_HERE",
    ]
  },
];

// ══════════════════════════════
// IMAGE LIMIT ENFORCEMENT
// ══════════════════════════════
const MAX_IMAGES = 10;

function clampImages(album) {
  const imgs = (album.images || []).slice(0, MAX_IMAGES);
  return { ...album, images: imgs.length >= 1 ? imgs : [album.cover] };
}

// ══════════════════════════════
// APP STATE
// ══════════════════════════════
let sortOrder = 'uploaded';
let lbAlbum   = null;
let lbImgIdx  = 0;

// ══════════════════════════════
// SVG ICONS
// ══════════════════════════════
const SVG = {
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`,

  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
               <polyline points="7 10 12 15 17 10"/>
               <line x1="12" y1="15" x2="12" y2="3"/>
             </svg>`,

  photo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>`,

  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <rect x="3" y="4" width="18" height="18" rx="2"/>
               <line x1="16" y1="2" x2="16" y2="6"/>
               <line x1="8" y1="2" x2="8" y2="6"/>
               <line x1="3" y1="10" x2="21" y2="10"/>
             </svg>`,

  sort: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <line x1="4" y1="6" x2="20" y2="6"/>
           <line x1="4" y1="12" x2="14" y2="12"/>
           <line x1="4" y1="18" x2="8" y2="18"/>
         </svg>`,

  imagePlaceholder: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                       <rect x="3" y="3" width="18" height="18" rx="2"/>
                       <circle cx="8.5" cy="8.5" r="1.5"/>
                       <polyline points="21 15 16 10 5 21"/>
                     </svg>`,

  emptyGallery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                   <rect x="3" y="3" width="18" height="18" rx="2"/>
                   <circle cx="8.5" cy="8.5" r="1.5"/>
                   <polyline points="21 15 16 10 5 21"/>
                 </svg>`,
};

// ══════════════════════════════
// SMART IMAGE LOADER
// ══════════════════════════════
function attachImageLoader(wrap, img) {
  const src = img.getAttribute('src') || '';
  const isPlaceholder = !src || src === 'YOUR_IMAGE_LINK_HERE' || src.trim() === '';

  if (isPlaceholder) {
    img.style.display = 'none';
    return;
  }

  img.onload = () => {
    img.classList.add('loaded');
    wrap.classList.add('img-ready');
  };

  img.onerror = () => {
    img.style.display = 'none';
  };

  if (img.complete && img.naturalWidth > 0) {
    img.classList.add('loaded');
    wrap.classList.add('img-ready');
  }
}

// ══════════════════════════════
// CARD HTML BUILDER
// ══════════════════════════════
function buildCardHTML(album) {
  const a = clampImages(album);

  const coverSrc = (!a.cover || a.cover === 'YOUR_IMAGE_LINK_HERE')
    ? (a.images.find(i => i && i !== 'YOUR_IMAGE_LINK_HERE') || '')
    : a.cover;

  const realCount = a.images.filter(i => i && i !== 'YOUR_IMAGE_LINK_HERE' && i.trim() !== '').length;
  const badgeCount = realCount > 0 ? realCount : a.images.length;

  return `
    <div class="gallery-card" data-id="${a.id}">
      <div class="card-img-wrap" id="imgwrap-${a.id}">
        <div class="card-img-placeholder">
          ${SVG.imagePlaceholder}
          <span>No image</span>
        </div>
        <img
          src="${coverSrc}"
          alt="${a.title}"
          loading="lazy"
          id="coverimg-${a.id}"
        />
        <div class="card-overlay">
          <div class="overlay-actions">
            <button class="ov-btn" title="View album"
              onclick="event.stopPropagation(); openLightbox(${a.id}, 0)">
              ${SVG.eye}
            </button>
            <button class="ov-btn" title="Download cover photo"
              onclick="event.stopPropagation(); downloadImg('${coverSrc}', '${a.title}')">
              ${SVG.download}
            </button>
          </div>
        </div>
        <div class="photo-count-badge">
          ${SVG.photo}
          ${badgeCount}
        </div>
      </div>
      <div class="card-body">
        <div class="card-date">
          ${SVG.calendar}
          ${a.date}
        </div>
        <div class="card-title">${a.title}</div>
        <div class="card-desc">${a.desc}</div>
      </div>
    </div>
  `;
}

// ══════════════════════════════
// RENDER GRID
// ══════════════════════════════
function renderGrid() {
  const grid    = document.getElementById('galleryGrid');
  const countEl = document.getElementById('albumCount');

  let data = [...GALLERY_DATA];

  if (sortOrder === 'uploaded') {
    data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  } else if (sortOrder === 'newest') {
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  if (countEl) {
    countEl.textContent = `${data.length} album${data.length !== 1 ? 's' : ''}`;
  }

  if (data.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        ${SVG.emptyGallery}
        <p>No albums available yet.</p>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(buildCardHTML).join('');

  data.forEach(album => {
    const wrap = document.getElementById(`imgwrap-${album.id}`);
    const img  = document.getElementById(`coverimg-${album.id}`);
    if (wrap && img) attachImageLoader(wrap, img);
  });

  grid.querySelectorAll('.gallery-card').forEach(card => {
    card.addEventListener('click', () => openLightbox(+card.dataset.id, 0));
  });
}

// ══════════════════════════════
// LIGHTBOX — OPEN
// ══════════════════════════════
function openLightbox(albumId, imgIdx) {
  const raw = GALLERY_DATA.find(a => a.id === albumId);
  const clamped = clampImages(raw);
  const realImages = clamped.images.filter(src => src && src !== 'YOUR_IMAGE_LINK_HERE' && src.trim() !== '');
  lbAlbum  = { ...clamped, images: realImages.length > 0 ? realImages : [''] };
  lbImgIdx = imgIdx;
  renderLightbox();
  document.getElementById('lightboxBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ══════════════════════════════
// LIGHTBOX — CLOSE
// ══════════════════════════════
function closeLightbox() {
  document.getElementById('lightboxBackdrop').classList.remove('open');
  document.body.style.overflow = '';
  lbAlbum = null;
}

// ══════════════════════════════
// LIGHTBOX — RENDER
// ══════════════════════════════
function renderLightbox() {
  if (!lbAlbum) return;

  document.getElementById('lbTitle').textContent = lbAlbum.title;
  document.getElementById('lbMeta').textContent =
    `${lbAlbum.date}  ·  ${lbAlbum.images.length} photo${lbAlbum.images.length > 1 ? 's' : ''}`;
  document.getElementById('lbDesc').textContent = lbAlbum.desc;

  const multiImage = lbAlbum.images.length > 1;
  document.getElementById('lbPrev').classList.toggle('hidden', !multiImage);
  document.getElementById('lbNext').classList.toggle('hidden', !multiImage);
  document.getElementById('lbThumbs').classList.toggle('hidden', !multiImage);

  updateLbImage();
  if (multiImage) renderThumbs();
}

// ══════════════════════════════
// LIGHTBOX — UPDATE MAIN IMAGE
// ══════════════════════════════
function updateLbImage() {
  const img = document.getElementById('lbMainImg');
  img.style.opacity = '0';

  setTimeout(() => {
    img.src = lbAlbum.images[lbImgIdx];
    img.style.opacity = '1';
  }, 150);

  const counter = document.getElementById('lbCounter');
  if (lbAlbum.images.length <= 1) {
    counter.style.display = 'none';
  } else {
    counter.style.display = '';
    counter.textContent = `${lbImgIdx + 1} / ${lbAlbum.images.length}`;
  }

  const prevBtn = document.getElementById('lbPrev');
  const nextBtn = document.getElementById('lbNext');
  if (prevBtn) prevBtn.classList.toggle('disabled', lbImgIdx === 0);
  if (nextBtn) nextBtn.classList.toggle('disabled', lbImgIdx === lbAlbum.images.length - 1);

  document.querySelectorAll('.lb-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === lbImgIdx);
  });

  const activeThumb = document.querySelector('.lb-thumb.active');
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}

// ══════════════════════════════
// LIGHTBOX — RENDER THUMBNAILS
// ══════════════════════════════
function renderThumbs() {
  const thumbsEl = document.getElementById('lbThumbs');
  thumbsEl.innerHTML = lbAlbum.images.map((src, i) => `
    <div class="lb-thumb ${i === lbImgIdx ? 'active' : ''}" data-i="${i}">
      <img src="${src}" alt="Thumbnail ${i + 1}" loading="lazy" />
    </div>
  `).join('');

  thumbsEl.querySelectorAll('.lb-thumb').forEach(t => {
    t.addEventListener('click', () => {
      lbImgIdx = +t.dataset.i;
      updateLbImage();
    });
  });
}

// ══════════════════════════════
// DOWNLOAD HELPER
// ══════════════════════════════
function downloadImg(url, name) {
  if (!url || url === 'YOUR_IMAGE_LINK_HERE') return;
  const a = document.createElement('a');
  a.href     = url;
  a.download = name.replace(/\s+/g, '-').toLowerCase() + '.jpg';
  a.target   = '_blank';
  a.click();
}

// ══════════════════════════════
// SIDEBAR TOGGLE (hamburger)
// ══════════════════════════════
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('hamburgerBtn').addEventListener('click', openSidebar);
document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

// Close sidebar when a nav link is tapped on mobile
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 768) closeSidebar();
  });
});

// ══════════════════════════════
// EVENT LISTENERS — LIGHTBOX
// ══════════════════════════════
document.getElementById('lbCloseBtn').addEventListener('click', closeLightbox);

document.getElementById('lightboxBackdrop').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeLightbox();
});

document.getElementById('lbPrev').addEventListener('click', () => {
  if (!lbAlbum || lbImgIdx === 0) return;
  lbImgIdx -= 1;
  updateLbImage();
});

document.getElementById('lbNext').addEventListener('click', () => {
  if (!lbAlbum || lbImgIdx === lbAlbum.images.length - 1) return;
  lbImgIdx += 1;
  updateLbImage();
});

document.getElementById('lbDownloadBtn').addEventListener('click', () => {
  if (lbAlbum) downloadImg(lbAlbum.images[lbImgIdx], lbAlbum.title + '-' + (lbImgIdx + 1));
});

document.addEventListener('keydown', e => {
  if (!lbAlbum) return;
  if (e.key === 'ArrowLeft' && lbAlbum.images.length > 1 && lbImgIdx > 0) {
    lbImgIdx -= 1; updateLbImage();
  }
  if (e.key === 'ArrowRight' && lbAlbum.images.length > 1 && lbImgIdx < lbAlbum.images.length - 1) {
    lbImgIdx += 1; updateLbImage();
  }
  if (e.key === 'Escape') closeLightbox();
});

// ══════════════════════════════
// SORT TOGGLE
// ══════════════════════════════
const SORT_CYCLE  = ['uploaded', 'newest', 'oldest'];
const SORT_LABELS = {
  uploaded: 'Recently Uploaded',
  newest:   'Newest First',
  oldest:   'Oldest First',
};

document.getElementById('sortBtn').addEventListener('click', () => {
  const idx  = SORT_CYCLE.indexOf(sortOrder);
  sortOrder  = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
  document.getElementById('sortBtn').innerHTML = `${SVG.sort} ${SORT_LABELS[sortOrder]}`;
  renderGrid();
});

// ══════════════════════════════
// SIDEBAR ACTIVE STATE
// ══════════════════════════════
function setActiveSidebarItem() {
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const itemFile = (item.getAttribute('href') || '').split('/').pop();
    if (itemFile && itemFile === currentFile) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

setActiveSidebarItem();

// ══════════════════════════════
// INIT
// ══════════════════════════════
renderGrid();