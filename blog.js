
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
  const firestore = getFirestore(app);

  // Debounce function to prevent multiple triggers
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Function to fetch and display blog posts
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
        postElement.id = encodeURIComponent(postData.header_image);

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
          <div class="green-transparent-bg">${contentHtml}</div>
          <div class="separator"></div>
          <div class="dots">
            <span class="dot green"></span>
            <span class="dot blue"></span>
          </div>
        `;

        blogContainer.appendChild(postElement);
      });

      // Scroll to the specific post if header_image matches
      const urlParams = new URLSearchParams(window.location.search);
      const headerImage = urlParams.get('header_image');
      if (headerImage) {
        const targetPost = document.getElementById(encodeURIComponent(headerImage));
        if (targetPost) {
          debounce(() => {
            targetPost.scrollIntoView({ behavior: 'smooth' });
          }, 200)();
        }
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      blogContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
    }
  }

  // Function to sanitize HTML content
  function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  // Fetch and display the blog posts on page load
  displayBlogPosts();

