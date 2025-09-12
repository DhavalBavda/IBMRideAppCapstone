import { Op } from "sequelize";
import Ride from "../models/Ride.js";

class RideRepository {
    // Rider: request a new ride
    async createRide(data) {
        return await Ride.create(data);
    }

    // Rider/Driver/Admin: get ride details by ID
    async getRideById(rideId) {
        return await Ride.findByPk(rideId);
    }

    // Rider: get all rides for a rider
    async getRidesByRider(riderId) {
        return await Ride.findAll({ where: { rider_id: riderId } });
    }

    // Driver: get all rides for a driver
    async getRidesByDriver(driverId) {
        return await Ride.findAll({ where: { driver_id: driverId } });
    }

    // Rider: cancel a ride (only if not completed)
    async cancelRide(rideId, reason) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        if (["completed", "cancelled"].includes(ride.status)) {
            throw new Error("Ride cannot be cancelled");
        }

        ride.status = "cancelled";
        ride.cancellation_reason = reason;
        await ride.save();

        return ride;
    }

    // Driver: mark ride as completed
    async completeRide(rideId, fare, distance, duration) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        ride.status = "completed";
        ride.fare = fare;
        ride.distance = distance;
        ride.duration = duration;
        ride.completed_at = new Date();
        await ride.save();

        return ride;
    }

    // Driver: accept a ride request (assign driver + vehicle)
    async assignDriver(rideId, driverId, vehicleId) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        if (ride.status !== "requested") {
            throw new Error("Ride is not available for assignment");
        }

        ride.driver_id = driverId;
        ride.vehicle_id = vehicleId;
        ride.status = "accepted";
        await ride.save();

        return ride;
    }

    // Driver: update ride status (e.g., in_progress, completed)
    async updateRideStatus(rideId, status) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        ride.status = status;
        await ride.save();

        return ride;
    }

    // Admin: delete a ride (hard delete, e.g., fraud/test data)
    async deleteRide(rideId) {
        return await Ride.destroy({ where: { id: rideId } });
    }

    // Driver: get rides with status = "requested" (available rides)
    async getAvailableRides() {
        return await Ride.findAll({ where: { status: "requested" } });
    }

    // Driver: check if driver has an active ride
    async getActiveRideByDriver(driverId) {
        return await Ride.findOne({
            where: {
                driver_id: driverId,
                status: { [Op.in]: ["accepted", "in_progress"] },
            },
        });
    }

    // Rider: check if rider has an active ride
    async getActiveRideByRider(riderId) {
        return await Ride.findOne({
            where: {
                rider_id: riderId,
                status: { [Op.in]: ["requested", "accepted", "in_progress"] },
            },
        });
    }

    // Admin: fetch all rides (with optional filters like status, date range, driver, rider)
    async getAllRides(filter = {}) {
        const where = {};

        if (filter.status) where.status = filter.status;
        if (filter.riderId) where.rider_id = filter.riderId;
        if (filter.driverId) where.driver_id = filter.driverId;
        if (filter.startDate && filter.endDate) {
            where.created_at = {
                [Op.between]: [filter.startDate, filter.endDate],
            };
        }

        return await Ride.findAll({ where });
    }

    // Admin: cancel ride on behalf of system/admin
    async forceCancelRide(rideId, reason) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        ride.status = "cancelled";
        ride.cancellation_reason = reason || "Cancelled by admin";
        await ride.save();

        return ride;
    }

    // Admin: aggregated stats (total rides, completed, cancelled, avg fare, etc.)
    async getRideStats() {
        const total = await Ride.count();
        const completed = await Ride.count({ where: { status: "completed" } });
        const cancelled = await Ride.count({ where: { status: "cancelled" } });
        const avgFare = await Ride.aggregate("fare", "avg", { plain: true });

        return {
            total,
            completed,
            cancelled,
            avgFare: avgFare || 0,
        };
    }
}

export default new RideRepository();