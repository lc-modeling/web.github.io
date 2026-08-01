import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxauEEtqkuJOWA9HRe1jpT_wCXH62nksM",
  authDomain: "schoolcms-77713.firebaseapp.com",
  projectId: "schoolcms-77713",
  storageBucket: "schoolcms-77713.appspot.com",
  messagingSenderId: "757700374571",
  appId: "1:757700374571:web:a86b334d619cf160fa7a6e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Debounce function to prevent multiple triggers
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Function to sanitize HTML content
function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Discover-style relative time ("just now", "5h", "2d", "3w"...)
function getRelativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const week = Math.round(day / 7);
  const month = Math.round(day / 30);
  const year = Math.round(day / 365);

  if (sec < 60) return 'just now';
  if (min < 60) return `${min}m`;
  if (hr < 24) return `${hr}h`;
  if (day < 7) return `${day}d`;
  if (week < 5) return `${week}w`;
  if (month < 12) return `${month}mo`;
  return `${year}y`;
}

// ~200 words/min average reading speed
function getReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function renderSkeletonCards(container, count) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'post skeleton-card';
    card.innerHTML = `
      <div class="skeleton-media shimmer"></div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-line--title shimmer"></div>
        <div class="skeleton-line skeleton-line--meta shimmer"></div>
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line shimmer" style="width:70%"></div>
      </div>
    `;
    container.appendChild(card);
  }
}

