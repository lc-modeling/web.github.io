/* partner.html — hero slider + partner gallery, both managed from the admin
   dashboard (admindash/partnerpage.html). Uses the same Firestore project
   ("schoolcms-77713") the rest of the public site reads from. */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxauEEtqkuJOWA9HRe1jpT_wCXH62nksM",
  authDomain: "schoolcms-77713.firebaseapp.com",
  projectId: "schoolcms-77713",
  storageBucket: "schoolcms-77713.appspot.com",
  messagingSenderId: "757700374571",
  appId: "1:757700374571:web:a86b334d619cf160fa7a6e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const prefersReducedMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const escAttr = (s) => String(s || "").replace(/"/g, "&quot;");

/* ============================================================
   Hero slider — every doc in "partner_hero" is a slide.
   The page ships one default slide, so an empty collection is fine.
   ============================================================ */
async function loadHeroSlider() {
  const slider = document.getElementById("ppHeroSlider");
  const track = document.getElementById("ppHeroTrack");
  if (!slider || !track) return;

  let urls = [];
  try {
    const snap = await getDocs(query(collection(db, "partner_hero"), orderBy("time", "desc")));
    urls = snap.docs.map(d => d.data().header_image).filter(Boolean);
  } catch (err) {
    console.error("partner hero load failed:", err);
  }

  if (urls.length) {
    track.innerHTML = urls.map((url, i) => `
      <div class="pp-slider__slide">
        <img src="${escAttr(url)}" alt="L&C Modeling partnership highlight ${i + 1}"
             loading="${i === 0 ? "eager" : "lazy"}">
      </div>`).join("");
  }

  initSlider(slider, track);
}

function initSlider(slider, track) {
  const slides = track.children;
  const dotsWrap = slider.querySelector("#ppHeroDots");
  const prev = slider.querySelector("#ppHeroPrev");
  const next = slider.querySelector("#ppHeroNext");

  if (slides.length <= 1) {
    slider.classList.add("pp-slider--single");
    return;
  }
  slider.classList.remove("pp-slider--single");

  // Dots
  dotsWrap.innerHTML = Array.from(slides, (_, i) =>
    `<button type="button" aria-label="Go to photo ${i + 1}"></button>`).join("");
  const dots = dotsWrap.children;

  const indexFromScroll = () =>
    Math.round(track.scrollLeft / track.clientWidth);

  const go = (i, smooth = true) => {
    const clamped = (i + slides.length) % slides.length;
    track.scrollTo({
      left: clamped * track.clientWidth,
      behavior: smooth && !prefersReducedMotion ? "smooth" : "auto"
    });
  };

  const syncDots = () => {
    const active = indexFromScroll();
    Array.from(dots).forEach((d, i) => d.classList.toggle("is-active", i === active));
  };

  prev.addEventListener("click", () => { go(indexFromScroll() - 1); restart(); });
  next.addEventListener("click", () => { go(indexFromScroll() + 1); restart(); });
  Array.from(dots).forEach((d, i) =>
    d.addEventListener("click", () => { go(i); restart(); }));

  let scrollTick = false;
  track.addEventListener("scroll", () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => { syncDots(); scrollTick = false; });
  }, { passive: true });

  // Autoplay (skipped when the viewer prefers reduced motion)
  let timer = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const start = () => {
    if (prefersReducedMotion || timer) return;
    timer = setInterval(() => go(indexFromScroll() + 1), 5000);
  };
  let resumeT = null;
  const restart = () => { stop(); clearTimeout(resumeT); resumeT = setTimeout(start, 6000); };

  ["mouseenter", "focusin", "touchstart"].forEach(ev =>
    slider.addEventListener(ev, stop, { passive: true }));
  ["mouseleave", "focusout", "touchend"].forEach(ev =>
    slider.addEventListener(ev, start, { passive: true }));
  window.addEventListener("resize", () => go(indexFromScroll(), false));

  syncDots();
  start();
}

/* ============================================================
   Partner gallery — "partner_gallery": { image, caption?, time }.
   Feeds the "In the room" grid, and the first few images also
   illustrate the "Ways to partner" rows.
   ============================================================ */
async function loadGallery() {
  const section = document.getElementById("ppGallerySection");
  const grid = document.getElementById("ppGalleryGrid");
  if (!section || !grid) return;

  let items = [];
  try {
    const snap = await getDocs(query(collection(db, "partner_gallery"), orderBy("time", "desc")));
    items = snap.docs.map(d => d.data()).filter(d => d.image);
  } catch (err) {
    console.error("partner gallery load failed:", err);
    return;
  }
  if (!items.length) return;

  grid.innerHTML = items.map(({ image, caption }) => `
    <figure>
      <img src="${escAttr(image)}" alt="${escAttr(caption || "L&C Modeling partnership moment")}" loading="lazy">
      ${caption ? `<figcaption>${caption}</figcaption>` : ""}
    </figure>`).join("");
  section.hidden = false;

  // Illustrate the first three "Ways to partner" rows.
  for (let i = 0; i < 3; i++) {
    const fig = document.getElementById(`ppTrack${i}`)?.querySelector(".pp-track__media");
    const src = items[i]?.image;
    if (!fig || !src) continue;
    const img = fig.querySelector("img");
    img.src = src;
    img.alt = items[i].caption || "";
    fig.hidden = false;
    fig.closest(".pp-track").classList.add("has-media");
  }
}

/* ---------- Hero CTA smooth scroll ---------- */
document.querySelector('.pp-cta[href="#partner-form"]')?.addEventListener("click", (e) => {
  const target = document.getElementById("partner-form");
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
});

/* ---------- Form feedback ----------
   email.js binds the submit + EmailJS send to every <form> and fires these
   events; we only surface the result. */
const form = document.getElementById("partnerForm");
const note = document.getElementById("ppFormNote");
const submitBtn = form?.querySelector(".pp-submit");

form?.addEventListener("submit", () => {
  if (note) { note.textContent = "Sending…"; note.className = "pp-form__note"; }
  if (submitBtn) submitBtn.disabled = true;
});

form?.addEventListener("formsubmit:success", () => {
  form.innerHTML = `
    <p style="font-weight:700;letter-spacing:-0.02em;font-size:1.35rem;margin:0 0 8px;">Thank you.</p>
    <p style="color:var(--pp-ink-soft);margin:0;">Your proposal is in. We'll be in touch within two working days.</p>`;
  form.classList.add("is-done");
});

form?.addEventListener("formsubmit:error", () => {
  if (submitBtn) submitBtn.disabled = false;
  if (note) {
    note.textContent = "Something went wrong — please email us directly at Linkosiclothing@gmail.com.";
    note.className = "pp-form__note is-err";
  }
});

/* ---------- Footer year ---------- */
const yearEl = document.getElementById("ppYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();

loadHeroSlider();
loadGallery();
