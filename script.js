// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Function to fetch and display all blog posts
async function displayBlogPosts() {
  const blogRef = collection(firestore, "lcschoolblog");
  const blogContainer = document.getElementById('blog-container');
  const loadingIndicator = document.createElement('p');
  loadingIndicator.textContent = "Loading posts...";
  blogContainer.appendChild(loadingIndicator);

  try {
    const blogSnapshot = await getDocs(blogRef);
    blogContainer.innerHTML = '';

    blogSnapshot.forEach(doc => {
      const postData = doc.data();
      const postElement = document.createElement('div');
      postElement.className = 'post';

      let formattedDate = '';
      if (postData.published_on && postData.published_on.toDate) {
        const publishedDate = postData.published_on.toDate();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        formattedDate = publishedDate.toLocaleDateString(undefined, options);
      }

      let contentHtml = '';
      postData.content.forEach(contentItem => {
        if (contentItem.value) {
          contentHtml += `<p>${sanitizeHTML(contentItem.value)}</p>`;
        }
      });

      postElement.innerHTML = `
        <h2><a href="?post=${doc.id}" class="post-link">${sanitizeHTML(postData.name)}</a></h2>
        <img src="${sanitizeHTML(postData.header_image)}" alt="${sanitizeHTML(postData.name)}">
        <p style="color: green; font-size: inherit;">${formattedDate}</p>
        ${contentHtml}
        <span class="share-btn" data-url="${window.location.origin}?post=${doc.id}">
          <i class="fas fa-share"></i>
        </span>
        <div class="separator"></div>
        <div class="dots">
          <span class="dot green"></span>
          <span class="dot blue"></span>
        </div>
      `;

      blogContainer.appendChild(postElement);
    });

    // Add event listeners to the share buttons
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
      button.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        copyToClipboard(url);
      });
    });

  } catch (error) {
    console.error("Error fetching blog posts:", error);
    blogContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
  }
}

// Function to fetch and display a single blog post
async function displaySingleBlogPost(docId) {
  const blogRef = collection(firestore, "lcschoolblog");
  const singlePostContainer = document.getElementById('single-post-container');
  const blogContainer = document.getElementById('blog-container');
  const loadingIndicator = document.createElement('p');
  loadingIndicator.textContent = "Loading post...";
  singlePostContainer.appendChild(loadingIndicator);

  try {
    const docRef = doc(blogRef, docId);
    const docSnap = await getDoc(docRef);
    singlePostContainer.innerHTML = '';

    if (docSnap.exists()) {
      const postData = docSnap.data();
      const postElement = document.createElement('div');
      postElement.className = 'post';

      let formattedDate = '';
      if (postData.published_on && postData.published_on.toDate) {
        const publishedDate = postData.published_on.toDate();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        formattedDate = publishedDate.toLocaleDateString(undefined, options);
      }

      let contentHtml = '';
      postData.content.forEach(contentItem => {
        if (contentItem.value) {
          contentHtml += `<p>${sanitizeHTML(contentItem.value)}</p>`;
        }
      });

      postElement.innerHTML = `
        <h2>${sanitizeHTML(postData.name)}</h2>
        <img src="${sanitizeHTML(postData.header_image)}" alt="${sanitizeHTML(postData.name)}">
        <p style="color: green; font-size: inherit;">${formattedDate}</p>
        ${contentHtml}
        <span class="share-btn" data-url="${window.location.origin}?post=${docId}">
          <i class="fas fa-share"></i>
        </span>
        <div class="separator"></div>
        <div class="dots">
          <span class="dot green"></span>
          <span class="dot blue"></span>
        </div>
      `;

      singlePostContainer.appendChild(postElement);
      singlePostContainer.style.display = 'block';
      blogContainer.style.display = 'none';

      // Add event listener to the share button
      const shareButton = document.querySelector('.share-btn');
      shareButton.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        copyToClipboard(url);
      });

    } else {
      console.log("No such document!");
      singlePostContainer.innerHTML = '<p>Post not found.</p>';
    }

  } catch (error) {
    console.error("Error fetching single post:", error);
    singlePostContainer.innerHTML = '<p>Error loading post. Please try again later.</p>';
  }
}

// Function to copy the post link to the clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Function to sanitize HTML content
function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Fetch and display the blog posts or a single post based on URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('post');

if (postId) {
  displaySingleBlogPost(postId);
} else {
  displayBlogPosts();
}