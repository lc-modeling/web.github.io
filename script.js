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

// Function to fetch and display blog posts
async function displayBlogPosts() {
  const blogRef = collection(firestore, "lcschoolblog");
  const blogContainer = document.getElementById('blog-container');
  const blogSnapshot = await getDocs(blogRef);

  blogSnapshot.forEach(doc => {
    const postData = doc.data();
    const postElement = document.createElement('div');
    postElement.className = 'post';

    let contentHtml = '';
    postData.content.forEach(contentItem => {
      if (contentItem.value) {
        contentHtml += `<p>${contentItem.value}</p>`;
      }
    });

    postElement.innerHTML = `
      <h2>${postData.name}</h2>
      <img src="${postData.header_image}" alt="${postData.name}">
      ${contentHtml}
      <div class="separator"></div>
      <div class="dots">
        <span class="dot green"></span>
        <span class="dot blue"></span>
      </div>
    `;

    blogContainer.appendChild(postElement);
  });
}

// Fetch and display the blog posts on page load
displayBlogPosts();
