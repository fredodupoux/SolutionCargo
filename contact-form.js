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
        // Always fetch a fresh token when opening the form
        fetchCsrfToken();
        contactFormPopup.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Reset any previous error states
        formStatus.style.display = 'none';
        formStatus.className = 'form-status';
        
        // Clear any previous validation errors
        if (nameError) nameError.classList.remove('visible');
        if (emailError) emailError.classList.remove('visible');
        if (messageError) messageError.classList.remove('visible');
        if (recaptchaError) recaptchaError.classList.remove('visible');
    }
    
    // Close popup function
    function closeContactPopup() {
        contactFormPopup.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Fetch CSRF token
    function fetchCsrfToken() {
        console.log('Fetching new CSRF token...');
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
                    console.log('CSRF token updated:', data.csrf_token.substring(0, 8) + '...');
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
        
        // Check if CSRF token is available
        if (!csrfTokenInput || !csrfTokenInput.value) {
            console.error('CSRF token not available');
            formStatus.textContent = 'Security token not ready. Please wait a moment and try again.';
            formStatus.className = 'form-status error';
            formStatus.style.display = 'block';
            fetchCsrfToken(); // Try to fetch token
            return false;
        }
        
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
        
        // Prevent multiple submissions
        if (submitButton.disabled || submitButton.classList.contains('loading')) {
            return;
        }
        
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
        
        // Debug: Log the CSRF token being sent
        console.log('Submitting form with CSRF token:', csrfTokenInput.value.substring(0, 8) + '...');
        
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
                        // Fetch a new token and retry once
                        fetchCsrfToken();
                        formStatus.textContent = 'Security token refreshed. Please try again.';
                        formStatus.className = 'form-status warning';
                        formStatus.style.display = 'block';
                        return; // Don't show the general error message for CSRF errors
                    }
                }
                
                // Show general error message (only if not a CSRF error)
                if (!data.errors || !data.errors.csrf) {
                    formStatus.textContent = data.message || 'An error occurred. Please try again.';
                    formStatus.className = 'form-status error';
                    formStatus.style.display = 'block';
                }
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

// Make the contact form initialization function available globally
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the contact form
    initContactForm();
});
