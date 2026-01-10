@echo off
echo Starting ReachHub Development Environment...
echo.

echo Starting Django Backend Server with Daphne (ASGI)...
cd Gawulo
start "Django Backend" cmd /k "..\gven\Scripts\activate && daphne -b 0.0.0.0 -p 9033 Gawulo.asgi:application"

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
