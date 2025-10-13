document.addEventListener('DOMContentLoaded', () => {

    // --- Smooth Scrolling for Nav Links ---
    const navLinks = document.querySelectorAll('.nav a, .hero-buttons a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- Scroll Animations with Intersection Observer ---
    const animatedElements = document.querySelectorAll('.service-card, .gallery-item, .about-text, .about-image');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(element => {
        observer.observe(element);
    });

    /*
    // --- Simple & Elegant Gallery Carousel ---
    const gallery = document.querySelector('.gallery-grid');
    if (gallery) {
        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'gallery-carousel-container';

        const galleryWrapper = document.createElement('div');
        galleryWrapper.className = 'gallery-carousel-wrapper';

        // Move existing gallery items into the wrapper
        const galleryItems = Array.from(gallery.children);
        galleryItems.forEach(item => galleryWrapper.appendChild(item));
        
        galleryContainer.appendChild(galleryWrapper);
        gallery.innerHTML = ''; // Clear the original grid
        gallery.appendChild(galleryContainer);

        // Add controls
        const prevButton = document.createElement('button');
        prevButton.className = 'carousel-btn prev';
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        const nextButton = document.createElement('button');
        nextButton.className = 'carousel-btn next';
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';

        gallery.appendChild(prevButton);
        gallery.appendChild(nextButton);

        let currentIndex = 0;
        const totalItems = galleryItems.length;

        function updateGallery() {
            const itemWidth = galleryItems[0].clientWidth;
            galleryWrapper.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
        }

        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % totalItems;
            updateGallery();
        });

        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + totalItems) % totalItems;
            updateGallery();
        });

        // Adjust on window resize
        window.addEventListener('resize', updateGallery);
    }
    */
});