#include "redis_client.h"
#include "RideMatchService.h"
#include <iostream>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: ride_app.exe <command> [args...]\n";
        return 1;
    }

    RedisClient client("127.0.0.1", 6379);
    if (!client.connect()) {
        std::cerr << "Failed to connect to Redis\n";
        return 1;
    }

    RideMatchService service(client);

    std::string command = argv[1];

    if (command == "georadius") {
        if (argc != 7) {
            std::cerr << "Usage: ride_app.exe georadius <key> <lon> <lat> <radius> <unit>\n";
            return 1;
        }
        auto results = service.findNearbyDrivers(argv[2], std::stod(argv[3]),
                                                 std::stod(argv[4]), std::stod(argv[5]), argv[6]);
        // for (auto& driver : results) {
            // std::cout << " - " << driver << "\n";
            std::cout << "[\n";  // Start JSON array

            bool first = true;
            for (auto& driver : results) {
                if (!first) {
                    std::cout << ",\n";  // Separate drivers with a comma, but don't add a comma before the first driver
                }
                first = false;
                std::cout << "  { \"driver_id\": \"" << driver << "\" }";  // Print each driver in JSON format
            }

            std::cout << "\n]";  // Close JSON array
        // }
    }

    // Future: add "match" command for more advanced filtering
    else if (command == "match") {
        if (argc != 9) {
            std::cerr << "Usage: ride_app.exe match <key> <lon> <lat> <radius> <unit> <minRating> <carType>\n";
            return 1;
        }
        auto results = service.matchDrivers(argv[2], std::stod(argv[3]), std::stod(argv[4]),
                                            std::stod(argv[5]), argv[6],
                                            std::stoi(argv[7]), argv[8]);
        for (auto& driver : results) {
            std::cout << " - " << driver << "\n";
        }
    }

    else if (command == "geoadd") {
        if (argc != 6) {
            std::cerr << "Usage: ride_app.exe geoadd <key> <lon> <lat> <member>\n";
            return 1;
        }
        std::string key = argv[2];
        double lon = std::stod(argv[3]);
        double lat = std::stod(argv[4]);
        std::string member = argv[5];

        if (client.geoAdd(key, lon, lat, member)) {
            std::cout << "Added " << member << " to " << key 
                    << " (" << lon << "," << lat << ")\n";
        } else {
            std::cerr << "Failed to add " << member << " to " << key << "\n";
        }
    }

    else {
        std::cerr << "Unknown command: " << command << "\n";
    }

    return 0;
}