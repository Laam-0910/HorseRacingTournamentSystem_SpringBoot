@echo off
title Automatic API Flow Test

echo.
echo =======================================================
echo   CHECK LUONG API TU DONG (CMD TEST)
echo =======================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0test_flow.ps1"

echo.
pause
