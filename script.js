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
                <ul class="mobile-nav-links">
                    <li><a href="#about">About Us</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#contact">Contact Us</a></li>
                </ul>
            `;
            document.body.appendChild(mobileNav);

            // Handle mobile nav links
            const mobileNavLinks = mobileNav.querySelectorAll('.mobile-nav-links a');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.remove('active');
                    mobileMenuBtn.innerHTML = '<i data-feather="menu" style="color: var(--gray);"></i>'; // Reset to hamburger icon
                    feather.replace();
                });
            });
        }

        // Toggle mobile nav
        if (mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i data-feather="menu" style="color: var(--gray);"></i>'; // Reset to hamburger icon
        } else {
            mobileNav.classList.add('active');
            mobileMenuBtn.innerHTML = '<i data-feather="x" style="color: var(--gray);"></i>'; // Change to X icon
        }
        feather.replace();
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
});