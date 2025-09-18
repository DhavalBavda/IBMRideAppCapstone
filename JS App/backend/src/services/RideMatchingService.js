import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import redisClient from '../config/redisClient.js';
import HelperFunction from '../utils/HelperFunction.js';
import UserRepository from '../repositories/UserRepository.js';
import RideRepository from '../repositories/RideRepository.js';
import { getIO } from '../sockets/index.js';

const RADIUS_STEP = 5000; // 5 km increment
const MAX_RADIUS = 15000; // Max 15 km radius
const ACCEPT_WAIT = 30000;    // 30s wait for drivers to accept
const PREFIX = "ride:ignored:";

class RideMatchingService {

    // stores the data of the igonred drivers with reference to thr rideid
    async addIgonredDriver(reqObj){
        const {rideId} = reqObj.body;
        const driverId = reqObj.user.id;
        const key = `${PREFIX}${rideId}`;
        await redisClient.redis.sadd(key, driverId);
        await redisClient.redis.expire(key, 1800); // 30 min TTL
    }

    async getIgnoredDrivers(rideId) {
        const key = `${PREFIX}${rideId}`;
        
        try {
            const drivers = await redisClient.redis.smembers(key);
            return drivers || [];  // always return an array
        } catch (err) {
            console.error(`Error fetching ignored drivers for ride ${rideId}:`, err);
            return [];  // fallback to empty array
        }
    }

    // search for the drivers in the area
    async searchForDrivers(lat, lon, rideId, rideData, radius = 3000, timeout = 5 * 60 * 1000) {

        const ignoredDriversSet = new Set(await this.getIgnoredDrivers(rideId)); // Initialize ignored drivers set

        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            // 1. Fetch drivers from C++ executable
            const drivers = await this.searchDriversInRadius(lat, lon, radius);

            let unAvailableDrivers = await UserRepository.findAllUsers();
            unAvailableDrivers = unAvailableDrivers?.rows?.filter(d => d.role == "driver" && d.isAvailable != true)?.map(d => d.user_id) || [];

            const unAvdriver = new Set(unAvailableDrivers);

            // refresh ignored list ---------------
            const newIgnored = await this.getIgnoredDrivers(rideId);
            newIgnored?.forEach(d => ignoredDriversSet?.add(d.toString()));

            // 2. Filter ignored
            const filteredDrivers = drivers?.filter(
                d => !ignoredDriversSet?.has(d.toString()) && !unAvdriver.has(d.toString())
            ) || [];

            if (filteredDrivers.length > 0) {
                console.log("Drivers found:", filteredDrivers);

                await HelperFunction.sendFirebasePushNotification('newRideRequestToDriver', rideData, filteredDrivers);

                // Wait for accept within 30s
                const accepted = await this.waitForAcceptance(rideId, ACCEPT_WAIT);
                if (accepted) {
                    console.log(`Ride ${rideId} accepted by driver ${accepted}`);
                    return;
                }

                console.log(`No acceptance for ride ${rideId} in ${radius / 1000} km.`);
            } else {
                console.log(`No drivers found in ${radius / 1000} km.`);
            }

            // Expand search radius if possible
            if (radius < MAX_RADIUS) {
                radius += RADIUS_STEP;
                console.log(`Expanding search radius to ${radius / 1000} km`);

                // Sleep here only after finishing one radius cycle (10 seconds sleep)
                await new Promise(res => setTimeout(res, 10000));
            } else {
                console.log(`Ride ${rideId}: No drivers accepted even after max radius`);
                await this.notifyRiderAboutTimeout(rideId);
                return;
            }
        }

        // Timeout exceeded
        await this.notifyRiderAboutTimeout(rideId);
    }


    // wait for acceptance within a given window
    async waitForAcceptance(rideId, waitMs) {
        return new Promise((resolve) => {
            let resolved = false;

            // Poll Redis for acceptance flag
            const interval = setInterval(async () => {
                const driverId = await redisClient.redis.get(`ride:accepted:${rideId}`);
                if (driverId) {
                    clearInterval(interval);
                    resolved = true;
                    resolve(driverId); // driver who accepted
                }
            }, 2000); // check every 2s

            // End after waitMs
            setTimeout(() => {
                if (!resolved) {
                    clearInterval(interval);
                    resolve(null); // no acceptance
                }
            }, waitMs);
        });
    }


    // Execute the C++ search for nearby drivers (--------- working fine ---------)
    async searchDriversInRadius(lat, lon, radius) {
        
        // Get the current file path
        const __filename = fileURLToPath(import.meta.url);

        // Get the directory name of the current file
        const __dirname = path.dirname(__filename);

        // Now you can use __dirname like in CommonJS
        const execPath = path.join(__dirname, "../../../../CPP App/ride_app.exe");  // Path to C++ executable
        
        const key = "users:location";  // example Redis key

        // Pass args in the exact order C++ expects: key, lon, lat, radius, unit
        const args = ['georadius', key, lon.toString(), lat.toString(), radius.toString(), 'km'];

        console.log(`Executing: ${execPath} ${args.join(' ')}`);

        return new Promise((resolve, reject) => {
            execFile(execPath, args, { env: process.env }, (error, stdout, stderr) => {
                console.log('STDOUT:', stdout);
                console.log('STDERR:', stderr);

                if (error) {
                    console.error(`Error executing C++ file: ${stderr || error.message}`);
                    return reject(error);
                }

                try {
                    // Parse lines and remove empty lines
                    // const drivers = stdout.split('\n')
                    //     .map(line => line.trim())
                    //     .filter(line => line.startsWith('- '))
                    //     .map(line => line.slice(2).trim());

                    // Split the output by new lines, then extract the driver ID from each line
                    const driverIds = stdout
                        .split('\n')                    // Split by lines
                        .map(line => line.trim())        // Trim each line
                        .filter(line => line.startsWith('{ "driver_id": ')) // Only keep lines with driver IDs
                        .map(line => {
                            // Extract the driver ID using a regular expression
                            const match = line.match(/"driver_id":\s?"([^"]+)"/);
                            return match ? match[1] : null;  // Return the driver ID if found
                        })
                        .filter(id => id !== null);  // Remove any null entries

                    console.log('Driver IDs:', driverIds);

                    resolve(driverIds);
                } catch (parseErr) {
                    reject(parseErr);
                }
            });
        });
    }

    // Notify rider if no drivers were found in time
    async notifyRiderAboutTimeout(rideId) {
        
        await RideRepository.updateRideStatus(rideId, 'timeout');

        // socket emit
        const io = getIO();
        io.to(`ride_${rideId}`).emit("noDriverAvailable", { rideId });
        
        console.log(`Rider ${rideId} notified: No drivers available in time.`);
    }


}
export default new RideMatchingService();