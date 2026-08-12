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

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const name = data.Name_story || "Modeling Instructor";
      const photo = data.header_image_stories || "";
      const details = data.text_description || "";
      const portfolio = Array.isArray(data.content_images) ? data.content_images : [];

      const card = document.createElement("article");
      card.className = "instructor-card";

      const photoHTML = photo
        ? `<img src="${photo}" alt="${name}" class="instructor-card__photo" loading="lazy">`
        : `<div class="instructor-card__photo instructor-card__photo--placeholder"><i class="fa-solid fa-user"></i></div>`;

      const portfolioHTML = portfolio.length
        ? `<div class="instructor-card__portfolio">${portfolio.map(url =>
            isVideo(url)
              ? `<video src="${url}" muted playsinline class="instructor-card__thumb"></video>`
              : `<img src="${url}" alt="${name} portfolio" class="instructor-card__thumb" loading="lazy">`
          ).join("")}</div>`
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
