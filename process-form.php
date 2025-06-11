<?php
/**
 * Process Contact Form for Solution Cargo
 * 
 * This script processes the contact form submission, validates inputs,
 * verifies the Google reCAPTCHA response and sends email notifications.
 * Enhanced with additional security features and validation.
 */

// Prevent PHP errors from breaking JSON output
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Register custom error handler to convert errors to JSON responses
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred.',
        'errors' => ['server' => $errstr]
    ]);
    exit;
});

// Start a session for CSRF protection if not already started
if (session_status() === PHP_SESSION_NONE) {
    // Configure session settings for security
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
    ini_set('session.cookie_samesite', 'Lax');
    
    // Set session name to avoid conflicts
    session_name('solutioncargo_session');
    
    session_start();
}

// Generate CSRF token if not already set
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Also store the token creation time to help with debugging
if (empty($_SESSION['csrf_token_time'])) {
    $_SESSION['csrf_token_time'] = time();
}

// Load environment variables from .env file
$dotenv = [];

// Try multiple secure locations for the environment file
$env_paths = [
    // Production: Outside web root (most secure)
    dirname($_SERVER['DOCUMENT_ROOT']) . '/config/.solutionCargo.env',
    // Alternative: Parent directory of web root
    dirname(__DIR__) . '/.solutionCargo.env',
    // Fallback: Same directory (development only - less secure)
    __DIR__ . '/.solutionCargo.env'
];

foreach ($env_paths as $env_path) {
    if (file_exists($env_path)) {
        $dotenv = parse_ini_file($env_path);
        break;
    }
}

// Configuration
$config = [
    'admin_email' => isset($dotenv['ADMIN_EMAIL']) ? $dotenv['ADMIN_EMAIL'] : 'info@solutioncargo.ht',
    'cc_email' => isset($dotenv['CC_EMAIL']) ? $dotenv['CC_EMAIL'] : '',
    'email_subject' => isset($dotenv['EMAIL_SUBJECT']) ? $dotenv['EMAIL_SUBJECT'] : 'New Form Submission - Solution Cargo',
    'recaptcha_secret_key' => isset($dotenv['RECAPTCHA_SECRET_KEY']) ? $dotenv['RECAPTCHA_SECRET_KEY'] : '',
    'success_message' => 'Thank you! Your message has been sent successfully.',
    'error_message' => 'Sorry, there was a problem sending your message.',
    'recaptcha_error' => 'Security verification failed. Please try again.',
    'fields_error' => 'Please fill in all required fields.',
    'csrf_error' => 'Security validation failed. Please refresh and try again.',
    'honeypot_error' => 'Form validation failed.',
    'max_length' => [
        'name' => 100,
        'email' => 150,
        'message' => 3000
    ],
    'rate_limit' => [
        'enabled' => true,
        'timeframe' => 300, // 5 minutes in seconds
        'max_submissions' => 3 // maximum submissions within timeframe
    ]
];

