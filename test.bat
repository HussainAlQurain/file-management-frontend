@echo off

REM Frontend Test Script for Document Management System
REM Run this when you want to specifically test the frontend

echo ========================================
echo Running Frontend Tests
echo ========================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
)

echo Running Angular tests...
call npm test

if %ERRORLEVEL% == 0 (
    echo ✅ All tests passed!
    echo.
    echo Test results:
    echo   - Coverage reports: coverage\
    echo   - Test results displayed in browser
) else (
    echo ❌ Some tests failed!
    echo.
    echo Check the output above for details.
    echo.
    echo Common issues and solutions:
    echo   - Dependency issues: Try running 'npm install --legacy-peer-deps'
    echo   - Angular version conflicts: Check package.json dependencies
    echo   - Test environment issues: Check karma configuration
)

pause 