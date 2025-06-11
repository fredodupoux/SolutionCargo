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
    
    // Contact Form Popup Functionality
    const openContactFormBtn = document.getElementById('openContactForm');
    const closeContactFormBtn = document.getElementById('closeContactForm');
    const contactFormPopup = document.getElementById('contactFormPopup');
    
    if (openContactFormBtn && contactFormPopup) {
        openContactFormBtn.addEventListener('click', () => {
            contactFormPopup.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
        });
    }
    
    if (closeContactFormBtn && contactFormPopup) {
        closeContactFormBtn.addEventListener('click', () => {
            contactFormPopup.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        });
        
        // Close on click outside the form
        contactFormPopup.addEventListener('click', (event) => {
            if (event.target === contactFormPopup) {
                contactFormPopup.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && contactFormPopup.classList.contains('active')) {
                contactFormPopup.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('form-status');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    function handleFormSubmit(event) {
        event.preventDefault();
        
        // Check if all fields are filled out
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        
        if (!name || !email || !message) {
            showFormMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        // Verify reCAPTCHA
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            showFormMessage('Please complete the reCAPTCHA verification.', 'error');
            return;
        }
        
        // Prepare form data
        const formData = new FormData(contactForm);
        
        // Send form using fetch API
        fetch('process-form.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                contactForm.reset();
                grecaptcha.reset();
                showFormMessage(data.message, 'success');
                
                // Close popup after successful submission (3 seconds delay)
                setTimeout(() => {
                    if (contactFormPopup.classList.contains('active')) {
                        contactFormPopup.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }, 3000);
            } else {
                showFormMessage(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showFormMessage('An error occurred. Please try again later.', 'error');
        });
    }
    
    function showFormMessage(message, type) {
        formStatus.textContent = message;
        formStatus.className = 'form-status ' + type;
        formStatus.style.display = 'block';
        
        // Auto-hide successful message after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                formStatus.style.display = 'none';
            }, 5000);
        }
    }
    
    // Check for URL parameters (used in non-AJAX fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    
    if (status && message && formStatus) {
        showFormMessage(message, status);
        
        // If there's a success status in the URL, open the popup to show the message
        if (status === 'success' && contactFormPopup) {
            contactFormPopup.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Remove the parameters from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});