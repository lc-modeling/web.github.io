import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
async function displayInstructors() {
  const container = document.getElementById("instructor-directory");
  if (!container) return;

  container.innerHTML = `<p class="mc-empty">Loading instructors…</p>`;

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
