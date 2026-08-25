import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase configuration (same project / collection as before — placeholders unchanged)
const firebaseConfig = {
  apiKey: "AIzaSyAxauEEtqkuJOWA9HRe1jpT_wCXH62nksM",
  authDomain: "schoolcms-77713.firebaseapp.com",
  projectId: "schoolcms-77713",
  storageBucket: "schoolcms-77713.appspot.com",
  messagingSenderId: "757700374571",
  appId: "1:757700374571:web:a86b334d619cf160fa7a6e"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const firestore = getFirestore(app);

// WhatsApp number used for the "Book Now" action
const WHATSAPP_NUMBER = "254702066492";

function isVideo(url) {
  return [".mp4", ".webm"].some(ext => (url || "").toLowerCase().includes(ext));
}

/* ============ Instructor photo lightbox ============
   Each instructor's main photo + portfolio photos/videos are registered as
   one browsable set (see registerGallery below). Clicking any of them opens
   the shared #mcLightbox and lets a visitor step through that same
   instructor's whole set with prev/next, the keyboard, or by swiping past
   the edges of the media on touch devices. */
const galleries = new Map();
function registerGallery(instructorIdx, name, items) {
  galleries.set(instructorIdx, { name, items });
}

let lightboxEl, lightboxMedia, lightboxCaption, lightboxPrev, lightboxNext, lightboxClose;
let activeGallery = null;
let activeIndex = 0;

function initLightbox() {
  lightboxEl = document.getElementById("mcLightbox");
  if (!lightboxEl) return;
  lightboxMedia = document.getElementById("mcLightboxMedia");
  lightboxCaption = document.getElementById("mcLightboxCaption");
  lightboxPrev = document.getElementById("mcLightboxPrev");
  lightboxNext = document.getElementById("mcLightboxNext");
  lightboxClose = document.getElementById("mcLightboxClose");

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => stepLightbox(-1));
  lightboxNext.addEventListener("click", () => stepLightbox(1));
  lightboxEl.addEventListener("click", (e) => { if (e.target === lightboxEl) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lightboxEl.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });
}

function openLightbox(instructorIdx, photoIdx) {
  const gallery = galleries.get(instructorIdx);
  if (!gallery || !gallery.items.length) return;
  activeGallery = gallery;
  activeIndex = photoIdx;
  renderLightboxMedia();
  lightboxEl.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove("is-open");
  lightboxMedia.innerHTML = "";
  document.body.style.overflow = "";
  activeGallery = null;
}

function stepLightbox(delta) {
  if (!activeGallery) return;
  const count = activeGallery.items.length;
  activeIndex = (activeIndex + delta + count) % count;
  renderLightboxMedia();
}

function renderLightboxMedia() {
  const { name, items } = activeGallery;
  const url = items[activeIndex];
  lightboxMedia.innerHTML = isVideo(url)
    ? `<video src="${url}" controls autoplay playsinline></video>`
    : `<img src="${url}" alt="${name} photo ${activeIndex + 1}">`;
  lightboxCaption.textContent = items.length > 1
    ? `${name} — photo ${activeIndex + 1} of ${items.length}`
    : name;
  const multiple = items.length > 1;
  lightboxPrev.hidden = !multiple;
  lightboxNext.hidden = !multiple;
}

initLightbox();

// Render approved instructors from the "lc_model_connect_instructors" collection
// (a fresh collection — only instructors added through the new admin editor appear here):
//   Name_story           -> Instructor name
//   header_image_stories -> Profile photo
//   text_description     -> Location / specialization / experience / fee (free text)
//   content_images       -> Portfolio photos
function renderInstructorSkeletons(container, count) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const card = document.createElement("div");
    card.className = "instructor-card skel-card";
    card.innerHTML = `
      <div class="skel-shimmer" style="width:100%;height:240px;"></div>
      <div class="instructor-card__body">
        <div class="skel-line skel-shimmer" style="height:18px;width:60%;"></div>
        <div class="skel-line skel-shimmer" style="width:90%;"></div>
        <div class="skel-line skel-shimmer" style="width:80%;"></div>
      </div>
    `;
    container.appendChild(card);
  }
}

