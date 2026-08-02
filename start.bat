@echo off
title Horse Racing System - Launcher
color 0A

echo.
echo  ================================================
echo   HORSE RACING TOURNAMENT SYSTEM
echo   Starting all services...
echo  ================================================
echo.

:: ── Clean up old background processes on ports 8080 and 5000 ───
echo [0/3] Clearing processes occupying ports 8080 and 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a >nul 2>&1

:: ── Install Python dependencies if missing ───────────────────
echo [1/3] Checking Python AI dependencies...
pip show fastapi >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo     Installing Python packages...
    pip install -r ai_service\requirements.txt -q
    echo     Done.
) ELSE (
    echo     Python packages already installed. OK
)

:: ── Start Backend (Spring Boot + Python AI) ──────────────────
echo.
echo [2/3] Starting Backend (Spring Boot)...
start "Backend - Spring Boot" cmd /k "cd backend && mvnw.cmd spring-boot:run"

:: ── Wait 5s for backend initialization before starting frontend ──
echo     Waiting 5s for services to initialize...
timeout /t 5 /nobreak >nul

:: ── Start Frontend ────────────────────────────────────────────────────────────
echo.
echo [3/3] Starting Frontend (Vite)...
start "Frontend - Vite" cmd /k "cd frontend && npm run dev"

echo.
echo  ================================================
echo   All services started!
echo   Backend  : http://localhost:8080
echo   Frontend : http://localhost:5173
echo   AI Chat  : http://localhost:5000
echo  ================================================
echo.
echo  Close the terminal windows to stop the services.
pause
