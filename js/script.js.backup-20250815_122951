// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on nav links
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.08)';
    }
});


// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            
            
            // Add fade-in animation class
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Gallery Slider
class GallerySlider {
    constructor(selector) {
        this.slider = document.querySelector(selector);
        this.wrapper = this.slider?.querySelector('.gallery-wrapper');
        this.slides = this.slider?.querySelectorAll('.gallery-slide');
        this.prevBtn = this.slider?.querySelector('.prev-btn');
        this.nextBtn = this.slider?.querySelector('.next-btn');
        this.currentSlide = 0;
        this.isTransitioning = false;
        
        this.init();
    }
    
    init() {
        if (!this.slider || !this.wrapper) return;
        
        // Event listeners
        this.prevBtn?.addEventListener('click', () => this.prevSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());
        
        // Auto play
        this.startAutoPlay();
        
        // Pause on hover
        this.slider.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.slider.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Touch support
        this.addTouchSupport();
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.updateSlider();
        });
    }
    
    updateSlider() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // Check if mobile
        const isMobile = window.innerWidth <= 768;
        
        // Update slider position
        let translateX;
        if (isMobile) {
            translateX = -this.currentSlide * 100; // 모바일: 1개씩 보이므로 100%
        } else {
            translateX = -this.currentSlide * 100; // 데스크톱: 1개씩 보이므로 100%
        }
        
        this.wrapper.style.transform = `translateX(${translateX}%)`;
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlider();
    }
    
    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateSlider();
    }
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 2000);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
    }
    
    addTouchSupport() {
        let startX = 0;
        let endX = 0;
        
        this.wrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        this.wrapper.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        });
    }
}

// Services Slider
class ServicesSlider {
    constructor() {
        this.slider = document.querySelector('.slider-wrapper');
        this.slides = document.querySelectorAll('.service-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevBtn = document.querySelector('.prev-btn');
        this.nextBtn = document.querySelector('.next-btn');
        this.currentSlide = 0;
        this.isTransitioning = false;
        
        this.init();
    }
    
    init() {
        if (!this.slider) return;
        
        // Event listeners
        this.prevBtn?.addEventListener('click', () => this.prevSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());
        
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Auto play
        this.startAutoPlay();
        
        // Pause on hover
        const sliderContainer = document.querySelector('.services-slider');
        sliderContainer?.addEventListener('mouseenter', () => this.stopAutoPlay());
        sliderContainer?.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Touch support
        this.addTouchSupport();
    }
    
    updateSlider() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // Update slider position
        const translateX = -this.currentSlide * 100;
        this.slider.style.transform = `translateX(${translateX}%)`;
        
        // Update indicators
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
        
        // Update active slide
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 600);
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlider();
    }
    
    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateSlider();
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlider();
    }
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 4000);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
    }
    
    addTouchSupport() {
        let startX = 0;
        let endX = 0;
        
        this.slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        this.slider.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        });
    }
}

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.service-slide, .program-card, .contact-item, .gallery-slide');
    animateElements.forEach(el => {
        observer.observe(el);
    });
    
    // Initialize services slider
    new ServicesSlider();
    
    // Initialize gallery sliders
    new GallerySlider('.gallery-slider-1');
    new GallerySlider('.gallery-slider-2');

    // 인지치료 이미지 자동 전환
    const cognitiveImg = document.getElementById('cognitive-img');
    if (cognitiveImg) {
        const imgList = [
            'images/20_mosaic.jpg',
            'images/21_mosaic.jpg',
            'images/22_mosaic.jpg',
            'images/23_mosaic.jpg'
        ];
        let idx = 0;
        setInterval(() => {
            idx = (idx + 1) % imgList.length;
            cognitiveImg.src = imgList[idx];
        }, 2000);
    }
});

// Hero Section Slide Image (투명 이미지 슬라이드)
document.addEventListener('DOMContentLoaded', function() {
    const slideImages = [
        'images/50.jpg'
        // 추후 'images/51.jpg', 'images/52.jpg' 등 추가 가능
    ];
    let current = 0;
    const slideDiv = document.querySelector('.hero-slide-image');
    const slideImg = slideDiv?.querySelector('img');

    function showSlide(idx) {
        if (!slideImg) return;
        slideImg.style.opacity = 0;
        setTimeout(() => {
            slideImg.src = slideImages[idx];
            slideImg.style.opacity = 0.5;
        }, 400);
    }

    if (slideImages.length > 1) {
        setInterval(() => {
            current = (current + 1) % slideImages.length;
            showSlide(current);
        }, 2000);
    }
});

