import RideRepository from "../repositories/RideRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import VehicleRepository from "../repositories/VehicleRepository.js";
import ApiError from "../utils/ApiError.js";

class RideService {

    // Rider Methods
    async createRide(data, rider_id) {
        const {
            pickup_address,
            pickup_latitude,
            pickup_longitude,
            dropoff_address,
            dropoff_latitude,
            dropoff_longitude,
        } = data;

        if (
            !pickup_address ||
            pickup_latitude == null ||
            pickup_longitude == null ||
            !dropoff_address ||
            dropoff_latitude == null ||
            dropoff_longitude == null
        ) {
            throw new ApiError(400, "Pickup and dropoff details are required");
        }

        // Edit - done
        const rider = await UserRepository.findById(rider_id);
        if (!rider || rider.role !== "rider") {
            throw new ApiError(403, "Only riders can request rides");
        }

        const existingRide = await RideRepository.getActiveRideByRider(rider_id);
        if (existingRide) {
            throw new ApiError(409, "You already have an ongoing ride");
        }

        return await RideRepository.createRide({
            rider_id,
            driver_id: null,
            vehicle_id: null,
            pickup_address,
            pickup_latitude,
            pickup_longitude,
            dropoff_address,
            dropoff_latitude,
            dropoff_longitude,
            ride_status: "requested",
        });
    }

    async getActiveRide(rider_id) {
        return await RideRepository.getActiveRideByRider(rider_id);
    }

    async getRideHistory(rider_id) {
        const rides = await RideRepository.getRidesByRider(rider_id);
        return rides.filter(r => ["completed", "cancelled"].includes(r.ride_status));
    }

    async cancelRide(user_id, ride_id, reason, role) {
        const ride = await RideRepository.getRideById(ride_id);
        if (!ride) throw new ApiError(404, "Ride not found");

        // Rider rules
        if (role === "rider") {
            if (ride.rider_id !== user_id) throw new ApiError(403, "Not your ride");
            if (!["requested", "accepted"].includes(ride.ride_status)) {
                throw new ApiError(409, "Cannot cancel ride after it has started or completed");
            }
        }

        // Driver rules
        if (role === "driver") {
            if (ride.driver_id !== user_id) throw new ApiError(403, "Not your ride");
            if (ride.ride_status !== "requested") {
                throw new ApiError(409, "Driver can only cancel ride before it is accepted");
            }
        }

        return await RideRepository.cancelRide(ride_id, reason);
    }


    async getOngoingRidesByRider(rider_id) {
        return await RideRepository.getRidesByRider(rider_id)
            .then(rides => rides.filter(r =>
                ["requested", "accepted", "driver_arrived", "in_progress"].includes(r.ride_status)
            ));
    }

    // Driver Methods

    async getAvailableRides() {
        return await RideRepository.getAvailableRides();
    }

    async acceptRide(driver_id, ride_id, vehicle_id) {
        const ride = await RideRepository.getRideById(ride_id);
        if (!ride) throw new ApiError(404, "Ride not found");
        if (ride.ride_status !== "requested") throw new ApiError(409, "Ride already accepted");

        const driverBusy = await RideRepository.getActiveRideByDriver(driver_id);
        if (driverBusy) throw new ApiError(409, "Driver already has an ongoing ride");

        // Edit - done
        const vehicle = await VehicleRepository.findById(vehicle_id);
        if (!vehicle || vehicle.owner_id !== driver_id) {
            throw new ApiError(400, "Invalid vehicle for this driver");
        }

        return await RideRepository.assignDriver(ride_id, driver_id, vehicle_id);
    }

    async startRide(driver_id, ride_id) {
        const ride = await RideRepository.getRideById(ride_id);
        if (!ride) throw new ApiError(404, "Ride not found");
        if (ride.driver_id !== driver_id) throw new ApiError(403, "Not your ride");
        if (ride.ride_status !== "accepted") throw new ApiError(409, "Ride not accepted yet");

        return await RideRepository.updateRideStatus(ride_id, "driver_arrived");
    }

    async completeRide(driver_id, ride_id, fare, distance, duration) {
        const ride = await RideRepository.getRideById(ride_id);
        if (!ride) throw new ApiError(404, "Ride not found");
        if (ride.driver_id !== driver_id) throw new ApiError(403, "Not your ride");

        return await RideRepository.completeRide(ride_id, fare, distance, duration);
    }

    async getOngoingRides(driver_id) {
        return await RideRepository.getOngoingRidesByDriver(driver_id);
    }

    async getRideHistoryByDriver(driver_id) {
        return await RideRepository.getRideHistoryByDriver(driver_id);
    }

    // Admin Methods

    async getAllRides(filter = {}) {
        return await RideRepository.getAllRides(filter);
    }

    async forceCancelRide(ride_id, reason) {
        return await RideRepository.forceCancelRide(ride_id, reason);
    }

    async deleteRide(ride_id) {
        return await RideRepository.deleteRide(ride_id);
    }

    async getRideStats() {
        return await RideRepository.getRideStats();
    }

    // General method for any user

    async getRide(ride_id) {
        const ride = await RideRepository.getRideById(ride_id);
        if (!ride) throw new ApiError(404, "Ride not found");
        return ride;
    }

    async listRides(user_id, role) {
        if (role === "rider") return await RideRepository.getRidesByRider(user_id);
        if (role === "driver") return await RideRepository.getRidesByDriver(user_id);
        throw new ApiError(403, "Invalid role for listing rides");
    }
}

export default new RideService();