// Function to fetch and display blog posts
async function displayBlogPosts() {
  const blogRef = collection(firestore, "lcschoolblog");
  const blogQuery = query(blogRef, orderBy("published_on", "desc"));
  const blogContainer = document.getElementById('blog-container');
  renderSkeletonCards(blogContainer, 6);

  try {
    const blogSnapshot = await getDocs(blogQuery);
    blogContainer.innerHTML = '';

    let postIndex = 0;
    let totalReadMinutes = 0;
    let latestRelativeTime = null;
    blogSnapshot.forEach(doc => {
      const postData = doc.data();
      const postElement = document.createElement('article');
      postElement.className = 'post reveal';
      postElement.id = encodeURIComponent(postData.header_image);
      const imgLoading = postIndex < 2 ? 'eager' : 'lazy';
      postIndex++;

      let publishedDate = null;
      if (postData.published_on) {
        publishedDate = postData.published_on.toDate
          ? postData.published_on.toDate()
          : new Date(postData.published_on);
      }
      const relativeTime = publishedDate ? getRelativeTime(publishedDate) : 'recently';
      const fullDateTitle = publishedDate
        ? publishedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

      let contentHtml = '';
      let fullText = '';
      postData.content.forEach(contentItem => {
        if (contentItem.value) {
          contentHtml += `<p>${sanitizeHTML(contentItem.value)}</p>`;
          fullText += contentItem.value + ' ';
        }
      });
      const readingTime = getReadingTime(fullText);
      totalReadMinutes += readingTime;
      if (latestRelativeTime === null) latestRelativeTime = relativeTime;

      const imgSrc = sanitizeHTML(postData.header_image);
      const nameEsc = sanitizeHTML(postData.name);

      postElement.innerHTML = `
        <div class="post-media">
          <img class="post-media__bg" src="${imgSrc}" alt="" aria-hidden="true" loading="${imgLoading}">
          <img class="post-media__fg" src="${imgSrc}" alt="${nameEsc}" loading="${imgLoading}">
        </div>
        <div class="post-body">
          <h2 class="post-title">${nameEsc}</h2>
          <div class="post-meta">
            <div class="post-source">
              <img class="source-avatar" src="/apple-touch-icon.png" alt="">
              <span class="source-name">L&amp;C Modeling</span>
              <span class="meta-dot">&middot;</span>
              <time class="post-time" title="${fullDateTitle}">${relativeTime}</time>
              <span class="meta-dot">&middot;</span>
              <span class="post-read-time">${readingTime} min read</span>
            </div>
            <div class="post-actions">
              <button type="button" class="action-btn like-btn" aria-label="Like this post" aria-pressed="false">
                <i class="fa-regular fa-heart"></i>
              </button>
              <button type="button" class="action-btn expand-btn" aria-label="Read full story">
                <i class="fa-solid fa-expand"></i>
              </button>
              <button type="button" class="action-btn share-btn" aria-label="Share this post">
                <i class="fa-solid fa-share-nodes"></i>
              </button>
              <button type="button" class="action-btn more-btn" aria-label="More options">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
            </div>
          </div>
          <div class="post-content">${contentHtml}</div>
        </div>
      `;

      blogContainer.appendChild(postElement);
    });

    restoreLikedState();
    initScrollReveal();
    updateHeroStats(postIndex, totalReadMinutes, latestRelativeTime);

    // Scroll to the specific post if header_image matches
    const urlParams = new URLSearchParams(window.location.search);
    const headerImage = urlParams.get('header_image');
    if (headerImage) {
      const targetPost = document.getElementById(encodeURIComponent(headerImage));
      if (targetPost) {
        debounce(() => {
          targetPost.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200)();
      }
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    blogContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
  }
}

/* ============ Hero stats (computed from what actually loaded) ============ */

function updateHeroStats(postCount, totalReadMinutes, latestRelativeTime) {
  const countEl = document.getElementById('statPostCount');
  const readEl = document.getElementById('statReadTime');
  const updatedEl = document.getElementById('statUpdated');
  if (countEl) countEl.textContent = postCount;
  if (readEl) readEl.textContent = totalReadMinutes;
  if (updatedEl) updatedEl.textContent = latestRelativeTime || '–';
}

/* ============ Live search ============ */

function initBlogSearch() {
  const input = document.getElementById('blogSearchInput');
  const note = document.getElementById('searchResultsNote');
  if (!input || !note) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const posts = document.querySelectorAll('#blog-container .post:not(.skeleton-card)');
    let visibleCount = 0;

    posts.forEach(post => {
      const title = post.querySelector('.post-title')?.textContent.toLowerCase() || '';
      const body = post.querySelector('.post-content')?.textContent.toLowerCase() || '';
      const matches = q === '' || title.includes(q) || body.includes(q);
      post.classList.toggle('search-hidden', !matches);
      if (matches) visibleCount++;
    });

    if (q === '') {
      note.hidden = true;
      note.textContent = '';
    } else {
      note.hidden = false;
      note.textContent = visibleCount === 0
        ? `No stories match "${input.value.trim()}"`
        : `${visibleCount} ${visibleCount === 1 ? 'story matches' : 'stories match'} "${input.value.trim()}"`;
    }
  });
}

/* ============ Scroll-reveal entrance animation ============ */

