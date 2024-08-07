import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

async function fetchBackground() {
    try {
        const querySnapshot = await getDocs(collection(db, "main_header_banner"));

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log("Document data:", data);

                const backgroundContainer = document.getElementById('background-container');
                const mediaUrl = data.image1_vedio;

                if (mediaUrl) {
                    console.log('Media URL:', mediaUrl);

                    const videoExtensions = ['.mp4', '.webm'];
                    const imageExtensions = ['.jpg', '.jpeg', '.png'];
                    const isVideo = videoExtensions.some(ext => mediaUrl.includes(ext));
                    const isImage = imageExtensions.some(ext => mediaUrl.includes(ext));

                    if (isVideo) {
                        console.log('Attempting to load video...');
                        const videoElement = document.createElement('video');
                        videoElement.className = 'background-video';
                        videoElement.autoplay = true;
                        videoElement.loop = true;
                        videoElement.muted = true;
                        videoElement.playsInline = true;

                        const sourceElement = document.createElement('source');
                        sourceElement.src = mediaUrl;
                        sourceElement.type = 'video/mp4'; // assuming mp4 format

                        videoElement.appendChild(sourceElement);
                        backgroundContainer.appendChild(videoElement);

                        videoElement.addEventListener('loadeddata', () => {
                            console.log('Video loaded successfully');
                        });

                        videoElement.addEventListener('error', (e) => {
                            console.error('Error loading video:', e);
                            console.log('Attempting to fallback to image...');
                            // Optionally load a fallback image if video fails
                        });
                    } else if (isImage) {
                        console.log('Attempting to load image...');
                        const imageElement = document.createElement('img');
                        imageElement.className = 'background-image';
                        imageElement.src = mediaUrl;
                        imageElement.alt = 'Background Image';

                        backgroundContainer.appendChild(imageElement);
                    } else {
                        console.log("Unsupported media format");
                    }
                } else {
                    console.log("No media found in the database");
                }
            });
        } else {
            console.log("No documents found in the collection!");
        }
    } catch (error) {
        console.error("Error fetching document:", error);
    }
}

fetchBackground();