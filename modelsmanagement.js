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

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Fetch models ordered by publish_date (newest first)
async function fetchModels() {
  const modelsRef = collection(firestore, "lc_models_management");
  const modelsQuery = query(modelsRef, orderBy("publish_date", "desc"));
  const snapshot = await getDocs(modelsQuery);
  return snapshot.docs.map(doc => doc.data());
}

// Create a slide element for each model
function createSlide(modelData) {
  const slide = document.createElement('div');
  slide.className = 'custom-slide';
  // Use encoded header_image as an identifier (assuming uniqueness)
  slide.id = encodeURIComponent(modelData.header_image);
  
  slide.innerHTML = `
    <div class="custom-profile-image">
      <img src="${modelData.header_image}" alt="${modelData.name}">
    </div>
    <h3>${modelData.name}</h3>
    <p>${modelData.text_description}</p>
    <button onclick="window.location.href='model.html?header_image=${encodeURIComponent(modelData.header_image)}'">
      View Model
    </button>
  `;
  return slide;
}

// Initialize the slider
async function initSlider() {
  const sliderTrack = document.getElementById('custom-slider-track');
  const dotsContainer = document.getElementById('custom-dots-container');
  const models = await fetchModels();
  sliderTrack.innerHTML = '';

  models.forEach(modelData => {
    const slide = createSlide(modelData);
    sliderTrack.appendChild(slide);
  });

  const slides = document.querySelectorAll('.custom-slide');
  let currentIndex = 0;
  const totalSlides = slides.length;

  function itemsToShow() {
    if (window.innerWidth >= 992) {
      return 6;
    } else if (window.innerWidth >= 600) {
      return 3;
    } else {
      return 2;
    }
  }

  function updateSlider() {
    const gap = parseInt(getComputedStyle(sliderTrack).gap) || 0;
    const slideElement = slides[0];
    const slideFullWidth = slideElement.offsetWidth + gap;
    // Wrap around if currentIndex is out of bounds
    if (currentIndex >= totalSlides) currentIndex = 0;
    if (currentIndex < 0) currentIndex = totalSlides - 1;
    sliderTrack.style.transform = `translateX(-${currentIndex * slideFullWidth}px)`;
    updateDots();
  }

  function createDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('div');
      dot.classList.add('custom-dot');
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateSlider();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = document.querySelectorAll('.custom-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  function nextSlide() {
    currentIndex++;
    updateSlider();
  }

  function prevSlide() {
    currentIndex--;
    updateSlider();
  }

  // Arrow event listeners
  document.querySelector('.custom-arrow-left').addEventListener('click', prevSlide);
  document.querySelector('.custom-arrow-right').addEventListener('click', nextSlide);
  window.addEventListener('resize', updateSlider);

  createDots();
  updateSlider();

  // Auto slide every 5 seconds
  setInterval(nextSlide, 5000);
}

initSlider();