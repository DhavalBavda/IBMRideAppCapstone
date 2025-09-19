# Ride-Hailing-App

## Third-Party Libraries

This project includes code from the [hiredis](https://github.com/redis/hiredis) library, 
licensed under the BSD 3-Clause License. See `CPP App/hiredis/LICENSE` for details.

This project uses the hiredis C client library.

## CPP App 
commands to compile cpp app--
1. cd CPP App
2. g++ src/main.cpp src/redis_client.cpp src/RideMatchService.cpp -Iinclude -Ihiredis -Lhiredis/build -lhiredis -o ride_app.exe
