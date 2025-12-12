#!/bin/bash

echo "Starting ReachHub Development Environment..."
echo ""

# Start Django Backend Server
echo "Starting Django Backend Server..."
cd Gawulo
source gven/bin/activate
python manage.py runserver &
DJANGO_PID=$!

# Start React Frontend Server
echo "Starting React Frontend Server..."
cd ../frontend
npm start &
REACT_PID=$!

echo ""
echo "Development servers are starting..."
echo "Django Backend: http://localhost:8000"
echo "React Frontend: http://localhost:3001"
echo "Django Admin: http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for user to stop
trap "echo 'Stopping servers...'; kill $DJANGO_PID $REACT_PID; exit" INT
wait
