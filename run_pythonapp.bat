REM Run Python App
echo Starting Python App Server...
cd "Python App"
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver