@echo off
title AI Chatbot Runner
echo ==================================================
echo         STARTING HORSE RACING AI CHATBOT
echo ==================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to PATH.
    echo Please install Python and try again.
    pause
    exit /b 1
)

:: Kill any process using port 5000 (standard Flask port)
echo [INFO] Checking for any running chatbot processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r :5000') do (
    echo [INFO] Found process with PID %%a using port 5000. Terminating it to apply new code...
    taskkill /f /pid %%a >nul 2>&1
)

echo [INFO] Checking Python dependencies...
python -c "import flask, flask_cors, pyodbc, pandas, sklearn" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing missing Python packages...
    pip install flask flask-cors pyodbc pandas scikit-learn
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo [INFO] All Python dependencies are met.
)

echo.
echo [INFO] Starting Flask Server on http://localhost:5000...
echo Close this window to stop the chatbot server.
echo.

python "%~dp0web\WEB-INF\python\app.py"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Chatbot server stopped unexpectedly.
    pause
)
