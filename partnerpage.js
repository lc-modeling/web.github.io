/* partner.html — hero image + partner gallery, both managed from the admin
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

/* ---------- Hero image ---------- */
// Collection "partner_hero": newest doc with a `header_image` wins. The page
// already ships a sensible default image, so anything here is optional.
async function loadHero() {
  const img = document.getElementById("ppHeroImage");
  if (!img) return;
  try {
    const snap = await getDocs(query(collection(db, "partner_hero"), orderBy("time", "desc")));
    const doc = snap.docs.find(d => d.data().header_image);
    if (doc) img.src = doc.data().header_image;
  } catch (err) {
    console.error("partner hero load failed:", err);
  }
}

/* ---------- Partner gallery ---------- */
// Collection "partner_gallery": { image, caption?, time }. Section stays
// hidden until at least one image exists.
async function loadGallery() {
  const section = document.getElementById("ppGallerySection");
  const grid = document.getElementById("ppGalleryGrid");
  if (!section || !grid) return;
  try {
    const snap = await getDocs(query(collection(db, "partner_gallery"), orderBy("time", "desc")));
    const items = snap.docs.map(d => d.data()).filter(d => d.image);
    if (!items.length) return;

    grid.innerHTML = items.map(({ image, caption }) => `
      <figure>
        <img src="${image}" alt="${(caption || "L&C Modeling partnership moment").replace(/"/g, "&quot;")}" loading="lazy">
        ${caption ? `<figcaption>${caption}</figcaption>` : ""}
      </figure>
    `).join("");
    section.hidden = false;
  } catch (err) {
    console.error("partner gallery load failed:", err);
  }
}

/* ---------- Smooth scroll for the hero CTA ---------- */
document.querySelector('.pp-cta[href="#partner-form"]')?.addEventListener("click", (e) => {
  const target = document.getElementById("partner-form");
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------- Form feedback ----------
   email.js binds the actual submit + EmailJS send to every <form> and fires
   these events; we only surface the result. */
const form = document.getElementById("partnerForm");
const note = document.getElementById("ppFormNote");
const submitBtn = form?.querySelector(".pp-submit");

form?.addEventListener("submit", () => {
  if (note) { note.textContent = "Sending…"; note.className = "pp-form__note"; }
  if (submitBtn) submitBtn.disabled = true;
});

form?.addEventListener("formsubmit:success", () => {
  form.innerHTML = `
    <p style="font-family:'Playfair Display',serif;font-size:1.35rem;margin:0 0 8px;">Thank you.</p>
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

loadHero();
loadGallery();
