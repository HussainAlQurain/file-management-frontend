@echo off
echo ========================================
echo Document Management System - Frontend
echo ========================================

REM ===========================================
REM CONFIGURATION - EDIT THESE VALUES
REM ===========================================

REM Replace YOUR_COMPUTER_IP with your actual IP address (run: ipconfig)
set YOUR_COMPUTER_IP=192.168.1.100

REM Backend API URL (should match your backend configuration)
set API_URL=http://%YOUR_COMPUTER_IP%:8080/api

REM Application Name
set APP_NAME=Document Management System

REM Frontend Port
set FRONTEND_PORT=8081

REM ===========================================
REM DO NOT EDIT BELOW THIS LINE
REM ===========================================

echo Configuration:
echo - API URL: %API_URL%
echo - Frontend Port: %FRONTEND_PORT%
echo - Your IP: %YOUR_COMPUTER_IP%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm is not installed!
    echo Please install npm (usually comes with Node.js)
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Build the application if dist folder doesn't exist or is older
if not exist "dist\dms" (
    echo Building application...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo ❌ Build failed!
        pause
        exit /b 1
    )
) else (
    echo Using existing build...
)

REM Configure runtime environment
echo Configuring for network access...

REM Update the env.js file with the correct API URL
echo (function (window) { > dist\dms\assets\env.js
echo   window["env"] = window["env"] ^|^| {}; >> dist\dms\assets\env.js
echo   window["env"]["apiUrl"] = "%API_URL%"; >> dist\dms\assets\env.js
echo   window["env"]["appName"] = "%APP_NAME%"; >> dist\dms\assets\env.js
echo   window["env"]["version"] = "1.0.0"; >> dist\dms\assets\env.js
echo })(this); >> dist\dms\assets\env.js

echo ✅ Configuration updated!
echo.

REM Install http-server if not available globally
echo Checking for http-server...
where http-server >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing http-server...
    call npm install -g http-server
)

echo Starting frontend server...
echo ========================================
echo.
echo Frontend will be available at:
echo   Local: http://localhost:%FRONTEND_PORT%
echo   Network: http://%YOUR_COMPUTER_IP%:%FRONTEND_PORT%
echo.
echo Make sure your backend is running at: %API_URL%
echo.
echo Press Ctrl+C to stop the server
echo ========================================

REM Start the server with network access
call npx http-server dist\dms -p %FRONTEND_PORT% -a 0.0.0.0 --cors

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Failed to start the frontend server!
    echo.
    echo Alternative: Try running this manually:
    echo   npx http-server dist\dms -p %FRONTEND_PORT% -a 0.0.0.0 --cors
    pause
) 