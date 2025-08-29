@echo off
echo Starting Gawulo Development Environment...
echo.

echo Starting Django Backend Server...
cd Gawulo
start "Django Backend" cmd /k "..\gven\Scripts\activate && python manage.py runserver 9033"

echo Starting React Frontend Server...
cd ..\frontend
start "React Frontend" cmd /k "npm start"

echo.
echo Development servers are starting...
echo Django Backend: http://localhost:9033
echo React Frontend: http://localhost:3001
echo Django Admin: http://localhost:9033/admin
echo.
echo Press any key to exit...
pause > nul
