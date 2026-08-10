import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
const db = getFirestore(app);

// Single-document collection: admin/modelsmanagementheader.html edits this
// same "banner" doc, so there's always exactly one image to fetch here.
async function loadModelsManagementHeaderImage() {
  try {
    const snap = await getDoc(doc(db, "models_management_header", "banner"));
    if (!snap.exists()) return; // keep the static fallback image in the HTML

    const data = snap.data();
    if (data.image) {
      const img = document.getElementById("modelsManagementHeaderImg");
      if (img) img.src = data.image;
    }
  } catch (error) {
    console.error("Error loading models management header image:", error);
  }
}

loadModelsManagementHeaderImage();
