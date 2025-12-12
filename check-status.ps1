Write-Host "Checking ReachHub Development Environment Status..." -ForegroundColor Green
Write-Host ""

# Check Django Backend
Write-Host "Checking Django Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/" -TimeoutSec 5
    Write-Host "✓ Django Backend is running on http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "✗ Django Backend is not running" -ForegroundColor Red
    Write-Host "  To start: cd Gawulo && ..\gven\Scripts\activate && python manage.py runserver" -ForegroundColor Cyan
}

# Check React Frontend
Write-Host "Checking React Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5
    Write-Host "✓ React Frontend is running on http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "✗ React Frontend is not running" -ForegroundColor Red
    Write-Host "  To start: cd frontend && npm start" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Quick Start Commands:" -ForegroundColor Green
Write-Host "  Windows: .\start-dev.ps1" -ForegroundColor Cyan
Write-Host "  Unix: ./start-dev.sh" -ForegroundColor Cyan
Write-Host ""
