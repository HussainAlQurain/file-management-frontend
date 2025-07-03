#!/bin/bash

# Frontend Build Script for Document Management System
# This script builds the Angular application

echo "Building Document Management System Frontend..."

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies!"
    exit 1
fi

# Build for production
echo "Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "Generated files in: dist/dms"
    echo ""
    echo "To configure for different environments, edit:"
    echo "  dist/dms/assets/env.js"
    echo ""
    echo "Example configuration:"
    echo "  window['env']['apiUrl'] = 'https://api.yourdomain.com/api';"
    echo "  window['env']['appName'] = 'Your Company DMS';"
    echo ""
    echo "To serve the built files:"
    echo "  Using Node.js: npx http-server dist/dms -p 4200"
    echo "  Using Python: python -m http.server 4200 --directory dist/dms"
    echo "  Using Nginx: Copy dist/dms/* to your web server directory"
else
    echo "❌ Build failed!"
    exit 1
fi 