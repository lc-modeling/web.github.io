import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAxauEEtqkuJOWA9HRe1jpT_wCXH62nks",
    authDomain: "schoolcms-77713.firebaseapp.com",
    projectId: "schoolcms-77713",
    storageBucket: "schoolcms-77713.appspot.com",
    messagingSenderId: "757700374571",
    appId: "1:757700374571:web:a86b334d619cf160fa7a6e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const container = document.getElementById('blogPreviewContainer');
const paginationDotsContainer = document.getElementById('paginationDots');
let scrollAmount = 0;
let startX;
let scrollLeftPos;

// Fetch and display images from Firestore
async function fetchAndDisplayImages() {
    try {
        const modelsCollection = collection(db, 'models_images');
        const modelsQuery = query(modelsCollection, orderBy('updated_on', 'desc'));
        const querySnapshot = await getDocs(modelsQuery);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const imageUrl = data.image;

            // Check if imageUrl exists and is valid
            if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
                addImageToContainer(imageUrl);
            } else {
                console.error(`No valid image URL found in document: ${doc.id}`, data);
            }
        });

        if (container.children.length === 0) {
            console.warn('No images were added to the container. Check your Firestore data.');
        }

        createPaginationDots();

    } catch (error) {
        console.error('Error fetching images from Firestore:', error);
    }
}

// Function to add images to the container
function addImageToContainer(imageUrl) {
    const card = document.createElement('div');
    card.classList.add('blog-preview-card');

    const imageDiv = document.createElement('div');
    imageDiv.classList.add('image');

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = "Modeling Image";
    img.onerror = () => console.error('Failed to load image at URL:', imageUrl);

    imageDiv.appendChild(img);
    card.appendChild(imageDiv);
    container.appendChild(card);
}

function createPaginationDots() {
    const numberOfDots = Math.ceil(container.children.length / 3);
    paginationDotsContainer.innerHTML = ""; // Clear existing dots
    for (let i = 0; i < numberOfDots; i++) {
        const dot = document.createElement('div');
        dot.classList.add('pagination-dot');
        dot.addEventListener('click', () => goToPage(i));
        paginationDotsContainer.appendChild(dot);
    }
    updatePaginationDots();
}

function updatePaginationDots() {
    const dots = paginationDotsContainer.children;
    const activeIndex = Math.round(scrollAmount / container.clientWidth);
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('active', i === activeIndex);
    }
}

function goToPage(pageIndex) {
    const width = container.clientWidth;
    scrollAmount = width * pageIndex;
    container.style.transform = `translateX(-${scrollAmount}px)`;
    updatePaginationDots();
}

function scrollLeft() {
    const width = container.clientWidth;
    scrollAmount = Math.max(scrollAmount - width, 0);
    container.style.transform = `translateX(-${scrollAmount}px)`;
    updatePaginationDots();
}

function scrollRight() {
    const width = container.clientWidth;
    const maxScroll = container.scrollWidth - width;
    scrollAmount = Math.min(scrollAmount + width, maxScroll);
    container.style.transform = `translateX(-${scrollAmount}px)`;
    updatePaginationDots();
}

container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX;
    scrollLeftPos = scrollAmount;
});

container.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX;
    const walk = startX - x;
    const width = container.clientWidth;
    const maxScroll = container.scrollWidth - width;
    scrollAmount = Math.max(0, Math.min(maxScroll, scrollLeftPos + walk));
    container.style.transform = `translateX(-${scrollAmount}px)`;
    updatePaginationDots();
});

// Call the function to fetch images when the script loads
fetchAndDisplayImages();