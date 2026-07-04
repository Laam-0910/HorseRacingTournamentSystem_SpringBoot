@echo off
title Horse Racing System - Launcher
color 0A

echo.
echo  ================================================
echo   HORSE RACING TOURNAMENT SYSTEM
echo   Starting all services...
echo  ================================================
echo.

:: ── Cài Python dependencies nếu chưa có ──────────────────────────────────────
echo [1/2] Checking Python AI dependencies...
pip show fastapi >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo     Installing Python packages...
    pip install -r ai_service\requirements.txt -q
    echo     Done.
) ELSE (
    echo     Python packages already installed. OK
)

:: ── Start Backend (Spring Boot + Python AI) ──────────────────────────────────
echo.
echo [2/2] Starting Backend (Spring Boot)...
start "Backend - Spring Boot" cmd /k "cd backend && mvnw.cmd spring-boot:run"

:: ── Doi backend khoi dong mot chut roi moi start frontend ────────────────────
echo     Waiting 5s for services to initialize...
timeout /t 5 /nobreak >nul

:: ── Start Frontend ────────────────────────────────────────────────────────────
echo.
echo [3/2] Starting Frontend (Vite)...
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
