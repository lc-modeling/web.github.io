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

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const track = document.getElementById('dvTrack');
const dotsContainer = document.getElementById('dvDots');
const arrowLeft = document.getElementById('dvArrowLeft');
const arrowRight = document.getElementById('dvArrowRight');

const AUTO_SCROLL_INTERVAL = 3500;
const RESUME_DELAY = 4000;
let autoScrollTimer = null;
let resumeTimer = null;

function cardStep() {
    const card = track.querySelector('.dv-card');
    if (!card) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 18);
    return card.getBoundingClientRect().width + gap;
}

function scrollByCards(direction) {
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (direction > 0 && track.scrollLeft >= maxScroll - 4) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
    }
    if (direction < 0 && track.scrollLeft <= 4) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
        return;
    }
    track.scrollBy({ left: direction * cardStep(), behavior: 'smooth' });
}

function createDots() {
    dotsContainer.innerHTML = '';
    const count = track.children.length;
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.className = 'dv-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Go to image ${i + 1}`);
        dot.addEventListener('click', () => {
            const card = track.children[i];
            track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
            restartAutoScroll();
        });
        dotsContainer.appendChild(dot);
    }
    updateActiveDot();
}

function updateActiveDot() {
    const dots = dotsContainer.children;
    if (!dots.length) return;
    let closestIndex = 0;
    let closestDistance = Infinity;
    Array.from(track.children).forEach((card, i) => {
        const distance = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
        }
    });
    Array.from(dots).forEach((dot, i) => dot.classList.toggle('active', i === closestIndex));
}

function startAutoScroll() {
    stopAutoScroll();
    autoScrollTimer = setInterval(() => scrollByCards(1), AUTO_SCROLL_INTERVAL);
}

function stopAutoScroll() {
    if (autoScrollTimer) clearInterval(autoScrollTimer);
    autoScrollTimer = null;
}

function restartAutoScroll() {
    stopAutoScroll();
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAutoScroll, RESUME_DELAY);
}

async function displayDiversityImages() {
    try {
        const diversityRef = collection(firestore, "diversity_and_inclusivity");
        const diversityQuery = query(diversityRef, orderBy("time", "desc"));
        const diversitySnapshot = await getDocs(diversityQuery);

        track.innerHTML = '';

        diversitySnapshot.forEach(doc => {
            const postData = doc.data();
            const card = document.createElement('div');
            card.className = 'dv-card';
            card.innerHTML = `<img src="${postData.header_image}" alt="Modeling Image" loading="lazy">`;
            track.appendChild(card);
        });

        createDots();
        if (track.children.length > 1) startAutoScroll();
    } catch (error) {
        console.error("Error fetching and displaying diversity images: ", error);
    }
}

arrowLeft.addEventListener('click', () => { scrollByCards(-1); restartAutoScroll(); });
arrowRight.addEventListener('click', () => { scrollByCards(1); restartAutoScroll(); });

track.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateActiveDot);
});

['mouseenter', 'touchstart', 'focusin'].forEach(evt =>
    track.parentElement.addEventListener(evt, stopAutoScroll, { passive: true })
);
['mouseleave', 'touchend', 'focusout'].forEach(evt =>
    track.parentElement.addEventListener(evt, restartAutoScroll, { passive: true })
);

displayDiversityImages();
