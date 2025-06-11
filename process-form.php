<?php
/**
 * Process Contact Form for Solution Cargo
 * 
 * This script processes the contact form submission, validates inputs,
 * verifies the Google reCAPTCHA response and sends email notifications.
 */

// Configuration
$config = [
    'admin_email' => 'info@solutioncargo.ht', // Change to your email
    'email_subject' => 'New Contact Form Submission - Solution Cargo',
    'recaptcha_secret_key' => '6LfI41srAAAAACcOqQqKoYAkVuXj4KWtylk1Tn6I', // Replace with your secret key
    'success_message' => 'Thank you! Your message has been sent successfully.',
    'error_message' => 'Sorry, there was a problem sending your message.',
    'recaptcha_error' => 'reCAPTCHA verification failed. Please try again.',
    'fields_error' => 'Please fill in all required fields.'
];

// Only process POST requests
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Function to sanitize form data
    function sanitizeInput($data) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data);
        return $data;
    }
    
    // Initialize response array
    $response = [
        'success' => false,
        'message' => ''
    ];
    
    // Validate required fields
    if (
        empty($_POST['name']) ||
        empty($_POST['email']) ||
        empty($_POST['message']) ||
        empty($_POST['g-recaptcha-response'])
    ) {
        $response['message'] = $config['fields_error'];
        echo json_encode($response);
        exit;
    }
    
    // Sanitize form data
    $name = sanitizeInput($_POST['name']);
    $email = sanitizeInput($_POST['email']);
    $message = sanitizeInput($_POST['message']);
    $recaptcha = $_POST['g-recaptcha-response'];
    
    // Verify email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Please enter a valid email address.';
        echo json_encode($response);
        exit;
    }
    
    // Verify reCAPTCHA
    $verify_response = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret='.$config['recaptcha_secret_key'].'&response='.$recaptcha);
    $response_data = json_decode($verify_response);
    
    if (!$response_data->success) {
        $response['message'] = $config['recaptcha_error'];
        echo json_encode($response);
        exit;
    }
    
    // Prepare email content
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";
    
    // Set email headers
    $headers = "From: $name <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Attempt to send email
    if (mail($config['admin_email'], $config['email_subject'], $email_content, $headers)) {
        $response['success'] = true;
        $response['message'] = $config['success_message'];
    } else {
        $response['message'] = $config['error_message'];
    }
    
    // Return JSON response for AJAX requests
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
        echo json_encode($response);
        exit;
    } else {
        // Redirect with query parameters for non-AJAX requests
        $redirect = 'index.html';
        $status = $response['success'] ? 'success' : 'error';
        $redirect .= "?status=$status&message=" . urlencode($response['message']);
        header("Location: $redirect");
        exit;
    }
} else {
    // Not a POST request, redirect to homepage
    header("Location: index.html");
    exit;
}
?>