async function displayInstructors() {
  const container = document.getElementById("instructor-directory");
  if (!container) return;

  renderInstructorSkeletons(container, 6);

  try {
    const snapshot = await getDocs(collection(firestore, "lc_model_connect_instructors"));

    if (snapshot.empty) {
      container.innerHTML = `<p class="mc-empty">No instructors listed yet. Check back soon.</p>`;
      return;
    }

    container.innerHTML = "";

    // Firestore's QuerySnapshot.forEach only hands back the document, not
    // an index (unlike Array.prototype.forEach) - track it ourselves.
    let instructorIdx = 0;
    snapshot.forEach((docSnap) => {
      const idx = instructorIdx++;
      const data = docSnap.data();
      const name = data.Name_story || "Modeling Instructor";
      const photo = data.header_image_stories || "";
      const details = data.text_description || "";
      const portfolio = Array.isArray(data.content_images) ? data.content_images : [];

      // The main photo plus every portfolio photo/video form one browsable
      // set per instructor, so clicking any of them opens the same
      // lightbox and lets a visitor page through all of that instructor's
      // photos with prev/next - not just the one they clicked.
      const gallery = [...(photo ? [photo] : []), ...portfolio];
      registerGallery(idx, name, gallery);

      const card = document.createElement("article");
      card.className = "instructor-card";

      const photoHTML = photo
        ? `<button type="button" class="instructor-card__photo-frame" data-instructor="${idx}" data-photo="0" aria-label="View photo of ${name}">
             <img src="${photo}" alt="${name}" class="instructor-card__photo" loading="lazy">
             <span class="instructor-card__zoom-hint"><i class="fa-solid fa-expand"></i></span>
           </button>`
        : `<div class="instructor-card__photo-frame"><div class="instructor-card__photo--placeholder"><i class="fa-solid fa-user"></i></div></div>`;

      const portfolioOffset = photo ? 1 : 0;
      const portfolioHTML = portfolio.length
        ? `<p class="instructor-card__portfolio-label"><i class="fa-solid fa-images"></i> More Information — Tap a photo</p>
           <div class="instructor-card__portfolio">${portfolio.map((url, i) => `
              <button type="button" class="instructor-card__thumb-btn" data-instructor="${idx}" data-photo="${portfolioOffset + i}" aria-label="View photo ${i + 1} of ${name}'s portfolio">
                ${isVideo(url)
                  ? `<video src="${url}" muted playsinline class="instructor-card__thumb"></video><i class="fa-solid fa-circle-play"></i>`
                  : `<img src="${url}" alt="${name} portfolio ${i + 1}" class="instructor-card__thumb" loading="lazy">`}
              </button>`).join("")}</div>`
        : "";

      const bookMsg = encodeURIComponent(`Hello, I'd like to book a training session with instructor ${name} on L&C Model Connect.`);

      card.innerHTML = `
        ${photoHTML}
        <div class="instructor-card__body">
          <h3 class="instructor-card__name">${name}</h3>
          <p class="instructor-card__details">${details}</p>
          ${portfolioHTML}
          <a class="instructor-card__book" href="https://wa.me/${WHATSAPP_NUMBER}?text=${bookMsg}" target="_blank" rel="noopener">
            <i class="fa-solid fa-calendar-check"></i> Book Now
          </a>
        </div>
      `;

      container.appendChild(card);
    });

    container.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-instructor]");
      if (!trigger) return;
      openLightbox(Number(trigger.dataset.instructor), Number(trigger.dataset.photo));
    });
  } catch (error) {
    console.error("Error loading instructors:", error);
    container.innerHTML = `<p class="mc-empty">We couldn't load instructors right now. Please try again later.</p>`;
  }
}

displayInstructors();

/* ============ Live statistics band ============ */

// Real, not guessed: pulls the actual approved-instructor count from the
// same collection the directory above renders from.
async function loadInstructorCount() {
  const el = document.getElementById("mcStatInstructors");
  if (!el) return;
  try {
    const snap = await getCountFromServer(collection(firestore, "lc_model_connect_instructors"));
    const count = snap.data().count;
    if (count > 0) {
      el.dataset.countTo = String(count);
    } else {
      // A "0+" stat undermines trust rather than building it — hide this
      // card until at least one instructor has been approved.
      el.closest(".mc-stat")?.style.setProperty("display", "none");
    }
  } catch (error) {
    console.error("Error loading instructor count:", error);
  }
}

function initStatCounters() {
  const stats = document.querySelectorAll(".mc-stat__value");
  if (!stats.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animate(el) {
    const target = parseFloat(el.dataset.countTo) || 0;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion || target === 0) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (!("IntersectionObserver" in window)) {
    stats.forEach(animate);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  stats.forEach(el => io.observe(el));
}

loadInstructorCount();
initStatCounters();
