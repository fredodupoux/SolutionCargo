document.addEventListener('DOMContentLoaded', () => {
    // Initialize feather icons
    feather.replace();
    
    // Initialize AOS (Animate on Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease',
        once: true
    });
    
    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    let mobileNav = null;
    
    mobileMenuBtn.addEventListener('click', () => {
        if (!mobileNav) {
            // Create mobile nav if it doesn't exist
            mobileNav = document.createElement('div');
            mobileNav.classList.add('mobile-nav');
            mobileNav.innerHTML = `
                <div class="close-menu">
                    <i data-feather="x"></i>
                </div>
                <ul class="mobile-nav-links">
                    <li><a href="#about">About</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            `;
            document.body.appendChild(mobileNav);
            
            // Initialize feather icon for the close button
            feather.replace();
            
            // Handle close menu event
            const closeMenu = mobileNav.querySelector('.close-menu');
            closeMenu.addEventListener('click', () => {
                mobileNav.classList.remove('active');
            });
            
            // Handle mobile nav links
            const mobileNavLinks = mobileNav.querySelectorAll('.mobile-nav-links a');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.remove('active');
                });
            });
        }
        
        // Toggle mobile nav
            if (mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
        } else {
            mobileNav.classList.add('active');
        }
    });
    
    // Handle smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') !== '#') {
                e.preventDefault();
                
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Create folder for images if it doesn't exist
    // Note: This cannot be done in browser environment, but would be part of setup
    // For this example we're including it in the JavaScript for completeness
    
    // Logo processing would happen on the server
    // We're assuming we've extracted and saved logo.png and logo-white.png from the PDF
});