// Form submission handling
const contactForm = document.querySelector('.form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const name = formData.get('name');
        const phone = formData.get('phone');
        const message = formData.get('message');
        
        // Validate form
        if (!name || !phone || !message) {
            showNotification('모든 필드를 입력해 주세요.', 'error');
            return;
        }
        
        // Phone number validation
        const phoneRegex = /^[0-9-+\s]+$/;
        if (!phoneRegex.test(phone)) {
            showNotification('올바른 전화번호를 입력해 주세요.', 'error');
            return;
        }
        
        // Simulate form submission
        const submitBtn = this.querySelector('.btn-primary');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '전송 중...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            this.reset();
            showNotification('상담 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.', 'success');
        }, 2000);
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#2c5aa0'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        z-index: 10000;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.75rem;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    const autoRemove = setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        removeNotification(notification);
    });
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Hero scroll animation
const heroScroll = document.querySelector('.hero-scroll');
if (heroScroll) {
    heroScroll.addEventListener('click', () => {
        document.querySelector('#services').scrollIntoView({
            behavior: 'smooth'
        });
    });
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    const hero = document.querySelector('.hero');
    
    if (hero && scrolled < hero.offsetHeight) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add CSS for fade-in animation
const fadeInStyles = `
    .fade-in {
        animation: fadeInUp 0.8s ease forwards;
    }
    
    .service-slide, .program-card, .contact-item {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease, transform 0.8s ease;
    }
    
    .fade-in.service-slide, .fade-in.program-card, .fade-in.contact-item {
        opacity: 1;
        transform: translateY(0);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = fadeInStyles;
document.head.appendChild(styleSheet);

// Loading animation for page
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Trigger initial animations
    const heroElements = document.querySelectorAll('.hero-title, .hero-description, .hero-buttons');
    heroElements.forEach((el, index) => {
        setTimeout(() => {
            el.style.animationPlayState = 'running';
        }, index * 200);
    });
});

// Add loading styles
const loadingStyles = `
    body:not(.loaded) {
        overflow: hidden;
    }
    
    body:not(.loaded)::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #2c5aa0 0%, #4a7bc8 100%);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeOut 0.5s ease 1s forwards;
    }
    
    @keyframes fadeOut {
        to {
            opacity: 0;
            visibility: hidden;
        }
    }