function initScrollReveal() {
  const posts = document.querySelectorAll('.post.reveal');
  if (!('IntersectionObserver' in window)) {
    posts.forEach(post => post.classList.add('reveal-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  posts.forEach(post => io.observe(post));
}

/* ============ Like button (visual, persisted locally) ============ */

const LIKED_KEY = 'lc-blog-liked-posts';

function getLikedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveLikedSet(set) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
}

function restoreLikedState() {
  const liked = getLikedSet();
  document.querySelectorAll('.post').forEach(post => {
    if (liked.has(post.id)) {
      const btn = post.querySelector('.like-btn');
      setLikedUI(btn, true);
    }
  });
}

function setLikedUI(btn, isLiked) {
  const icon = btn.querySelector('i');
  btn.classList.toggle('liked', isLiked);
  btn.setAttribute('aria-pressed', String(isLiked));
  icon.classList.toggle('fa-regular', !isLiked);
  icon.classList.toggle('fa-solid', isLiked);
}

function toggleLike(post, btn) {
  const liked = getLikedSet();
  const isLiked = liked.has(post.id);
  if (isLiked) {
    liked.delete(post.id);
  } else {
    liked.add(post.id);
  }
  saveLikedSet(liked);
  setLikedUI(btn, !isLiked);
}

/* ============ Toast ============ */

let toastEl = null;
let toastTimeout = null;

function showToast(message) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'lc-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>${sanitizeHTML(message)}</span>`;
  clearTimeout(toastTimeout);
  requestAnimationFrame(() => toastEl.classList.add('show'));
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

/* ============ Share ============ */

function copyLink(url) {
  const done = () => showToast('Link copied to clipboard!');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
  } else {
    fallbackCopy(url, done);
  }
}

function fallbackCopy(url, done) {
  const tempInput = document.createElement('input');
  tempInput.value = url;
  tempInput.style.position = 'fixed';
  tempInput.style.opacity = '0';
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  done();
}

function getShareUrlForPost(post) {
  return `${window.location.origin}${window.location.pathname}?header_image=${post.id}`;
}

let shareSheetEl = null;
let currentShare = { url: '', title: '' };

function buildShareSheet() {
  const backdrop = document.createElement('div');
  backdrop.className = 'share-backdrop';
  backdrop.innerHTML = `
    <div class="share-sheet" role="dialog" aria-modal="true" aria-label="Share this post">
      <div class="share-sheet__handle"></div>
      <div class="share-sheet__title">Share this post</div>
      <div class="share-grid">
        <button type="button" class="share-option share-option--whatsapp" data-action="whatsapp">
          <span class="share-option__icon"><i class="fa-brands fa-whatsapp"></i></span>
          <span>WhatsApp</span>
        </button>
        <button type="button" class="share-option share-option--facebook" data-action="facebook">
          <span class="share-option__icon"><i class="fa-brands fa-facebook-f"></i></span>
          <span>Facebook</span>
        </button>
        <button type="button" class="share-option share-option--x" data-action="x">
          <span class="share-option__icon"><i class="fa-brands fa-x-twitter"></i></span>
          <span>X</span>
        </button>
        <button type="button" class="share-option share-option--email" data-action="email">
          <span class="share-option__icon"><i class="fa-solid fa-envelope"></i></span>
          <span>Email</span>
        </button>
        <button type="button" class="share-option share-option--copy" data-action="copy">
          <span class="share-option__icon"><i class="fa-solid fa-link"></i></span>
          <span>Copy link</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeShareSheet();
  });

  backdrop.querySelectorAll('.share-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const { url, title } = currentShare;
      const encUrl = encodeURIComponent(url);
      const encTitle = encodeURIComponent(title);
      switch (btn.dataset.action) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encTitle}%20${encUrl}`, '_blank', 'noopener');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`, '_blank', 'noopener');
          break;
        case 'x':
          window.open(`https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`, '_blank', 'noopener');
          break;
        case 'email':
          window.location.href = `mailto:?subject=${encTitle}&body=${encUrl}`;
          break;
        case 'copy':
          copyLink(url);
          break;
      }
      closeShareSheet();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeShareSheet();
  });

  return backdrop;
}

function openShareSheet(url, title) {
  currentShare = { url, title };
  if (!shareSheetEl) shareSheetEl = buildShareSheet();
  shareSheetEl.classList.add('open');
}

function closeShareSheet() {
  if (shareSheetEl) shareSheetEl.classList.remove('open');
}

async function sharePost(post) {
  const title = post.querySelector('.post-title')?.textContent.trim() || 'L&C Modeling';
  const url = getShareUrlForPost(post);

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
    } catch (err) {
      if (err.name !== 'AbortError') openShareSheet(url, title);
    }
    return;
  }
  openShareSheet(url, title);
}

/* ============ Full-story reader popup ============ */

let readerEl = null;
const READER_HASH_PREFIX = '#read=';

function buildReader() {
  const overlay = document.createElement('div');
  overlay.className = 'reader-overlay';
  overlay.innerHTML = `
    <div class="reader-topbar">
      <button type="button" class="reader-close" aria-label="Close and go back">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <span class="reader-topbar-title"></span>
      <div class="reader-progress"><div class="reader-progress__bar"></div></div>
    </div>
    <div class="reader-body">
      <div class="reader-media">
        <img class="reader-media__bg" alt="" aria-hidden="true">
        <img class="reader-media__fg" alt="">
      </div>
      <div class="reader-inner">
        <h1 class="reader-title"></h1>
        <div class="reader-meta"></div>
        <div class="reader-content"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.reader-close').addEventListener('click', requestCloseReader);

  const body = overlay.querySelector('.reader-body');
  const progressBar = overlay.querySelector('.reader-progress__bar');
  body.addEventListener('scroll', () => {
    const scrollable = body.scrollHeight - body.clientHeight;
    const pct = scrollable <= 0 ? 100 : (body.scrollTop / scrollable) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) requestCloseReader();
  });

  return overlay;
}

function openReader(post) {
  if (!readerEl) readerEl = buildReader();

  const title = post.querySelector('.post-title')?.textContent.trim() || '';
  const imgSrc = post.querySelector('.post-media__fg')?.src || '';
  const timeText = post.querySelector('.post-time')?.textContent.trim() || '';
  const readTimeText = post.querySelector('.post-read-time')?.textContent.trim() || '';
  const contentHtml = post.querySelector('.post-content')?.innerHTML || '';

  readerEl.querySelector('.reader-topbar-title').textContent = title;
  readerEl.querySelector('.reader-media__bg').src = imgSrc;
  const fg = readerEl.querySelector('.reader-media__fg');
  fg.src = imgSrc;
  fg.alt = title;
  readerEl.querySelector('.reader-title').textContent = title;
  readerEl.querySelector('.reader-meta').innerHTML = `
    <img class="source-avatar" src="/apple-touch-icon.png" alt="">
    <span class="source-name">L&amp;C Modeling</span>
    <span class="meta-dot">&middot;</span>
    <span>${sanitizeHTML(timeText)}</span>
    <span class="meta-dot">&middot;</span>
    <span>${sanitizeHTML(readTimeText)}</span>
  `;
  readerEl.querySelector('.reader-content').innerHTML = contentHtml;
  readerEl.querySelector('.reader-body').scrollTop = 0;
  readerEl.querySelector('.reader-progress__bar').style.width = '0%';

  document.body.style.overflow = 'hidden';
  readerEl.classList.add('open');

  // Pushing a history entry lets the device/browser back button close the
  // reader instead of leaving the page, matching a native app's back behavior.
  history.pushState({ lcReader: true }, '', `${READER_HASH_PREFIX}${post.id}`);
}

// Ask history to go back when a reader entry was pushed; the popstate
// handler below is the single place that actually hides the overlay, so
// closing via the button, Escape, or the real back button all agree.
function requestCloseReader() {
  if (!readerEl || !readerEl.classList.contains('open')) return;
  if (history.state && history.state.lcReader) {
    history.back();
  } else {
    hideReader();
  }
}

function hideReader() {
  if (!readerEl) return;
  readerEl.classList.remove('open');
  document.body.style.overflow = '';
}

window.addEventListener('popstate', () => {
  hideReader();
});

/* ============ Event delegation for post actions ============ */

function initPostInteractions() {
  const blogContainer = document.getElementById('blog-container');
  blogContainer.addEventListener('click', (e) => {
    const post = e.target.closest('.post');
    if (!post) return;

    if (e.target.closest('.like-btn')) {
      toggleLike(post, e.target.closest('.like-btn'));
    } else if (e.target.closest('.expand-btn')) {
      openReader(post);
    } else if (e.target.closest('.share-btn') || e.target.closest('.more-btn')) {
      sharePost(post);
    }
  });
}

// Fetch and display the blog posts on page load
initPostInteractions();
initBlogSearch();
displayBlogPosts();
