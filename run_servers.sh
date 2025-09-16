#!/bin/bash

# Run JS server
echo "Starting JS App Server..."
cd "JS App/backend" || exit
npm install
cd ..
npm run server &  # Run in background

# Run Python server
echo "Starting Python App Server..."
cd ../../Python\ App || exit
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver