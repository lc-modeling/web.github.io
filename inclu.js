
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

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);

    // Function to fetch and display the diversity and inclusivity images
    async function displayDiversityImages() {
        try {
            const diversityRef = collection(firestore, "diversity_and_inclusivity");
            const diversityQuery = query(diversityRef, orderBy("time", "desc"));
            const diversitySnapshot = await getDocs(diversityQuery);
            const container = document.getElementById('blogPreviewContainer');

            // Clear the container to avoid duplication if running the function multiple times
            container.innerHTML = '';

            // Insert elements from Firestore
            diversitySnapshot.forEach(doc => {
                const postData = doc.data();
                const blogCard = document.createElement('div');
                blogCard.className = 'blog-preview-card';

                blogCard.innerHTML = `
                    <div class="image">
                        <img src="${postData.header_image}" alt="Modeling Image">
                    </div>
                `;
                container.appendChild(blogCard);
            });

            // After fetching, create pagination dots
            createPaginationDots();
        } catch (error) {
            console.error("Error fetching and displaying diversity images: ", error);
        }
    }

    // Function to create pagination dots
    function createPaginationDots() {
        const container = document.getElementById('blogPreviewContainer');
        const paginationDotsContainer = document.getElementById('paginationDots');
        const numberOfDots = Math.ceil(container.children.length / 3);

        // Clear existing dots before creating new ones
        paginationDotsContainer.innerHTML = '';

        for (let i = 0; i < numberOfDots; i++) {
            const dot = document.createElement('div');
            dot.classList.add('pagination-dot');
            dot.addEventListener('click', () => goToPage(i));
            paginationDotsContainer.appendChild(dot);
        }
        updatePaginationDots();
    }

    // Function to update pagination dots based on scroll position
    function updatePaginationDots() {
        const container = document.getElementById('blogPreviewContainer');
        const paginationDotsContainer = document.getElementById('paginationDots');
        const dots = paginationDotsContainer.children;
        const activeIndex = Math.round(scrollAmount / container.clientWidth);

        for (let i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('active', i === activeIndex);
        }
    }

    // Function to scroll to a specific page based on index
    function goToPage(pageIndex) {
        const container = document.getElementById('blogPreviewContainer');
        const width = container.clientWidth;
        scrollAmount = width * pageIndex;
        container.style.transform = `translateX(-${scrollAmount}px)`;
        updatePaginationDots();
    }

    // Function to scroll left
    function scrollLeft() {
        const container = document.getElementById('blogPreviewContainer');
        const width = container.clientWidth;
        scrollAmount = Math.max(scrollAmount - width, 0);
        container.style.transform = `translateX(-${scrollAmount}px)`;
        updatePaginationDots();
    }

    // Function to scroll right
    function scrollRight() {
        const container = document.getElementById('blogPreviewContainer');
        const width = container.clientWidth;
        const maxScroll = container.scrollWidth - width;
        scrollAmount = Math.min(scrollAmount + width, maxScroll);
        container.style.transform = `translateX(-${scrollAmount}px)`;
        updatePaginationDots();
    }

    // Add touch event listeners for mobile support
    let startX = 0;
    let scrollLeftPos = 0;
    const container = document.getElementById('blogPreviewContainer');

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

    // Fetch and display images on page load
    displayDiversityImages();

