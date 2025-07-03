@echo off

REM Frontend Build Script for Document Management System
REM This script builds the Angular application on Windows

echo Building Document Management System Frontend...

REM Check if Node.js and npm are installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps

if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install dependencies!
    exit /b 1
)

REM Build for production
echo Building for production...
call npm run build

if %ERRORLEVEL% == 0 (
    echo ✅ Build successful!
    echo Generated files in: dist\dms
    echo.
    echo To configure for different environments, edit:
    echo   dist\dms\assets\env.js
    echo.
    echo Example configuration:
    echo   window['env']['apiUrl'] = 'https://api.yourdomain.com/api';
    echo   window['env']['appName'] = 'Your Company DMS';
    echo.
    echo To serve the built files:
    echo   Using Node.js: npx http-server dist\dms -p 4200
    echo   Using Python: python -m http.server 4200 --directory dist\dms
    echo   Using IIS: Copy dist\dms\* to your web server directory
) else (
    echo ❌ Build failed!
    exit /b 1
) 