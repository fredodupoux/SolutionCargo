#!/bin/bash

# Build Script for Solution Cargo Website
# This script prepares the project for production deployment

echo "📦 Building Solution Cargo website for production..."

# Create build directory
BUILD_DIR="./build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
mkdir -p $BUILD_DIR/images

# Copy necessary files
echo "📂 Copying website files..."
cp index.html $BUILD_DIR/
cp process-form.php $BUILD_DIR/
cp script.js $BUILD_DIR/
cp contact-form.js $BUILD_DIR/
cp styles.css $BUILD_DIR/
cp favicon.ico $BUILD_DIR/ 2>/dev/null || echo "No favicon found, skipping..."
cp images/*.{png,jpg,jpeg,svg,gif} $BUILD_DIR/images/ 2>/dev/null || echo "Warning: Could not copy one or more image files"

# IMPORTANT: Environment file should be placed OUTSIDE the web root directory
# Create a config directory outside web root for environment files
mkdir -p $BUILD_DIR/../config
cp .solutionCargo.env $BUILD_DIR/../config/ 2>/dev/null || echo "Environment file not found - you'll need to create it on the server"

echo "🔒 Security Notice: Place .solutionCargo.env OUTSIDE your web root directory!"
echo "   Recommended path: /home/[username]/config/.solutionCargo.env"

# Add an .htaccess file for Apache servers (common for PHP hosting)
echo "📄 Creating .htaccess file..."
cat > $BUILD_DIR/.htaccess << EOL
# Security: Deny access to sensitive files
<FilesMatch "\.(env|ini|config|log|bak|backup|txt)$">
    Require all denied
</FilesMatch>

# Specifically deny access to environment files
<Files ".solutionCargo.env">
    Require all denied
</Files>

<Files ".env">
    Require all denied
</Files>

# Deny access to log files
<Files "email_log.txt">
    Require all denied
</Files>

# Enable PHP processing
<IfModule mod_php.c>
    php_flag display_errors off
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
    php_value max_execution_time 300
    php_flag zlib.output_compression on
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# Caching for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Custom 404 error page (if you create one)
# ErrorDocument 404 /404.html
EOL

# Build complete
echo "✅ Build complete! Your website is ready in the '$BUILD_DIR' folder."
echo "🚀 You can now upload the contents of this folder to your web server."
echo ""
echo "📋 Deployment checklist:"
echo "  1. Upload the contents of the 'build' folder to your web root (public_html)"
echo "  2. 🔒 CRITICAL: Place .solutionCargo.env OUTSIDE your web root directory"
echo "     - Recommended: /home/[username]/config/.solutionCargo.env"
echo "     - NEVER place it in public_html or any web-accessible directory"
echo "  3. Make sure your server has PHP installed and configured"
echo "  4. Test the contact form after deployment"
echo "  5. Check that CSRF tokens and reCAPTCHA are working"
echo "  6. Verify that .solutionCargo.env is NOT accessible via web browser"
echo "     - Try accessing: https://yourdomain.com/.solutionCargo.env"
echo "     - Should return 403 Forbidden or 404 Not Found"