// Only process POST requests or token requests
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['get_token'])) {
    // Handle CSRF token request via GET
    header('Content-Type: application/json');
    
    // Log token request for debugging
    error_log("CSRF Token Requested - Session ID: " . session_id() . " | Token: " . substr($_SESSION['csrf_token'], 0, 8) . '...');
    
    echo json_encode([
        'csrf_token' => $_SESSION['csrf_token'],
        'session_id' => session_id() // For debugging
    ]);
    exit;
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Function to sanitize form data
    function sanitizeInput($data) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        return $data;
    }
    
    // Initialize response array
    $response = [
        'success' => false,
        'message' => '',
        'errors' => []
    ];
    
    // Check for rate limiting if enabled
    if ($config['rate_limit']['enabled']) {
        if (!isset($_SESSION['form_submissions'])) {
            $_SESSION['form_submissions'] = [];
        }
        
        // Remove entries older than the timeframe
        $now = time();
        $_SESSION['form_submissions'] = array_filter($_SESSION['form_submissions'], function($time) use ($now, $config) {
            return ($now - $time) < $config['rate_limit']['timeframe'];
        });
        
        // Check if max submissions reached
        if (count($_SESSION['form_submissions']) >= $config['rate_limit']['max_submissions']) {
            $response['message'] = 'Too many submissions. Please try again later.';
            $response['errors']['rate_limit'] = true;
            echo json_encode($response);
            exit;
        }
    }
    
    // Check honeypot field (should be empty)
    if (!empty($_POST['website'])) {
        $response['message'] = $config['honeypot_error'];
        echo json_encode($response);
        exit;
    }
    
    // Verify CSRF token
    $csrf_posted = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : null;
    $csrf_session = isset($_SESSION['csrf_token']) ? $_SESSION['csrf_token'] : null;
    $token_age = isset($_SESSION['csrf_token_time']) ? (time() - $_SESSION['csrf_token_time']) : 'unknown';
    
    if (!$csrf_posted || !$csrf_session || $csrf_posted !== $csrf_session) {
        // Log CSRF failure for debugging
        error_log("CSRF Token Mismatch - Session: " . ($csrf_session ? substr($csrf_session, 0, 8) . '...' : 'NONE') . 
                  " | Posted: " . ($csrf_posted ? substr($csrf_posted, 0, 8) . '...' : 'NONE') . 
                  " | Session ID: " . session_id() . 
                  " | Token Age: " . $token_age . "s" .
                  " | User Agent: " . $_SERVER['HTTP_USER_AGENT']);
        
        // Generate new token for the response
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
        
        $response['message'] = $config['csrf_error'];
        $response['errors']['csrf'] = true;
        $response['csrf_token'] = $_SESSION['csrf_token']; // Send new token
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }
    
    // Log successful CSRF validation for debugging
    error_log("CSRF Token Valid - Session: " . substr($csrf_session, 0, 8) . '...' . " | Session ID: " . session_id() . " | Token Age: " . $token_age . "s");
    
    // Validate required fields
    $errors = [];
    
    if (empty($_POST['name'])) {
        $errors['name'] = 'Please enter your name';
    } elseif (strlen($_POST['name']) > $config['max_length']['name']) {
        $errors['name'] = 'Name is too long (maximum ' . $config['max_length']['name'] . ' characters)';
    }
    
    if (empty($_POST['email'])) {
        $errors['email'] = 'Please enter your email address';
    } elseif (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Please enter a valid email address';
    } elseif (strlen($_POST['email']) > $config['max_length']['email']) {
        $errors['email'] = 'Email is too long (maximum ' . $config['max_length']['email'] . ' characters)';
    }
    
    if (empty($_POST['message'])) {
        $errors['message'] = 'Please enter your message';
    } elseif (strlen($_POST['message']) > $config['max_length']['message']) {
        $errors['message'] = 'Message is too long (maximum ' . $config['max_length']['message'] . ' characters)';
    }
    
    if (empty($_POST['g-recaptcha-response'])) {
        $errors['recaptcha'] = 'Please complete the security verification';
    }
    
    if (!empty($errors)) {
        $response['message'] = $config['fields_error'];
        $response['errors'] = $errors;
        echo json_encode($response);
        exit;
    }
    
    // Sanitize form data
    $name = sanitizeInput($_POST['name']);
    $email = sanitizeInput($_POST['email']);
    $message = sanitizeInput($_POST['message']);
    $recaptcha = $_POST['g-recaptcha-response'];
    
    // Verify reCAPTCHA
    $verify_url = 'https://www.google.com/recaptcha/api/siteverify';
    $recaptcha_data = [
        'secret' => $config['recaptcha_secret_key'],
        'response' => $recaptcha,
        'remoteip' => $_SERVER['REMOTE_ADDR']
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($recaptcha_data)
        ]
    ];
    
    try {
        $context = stream_context_create($options);
        $verify_response = file_get_contents($verify_url, false, $context);
        
        if ($verify_response === false) {
            throw new Exception('Failed to contact reCAPTCHA verification service');
        }
        
        $response_data = json_decode($verify_response);
        
        if (!$response_data) {
            throw new Exception('Invalid response from reCAPTCHA verification service');
        }
        
        if (!$response_data->success) {
            $response['message'] = $config['recaptcha_error'];
            $response['errors']['recaptcha'] = true;
            echo json_encode($response);
            exit;
        }
        
        // Check score for v3 reCAPTCHA if applicable
        if (property_exists($response_data, 'score') && $response_data->score < 0.5) {
            $response['message'] = $config['recaptcha_error'];
            $response['errors']['recaptcha'] = true;
            echo json_encode($response);
            exit;
        }
    } catch (Exception $e) {
        $response['message'] = 'Error verifying security token: ' . $e->getMessage();
        $response['errors']['recaptcha'] = true;
        echo json_encode($response);
        exit;
    }
    
    // Prepare email content
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";
    
    // Additional information for security
    $email_content .= "\n\n---\n";
    $email_content .= "Submitted from: " . $_SERVER['HTTP_REFERER'] . "\n";
    $email_content .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
    $email_content .= "Date: " . date('Y-m-d H:i:s') . "\n";
    $email_content .= "Browser: " . $_SERVER['HTTP_USER_AGENT'] . "\n";
    
    // Set email headers
    $domain = (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false) 
              ? $_SERVER['HTTP_HOST'] 
              : 'solutioncargo.ht';
              
    $headers = "From: Solution Cargo Website <no-reply@{$domain}>\r\n";
    $headers .= "Reply-To: $name <$email>\r\n";
    if (!empty($config['cc_email'])) {
        $headers .= "Cc: " . $config['cc_email'] . "\r\n";
    }
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // Attempt to send email
    try {
        // Check if we're in development mode
        $is_dev_mode = ($_SERVER['HTTP_HOST'] === 'localhost:8000' || strpos($_SERVER['HTTP_HOST'], 'localhost') !== false);
        
        if ($is_dev_mode) {
            // In development mode: Log email instead of sending it
            $log_file = __DIR__ . '/email_log.txt';
            $log_content = "--- New Email " . date('Y-m-d H:i:s') . " ---\n";
            $log_content .= "To: " . $config['admin_email'] . "\n";
            $log_content .= "Subject: " . $config['email_subject'] . "\n";
            $log_content .= "Headers: " . print_r($headers, true) . "\n";
            $log_content .= "Content: \n" . $email_content . "\n\n";
            
            // Save to log file
            file_put_contents($log_file, $log_content, FILE_APPEND);
            $mail_success = true; // Assume success in dev mode
            
            // Also save the debug info to the response
            $response['debug'] = [
                'mode' => 'development',
                'email_saved_to' => 'email_log.txt',
                'to' => $config['admin_email'],
                'subject' => $config['email_subject']
            ];
        } else {
            // In production mode: Actually send the email
            $mail_success = mail($config['admin_email'], $config['email_subject'], $email_content, $headers);
        }
        
        if ($mail_success) {
            // Record this submission for rate limiting
            if ($config['rate_limit']['enabled']) {
                $_SESSION['form_submissions'][] = time();
            }
            
            // Generate new CSRF token for next submission
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            $_SESSION['csrf_token_time'] = time();
            
            $response['success'] = true;
            $response['message'] = $config['success_message'];
            $response['csrf_token'] = $_SESSION['csrf_token'];
        } else {
            $response['message'] = $config['error_message'];
            $response['errors']['mail'] = true;
        }
    } catch (Exception $e) {
        $response['message'] = $config['error_message'];
        $response['errors']['mail'] = true;
        $response['errors']['details'] = $e->getMessage();
    }
    
    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['get_recaptcha_site_key'])) {
    // Serve the reCAPTCHA site key dynamically
    header('Content-Type: application/json');
    echo json_encode(['siteKey' => isset($dotenv['RECAPTCHA_SITE_KEY']) ? $dotenv['RECAPTCHA_SITE_KEY'] : '']);
    exit;
    
} else {
    // Not a POST or GET?token request, redirect to homepage
    header("Location: index.html");
    exit;
}
?>