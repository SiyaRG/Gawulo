@echo off
echo Seeding ReachHub database with sample data...
echo.

cd Gawulo
..\gven\Scripts\activate
python seed_data.py

echo.
echo Database seeding completed!
echo.
echo You can now:
echo - Visit http://localhost:9033/api/ to see the API
echo - Visit http://localhost:9033/admin/ to access the admin interface
echo - Use the sample credentials to test the system
echo.
pause
