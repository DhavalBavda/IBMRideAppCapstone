@echo off

REM Run JS App
echo Starting JS App Server...
cd "JS App\backend"
call npm install
cd ..
start "" cmd /k "npm run server"

REM Run Python App
echo Starting Python App Server...
cd "..\Python App"
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver