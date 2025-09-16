#!/bin/bash

# Run Python server
echo "Starting Python App Server..."
cd /Python\ App || exit
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver