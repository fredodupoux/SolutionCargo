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
    
    // Contact Form Popup Functionality
    initContactForm();
    
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

// Contact Form Functionality
function initContactForm() {
    const openContactFormBtn = document.getElementById('openContactForm');
    const closeContactFormBtn = document.getElementById('closeContactForm');
    const contactFormPopup = document.getElementById('contactFormPopup');
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('form-status');
    const submitButton = document.getElementById('submitButton');
    const csrfTokenInput = document.getElementById('csrf_token');
    
    // Form validation variables
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const messageError = document.getElementById('message-error');
    const recaptchaError = document.getElementById('recaptcha-error');
    
    // Fetch CSRF token when the page loads
    fetchCsrfToken();
    
    // Open popup form
    if (openContactFormBtn && contactFormPopup) {
        openContactFormBtn.addEventListener('click', () => {
            openContactPopup();
        });
    }
    
    // Close popup form
    if (closeContactFormBtn && contactFormPopup) {
        closeContactFormBtn.addEventListener('click', () => {
            closeContactPopup();
        });
        
        // Close on click outside the form
        contactFormPopup.addEventListener('click', (event) => {
            if (event.target === contactFormPopup) {
                closeContactPopup();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && contactFormPopup.classList.contains('active')) {
                closeContactPopup();
            }
        });
    }
    
    // Form validation listeners
    if (nameInput) {
        nameInput.addEventListener('blur', () => validateField(nameInput, nameError, validateName));
        nameInput.addEventListener('input', () => validateField(nameInput, nameError, validateName));
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', () => validateField(emailInput, emailError, validateEmail));
        emailInput.addEventListener('input', () => validateField(emailInput, emailError, validateEmail));
    }
    
    if (messageInput) {
        messageInput.addEventListener('blur', () => validateField(messageInput, messageError, validateMessage));
        messageInput.addEventListener('input', () => validateField(messageInput, messageError, validateMessage));
    }
    
    // Form submission handler
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Open popup function
    function openContactPopup() {
        // Fetch new token when opening the form
        fetchCsrfToken();
        contactFormPopup.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    // Close popup function
    function closeContactPopup() {
        contactFormPopup.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Fetch CSRF token
    function fetchCsrfToken() {
        fetch('process-form.php?get_token=1')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text().then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error('Invalid JSON response:', text);
                        throw new Error('Server returned an invalid response');
                    }
                });
            })
            .then(data => {
                if (csrfTokenInput && data.csrf_token) {
                    csrfTokenInput.value = data.csrf_token;
                }
            })
            .catch(error => {
                console.error('Error fetching CSRF token:', error);
            });
    }
    
    // Field validation functions
    function validateName(value) {
        if (!value.trim()) {
            return 'Please enter your name';
        }
        if (value.length > 100) {
            return 'Name is too long (maximum 100 characters)';
        }
        return '';
    }
    
    function validateEmail(value) {
        if (!value.trim()) {
            return 'Please enter your email address';
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            return 'Please enter a valid email address';
        }
        
        if (value.length > 150) {
            return 'Email is too long (maximum 150 characters)';
        }
        
        return '';
    }
    
    function validateMessage(value) {
        if (!value.trim()) {
            return 'Please enter your message';
        }
        if (value.length > 3000) {
            return 'Message is too long (maximum 3000 characters)';
        }
        return '';
    }
    
    // Validate individual field
    function validateField(inputElement, errorElement, validationFunction) {
        const error = validationFunction(inputElement.value);
        if (error) {
            errorElement.textContent = error;
            errorElement.classList.add('visible');
            inputElement.parentElement.classList.add('has-error');
            return false;
        } else {
            errorElement.textContent = '';
            errorElement.classList.remove('visible');
            inputElement.parentElement.classList.remove('has-error');
            return true;
        }
    }
    
    // Validate all form fields
    function validateForm() {
        let isValid = true;
        
        isValid = validateField(nameInput, nameError, validateName) && isValid;
        isValid = validateField(emailInput, emailError, validateEmail) && isValid;
        isValid = validateField(messageInput, messageError, validateMessage) && isValid;
        
        // Validate reCAPTCHA
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            recaptchaError.textContent = 'Please complete the security verification';
            recaptchaError.classList.add('visible');
            isValid = false;
        } else {
            recaptchaError.textContent = '';
            recaptchaError.classList.remove('visible');
        }
        
        return isValid;
    }
    
    // Form submission handler
    function handleFormSubmit(event) {
        event.preventDefault();
        
        // Hide any previous status messages
        formStatus.style.display = 'none';
        formStatus.className = 'form-status';
        
        // Validate the form
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
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
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Invalid JSON response:', text);
                    throw new Error('Server returned an invalid response');
                }
            });
        })
        .then(data => {
            // Update CSRF token
            if (data.csrf_token && csrfTokenInput) {
                csrfTokenInput.value = data.csrf_token;
            }
            
            if (data.success) {
                // Reset form and recaptcha
                contactForm.reset();
                if (typeof grecaptcha !== 'undefined') {
                    grecaptcha.reset();
                }
                
                // Show success message
                formStatus.textContent = data.message;
                formStatus.className = 'form-status success';
                formStatus.style.display = 'block';
                
                // Close popup after delay
                setTimeout(() => {
                    closeContactPopup();
                }, 3000);
            } else {
                // Show validation errors if available
                if (data.errors) {
                    if (data.errors.name) {
                        nameError.textContent = data.errors.name;
                        nameError.classList.add('visible');
                        nameInput.parentElement.classList.add('has-error');
                    }
                    
                    if (data.errors.email) {
                        emailError.textContent = data.errors.email;
                        emailError.classList.add('visible');
                        emailInput.parentElement.classList.add('has-error');
                    }
                    
                    if (data.errors.message) {
                        messageError.textContent = data.errors.message;
                        messageError.classList.add('visible');
                        messageInput.parentElement.classList.add('has-error');
                    }
                    
                    if (data.errors.recaptcha) {
                        recaptchaError.textContent = 'Please complete the security verification';
                        recaptchaError.classList.add('visible');
                        if (typeof grecaptcha !== 'undefined') {
                            grecaptcha.reset();
                        }
                    }
                    
                    if (data.errors.csrf) {
                        // Fetch a new token
                        fetchCsrfToken();
                    }
                }
                
                // Show general error message
                formStatus.textContent = data.message || 'An error occurred. Please try again.';
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            formStatus.textContent = 'An error occurred while sending your message. Please try again.';
            formStatus.className = 'form-status error';
            formStatus.style.display = 'block';
            // Fetch a new token on error
            fetchCsrfToken();
        })
        .finally(() => {
            // Remove loading state
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        });
    }
    
    // Check for URL parameters (used in non-AJAX fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    
    if (status && message && formStatus) {
        if (status === 'success') {
            formStatus.textContent = decodeURIComponent(message);
            formStatus.className = 'form-status success';
            formStatus.style.display = 'block';
            // Open the popup to show success message
            openContactPopup();
        } else {
            formStatus.textContent = decodeURIComponent(message);
            formStatus.className = 'form-status error';
            formStatus.style.display = 'block';
            // Open the popup to show error message
            openContactPopup();
        }
        
        // Remove the parameters from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}