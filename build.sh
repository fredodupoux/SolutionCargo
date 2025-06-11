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

# Add an .htaccess file for Apache servers (common for PHP hosting)
echo "📄 Creating .htaccess file..."
cat > $BUILD_DIR/.htaccess << EOL
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
echo "  1. Make sure your server has PHP installed and configured"
echo "  2. Configure your email settings on the server"
echo "  3. Test the contact form after deployment"
echo "  4. Check that CSRF tokens and reCAPTCHA are working"