`;

const loadingStyleSheet = document.createElement('style');
loadingStyleSheet.textContent = loadingStyles;
document.head.appendChild(loadingStyleSheet);

// Enhanced mobile experience
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', e => {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', e => {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe up - scroll to next section
            scrollToNextSection();
        }
    }
}

function scrollToNextSection() {
    const sections = document.querySelectorAll('section');
    const currentScroll = window.pageYOffset;
    
    for (let i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop > currentScroll + 100) {
            sections[i].scrollIntoView({ behavior: 'smooth' });
            break;
        }
    }
}

// Performance optimization
// Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll handlers
const debouncedScrollHandler = debounce(() => {
    // Your scroll handling code here
}, 16); // ~60fps

window.addEventListener('scroll', debouncedScrollHandler);

console.log('청담재활주간보호센터 웹사이트가 성공적으로 로드되었습니다.');

// 제거됨 - 중복 함수

// 여가활동 서비스 이미지 슬라이드쇼
function startLeisureSlideshow() {
    const slides = document.querySelectorAll('.service-slide');
    if (!slides.length) return;
    // 네 번째(여가활동) 슬라이드만 적용
    const leisureSlide = slides[3];
    if (!leisureSlide) return;
    const imgs = leisureSlide.querySelectorAll('.leisure-img');
    if (!imgs.length) return;
    let idx = 0;
    setInterval(() => {
        imgs.forEach((img, i) => {
            img.style.display = (i === idx) ? 'block' : 'none';
        });
        idx = (idx + 1) % imgs.length;
    }, 2000);
}

// 물리치료 서비스 이미지 슬라이드쇼
function startPTSlideshow() {
    const slides = document.querySelectorAll('.service-slide');
    if (!slides.length) return;
    // 첫 번째(물리치료) 슬라이드만 적용
    const ptSlide = slides[0];
    if (!ptSlide) return;
    const imgs = ptSlide.querySelectorAll('.pt-img');
    if (!imgs.length) return;
    let idx = 0;
    setInterval(() => {
        imgs.forEach((img, i) => {
            img.style.display = (i === idx) ? 'block' : 'none';
        });
        idx = (idx + 1) % imgs.length;
    }, 2000);
}

// 블로그 데이터 로드 함수
async function loadBlogPosts() {
    const blogLoading = document.getElementById('blog-loading');
    const blogPosts = document.getElementById('blog-posts');
    const blogError = document.getElementById('blog-error');
    
    console.log('블로그 데이터 로드 시작...');
    console.log('컨테이너 요소들:', { blogLoading, blogPosts, blogError });
    
    // 로딩 상태로 변경
    if (blogLoading) blogLoading.style.display = 'block';
    if (blogError) blogError.style.display = 'none';
    
    // 정적 블로그 카드 숨기기 (복사본에서 가져온 정적 카드들)
    const staticCards = blogPosts?.querySelectorAll('.program-card.blog-post');
    if (staticCards) {
        staticCards.forEach(card => card.style.display = 'none');
    }
    
    try {
        // API 호출 시뮬레이션 (서버가 없으므로)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 테스트 데이터로 동적 카드 생성
        const testPosts = [
            {
                title: "청담재활 삼겹살 파티~~~",
                pubDate: "2025.06.14",
                link: "https://blog.naver.com/chungdam311/223898944941",
                imageUrl: "./images/blog-post-1-proper.png"
            },
            {
                title: "청담재활주간보호센터 어버이날 행사~~~!!",
                pubDate: "2025.05.14", 
                link: "https://blog.naver.com/chungdam311/223865345360",
                imageUrl: "./images/blog-post-2-improved.png"
            },
            {
                title: "청담재활주간보호센터! 벚꽃 나들이~~~",
                pubDate: "2025.04.14",
                link: "https://blog.naver.com/chungdam311/223832675195", 
                imageUrl: "./images/blog-post-3-proper.png"
            }
        ];
        
        displayBlogPosts(testPosts);
        console.log('블로그 데이터 로드 성공: 3개 (테스트 데이터)');
        
    } catch (error) {
        console.error('블로그 데이터 로드 실패:', error);
        if (blogLoading) blogLoading.style.display = 'none';
        if (blogError) blogError.style.display = 'block';
        
        // 에러 시 정적 카드 다시 보이기
        if (staticCards) {
            staticCards.forEach(card => card.style.display = 'block');
        }
    }
}

// 블로그 포스트 표시 함수
function displayBlogPosts(posts) {
    const blogLoading = document.getElementById('blog-loading');
    const blogPosts = document.getElementById('blog-posts');
    
    console.log('블로그 포스트 표시 시작...');
    
    if (blogLoading) blogLoading.style.display = 'none';
    
    if (!blogPosts) {
        console.error('blog-posts 컨테이너를 찾을 수 없습니다');
        return;
    }
    
    // 정적 카드들 완전 제거
    const existingCards = blogPosts.querySelectorAll('.program-card.blog-post');
    existingCards.forEach(card => card.remove());
    
    // 새로운 동적 카드들 생성
    posts.forEach((post, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'program-card blog-post';
        cardElement.innerHTML = `
            <div class="blog-image">
                <img src="${post.imageUrl}" alt="${post.title}" loading="lazy">
            </div>
            <div class="blog-content">
                <h3>${post.title}</h3>
                <p class="blog-date">${post.pubDate}</p>
                <a href="${post.link}" target="_blank" class="blog-link">
                    자세히 보기 <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `;
        
        // 애니메이션을 위한 초기 스타일
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'translateY(30px)';
        cardElement.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        blogPosts.appendChild(cardElement);
        
        // 애니메이션 시작
        setTimeout(() => {
            cardElement.style.opacity = '1';
            cardElement.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    console.log(`동적 블로그 카드 ${posts.length}개 생성 완료`);
    console.log('현재 컨테이너 자식 수:', blogPosts.children.length);
}

document.addEventListener('DOMContentLoaded', () => {
    startPTSlideshow();
    startLeisureSlideshow();
    
    // 블로그 데이터 로드 (1초 후 자동 전환) - 비활성화됨
    // setTimeout(() => {
    //     loadBlogPosts();
    // }, 1000);
});