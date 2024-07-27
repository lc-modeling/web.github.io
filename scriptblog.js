// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
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

// Function to copy the post link to the clipboard
function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Ensure the copyToClipboard function is in the global scope
window.copyToClipboard = copyToClipboard;

// Function to fetch and display blog posts
async function displayBlogPosts() {
    const blogRef = collection(firestore, "lcstories");
    const blogPostsContainer = document.getElementById('blog-posts');
    const blogSnapshot = await getDocs(blogRef);

    blogSnapshot.forEach(doc => {
        const postData = doc.data();
        const blogPost = document.createElement('div');
        blogPost.className = 'blog-post';

        const sliderContainerId = `slider-${doc.id}`;

        let sliderItemsHTML = `<div class="slider-item"><img src="${postData.header_image_stories}" alt="${postData.Name_story}"></div>`;
        if (postData.content_images) {
            postData.content_images.forEach(imageUrl => {
                sliderItemsHTML += `<div class="slider-item"><img src="${imageUrl}" alt="${postData.Name_story}"></div>`;
            });
        }

        // Format the created_on date
        const createdOnDate = new Date(postData.created_on.seconds * 1000).toLocaleDateString();

        blogPost.innerHTML = `
            <h2>${postData.Name_story}</h2>
            <div class="slider-container">
                <div id="${sliderContainerId}" class="slider">
                    ${sliderItemsHTML}
                </div>
                <div class="slider-arrow slider-arrow-left" onclick="moveLeft('${sliderContainerId}')">&#10094;</div>
                <div class="slider-arrow slider-arrow-right" onclick="moveRight('${sliderContainerId}')">&#10095;</div>
            </div>
            <div class="text-description">
                <p class="created-on">${createdOnDate}</p>
                ${postData.text_description} 
                <br> 
                <i class="fa-solid fa-share" onclick="copyToClipboard('${window.location.origin}?post=${doc.id}')"></i>
            </div>
           
        
        `;
        blogPostsContainer.appendChild(blogPost);
    });
}

// Function to handle slider movement
let currentIndex = {};

window.moveLeft = function(sliderId) {
    const slider = document.getElementById(sliderId);
    const items = slider.querySelectorAll('.slider-item');
    if (!currentIndex[sliderId]) currentIndex[sliderId] = 0;
    if (currentIndex[sliderId] > 0) {
        currentIndex[sliderId]--;
    } else {
        currentIndex[sliderId] = items.length - 1;
    }
    updateSlider(sliderId);
};

window.moveRight = function(sliderId) {
    const slider = document.getElementById(sliderId);
    const items = slider.querySelectorAll('.slider-item');
    if (!currentIndex[sliderId]) currentIndex[sliderId] = 0;
    if (currentIndex[sliderId] < items.length - 1) {
        currentIndex[sliderId]++;
    } else {
        currentIndex[sliderId] = 0;
    }
    updateSlider(sliderId);
};

function updateSlider(sliderId) {
    const slider = document.getElementById(sliderId);
    const items = slider.querySelectorAll('.slider-item');
    const totalWidth = items[0].clientWidth * currentIndex[sliderId];
    slider.style.transform = `translateX(-${totalWidth}px)`;
}

window.addEventListener('resize', () => {
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(slider => {
        const sliderId = slider.id;
        updateSlider(sliderId);
    });
});

// Fetch and display the blog posts on page load
displayBlogPosts();
