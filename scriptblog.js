import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const firestore = getFirestore(app);

// Function to copy the shareable URL to the clipboard
function copyToClipboard(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('Link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Expose the copyToClipboard function to the global scope
window.copyToClipboard = copyToClipboard;

async function displayBlogPosts() {
  const blogRef = collection(firestore, "lcstories");
  const blogPostsContainer = document.getElementById('blog-posts');
  const blogSnapshot = await getDocs(blogRef);

  blogSnapshot.forEach(doc => {
    const postData = doc.data();
    const postElement = document.createElement('div');
    postElement.className = 'blog-post';
    postElement.id = encodeURIComponent(postData.header_image_stories);

    const sliderContainerId = `slider-${doc.id}`;
    let sliderItemsHTML = "";

    if (postData.header_image_stories) {
      sliderItemsHTML += createMediaElement(postData.header_image_stories, postData.Name_story);
    }

    if (postData.content_images) {
      postData.content_images.forEach(fileUrl => {
        sliderItemsHTML += createMediaElement(fileUrl, postData.Name_story);
      });
    }

    const createdOnDate = new Date(postData.created_on.seconds * 1000).toLocaleDateString();

    // Create the unique shareable URL
    const shareUrl = `${window.location.origin}/blog.html?header_image=${encodeURIComponent(postData.header_image_stories)}`;

    postElement.innerHTML = `
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
         <div class="blue-transparent-bg">${postData.text_description}</div>
        <br>
        <a href="#" class="share-icon" onclick="copyToClipboard('${shareUrl}')">
          <i class="fa-solid fa-share"></i>
        </a>
      </div>
    `;
    blogPostsContainer.appendChild(postElement);
  });

  // Scroll to the specific post if header_image matches
  const urlParams = new URLSearchParams(window.location.search);
  const headerImage = urlParams.get('header_image');
  if (headerImage) {
    const targetPost = document.getElementById(encodeURIComponent(headerImage));
    if (targetPost) {
      targetPost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function createMediaElement(url, altText) {
  const videoExtensions = ['.mp4', '.webm'];
  const imageExtensions = ['.jpg', '.jpeg', '.png'];
  const isVideo = videoExtensions.some(ext => url.includes(ext));
  const isImage = imageExtensions.some(ext => url.includes(ext));

  if (isVideo) {
    return `<div class="slider-item"><video src="${url}" controls>Your browser does not support the video tag.</video></div>`;
  } else if (isImage) {
    return `<div class="slider-item"><img src="${url}" alt="${altText}"></div>`;
  } else {
    console.log("Unsupported media format");
    return '';
  }
}

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

// Handle resizing to adjust the slider
window.addEventListener('resize', () => {
  const sliders = document.querySelectorAll('.slider');
  sliders.forEach(slider => {
    const sliderId = slider.id;
    updateSlider(sliderId);
  });
});

// Fetch and display the blog posts on page load
displayBlogPosts();
