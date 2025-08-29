Write-Host "Starting Gawulo Development Environment..." -ForegroundColor Green
Write-Host ""

# Start Django Backend Server
Write-Host "Starting Django Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Gawulo; ..\gven\Scripts\activate; python manage.py runserver"

# Start React Frontend Server
Write-Host "Starting React Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host ""
Write-Host "Development servers are starting..." -ForegroundColor Green
Write-Host "Django Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "React Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Django Admin: http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
Read-Host
