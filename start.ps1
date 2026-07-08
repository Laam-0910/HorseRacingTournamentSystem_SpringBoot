# Horse Racing System - Start All Services
# Cach dung: .\start.ps1

if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "D:\AndroidStudio\jbr"
}
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  HORSE RACING TOURNAMENT SYSTEM" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Backend (Spring Boot tu start Python AI)
Write-Host "[1/2] Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "if (-not `$env:JAVA_HOME) { `$env:JAVA_HOME = 'D:\AndroidStudio\jbr' }; `$env:PATH=`"`$env:JAVA_HOME\bin;`$env:PATH`"; cd '$PSScriptRoot\backend'; .\mvnw.cmd spring-boot:run"

Start-Sleep -Seconds 3

# Frontend
Write-Host "[2/2] Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "  Backend  : http://localhost:8080" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "  AI Chat  : http://localhost:5000" -ForegroundColor Green
Write-Host ""
