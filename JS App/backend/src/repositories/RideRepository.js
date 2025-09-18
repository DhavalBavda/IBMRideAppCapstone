import { Op } from "sequelize";
import Ride from "../models/Ride.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";

class RideRepository {
    // Rider: request a new ride
    async createRide(data) {
        return await Ride.create(data);
    }

    async getCompletedRideWithPendingPayment(rider_id) {
        return await Ride.findOne({
            where: {
                rider_id: rider_id,
                ride_status: "completed",
                payment_status: "pending"
            }
        });
    }

    // Rider/Driver/Admin: get ride details by ID
    async getRideById(rideId) {
        return await Ride.findByPk(rideId);
    }

    // Rider: get all rides for a rider
    async getRidesByRider(riderId) {
        return await Ride.findAll({
            where: { rider_id: riderId }, order: [['requested_at', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'Driver',
                    attributes: ['user_id', 'firstname', 'lastname', 'phone', 'email']
                },
                {
                    model: Vehicle,
                    attributes: ['vehicle_id', 'make', 'model', 'color', 'registration_number']
                }
            ]
        });
    }

    // Driver: get all rides for a driver
    async getRidesByDriver(
        driverId,
        { page = 1, limit = 10, status, startDate, endDate } = {}) {
        const where = { driver_id: driverId };

        // filter by ride status
        if (status) {
            where.ride_status = status;
        }

        // filter by date range (created_at)
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.created_at = { [Op.gte]: startDate }; // greater than or equal
        } else if (endDate) {
            where.created_at = { [Op.lte]: endDate }; // less than or equal
        }

        const offset = (page - 1) * limit;

        const { rows, count } = await Ride.findAndCountAll({
            where,
            limit,
            offset,
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: User,
                    as: 'Rider',
                    attributes: ['user_id', 'firstname', 'lastname', 'phone', 'email']
                },
                {
                    model: Vehicle,
                    attributes: ['vehicle_id', 'make', 'model', 'color', 'registration_number']
                }
            ]
        });

        return {
            rides: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
        };
    }

    // Rider: cancel a ride (only if not completed)
    async cancelRide(rideId, reason, role) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        if (["completed", "cancelled"].includes(ride.ride_status)) {
            throw new Error("Ride cannot be cancelled");
        }

        ride.ride_status = "cancelled";
        ride.cancellation_reason = reason;
        ride.cancelled_at = new Date();
        ride.cancelled_by = role
        await ride.save();

        return ride;
    }

    // Reject Ride
    async rejectRide(userId, rideId) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        ride.ride_status = "rejected";
        ride.rejected_at = new Date();
        ride.rejected_by = userId;
        await ride.save();

        return ride;
    }

    // Driver: mark ride as completed
    async completeRide(rideId, fare, distance, duration) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        ride.ride_status = "completed";
        ride.fare = fare;
        ride.distance = distance;
        ride.duration = duration;
        ride.completed_at = new Date();
        await ride.save();

        return ride;
    }

    // Driver: accept a ride request (assign driver + vehicle)
    async assignDriver(rideId, driverId, vehicleId, otp) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        if (ride.ride_status !== "requested") {
            throw new Error("Ride is not available for assignment");
        }

        ride.driver_id = driverId;
        ride.vehicle_id = vehicleId;
        ride.ride_status = "accepted";
        ride.accepted = new Date();
        ride.otp = otp;

        await ride.save();

        return ride;
    }

    // Driver: update ride status (e.g., ongoing, completed)
    async updateRideStatus(rideId, status) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        ride.ride_status = status;

        if (status === "ongoing") {
            ride.started_at = new Date();
        }

        await ride.save();

        return ride;
    }

    // Admin: delete a ride (hard delete, e.g., fraud/test data)
    async deleteRide(rideId) {
        return await Ride.destroy({ where: { ride_id: rideId } });
    }

    // Driver: get rides with status = "requested" (available rides)
    async getAvailableRides() {
        return await Ride.findAll({
            where:
            {
                ride_status: "requested", driver_id: null,
            },
            order: [["requested_at", "ASC"]]
        });
    }

    // Driver: check if driver has an active ride
    async getActiveRideByDriver(driverId) {
        return await Ride.findOne({
            where: {
                driver_id: driverId,
                ride_status: { [Op.in]: ["accepted", "ongoing", "driver_arrived"] },
            },
            include: [
                {
                    model: User,
                    as: 'Rider',
                    attributes: ['user_id', 'firstname', 'lastname', 'phone', 'email']
                },
                {
                    model: Vehicle,
                    attributes: ['vehicle_id', 'make', 'model', 'color', 'registration_number']
                }
            ]
        });
    }

    // Rider: check if rider has an active ride
    async getActiveRideByRider(riderId) {
        return await Ride.findOne({
            where: {
                rider_id: riderId,
                ride_status: { [Op.in]: ["requested", "accepted", "ongoing", "driver_arrived"] },
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

        ride.ride_status = "cancelled";
        ride.cancellation_reason = reason || "Cancelled by admin";
        await ride.save();

        return ride;
    }

    // Admin: aggregated stats (total rides, completed, cancelled, avg fare, etc.)
    async getRideStats() {
        const total = await Ride.count();
        const completed = await Ride.count({ where: { ride_status: "completed" } });
        const cancelled = await Ride.count({ where: { ride_status: "cancelled" } });
        const avgFare = await Ride.aggregate("fare", "avg", { plain: true });

        return {
            total,
            completed,
            cancelled,
            avgFare: avgFare || 0,
        };
    }

    async getUserRidesByDateRange(user_id, startDate, endDate) {
        return await Ride.findAll({
            where: {
                rider_id: user_id,
                requested_at: {
                    [Op.between]: [startDate, endDate],
                },
            },
            order: [["requested_at", "ASC"]], // earliest rides first
        });
    }

    async deleteRating(ratingId) {
        return await Ride.findOneAndUpdate({ rating_id: ratingId }, { $set: { rating_id: null } },);
    }

    //get active ride assigned to a particular vehicle
    async getActiveRideByVehicle(vehicleId) {
        return await Ride.findOne({
            where: {
                vehicle_id: vehicleId,
                ride_status: { [Op.in]: ["accepted", "started"] },
            },
        });
    }

    //safely update ride fields
    async safeUpdateRideFields(rideId, fields) {
        const allowedFields = [
            "driver_id",
            "vehicle_id",
            "ride_status",
            "accepted_at",
            "started_at",
            "completed_at",
            "cancelled_at",
            "cancellation_reason",
            "fare",
            "distance_km",
            "duration_minutes",
            "payment_status",
            "otp_verified_at",
            "rating_id",
        ];

        const invalidFields = Object.keys(fields).filter(
            key => !allowedFields.includes(key)
        );

        if (invalidFields.length) {
            throw new Error(`Invalid fields passed: ${invalidFields.join(", ")}`);
        }

        fields.updated_at = new Date();
        await Ride.update(fields, { where: { ride_id: rideId } });
        return await Ride.findByPk(rideId);
    }

    async updatePaymentStatus(rideId, status) {
        const ride = await Ride.findByPk(rideId);
        if (!ride) return null;

        ride.payment_status = status;

        await ride.save();

        return ride;
    }
    // for Vehicle delete
    async findActiveRideByVehicleId(vehicleId) {
        return await Ride.findOne({
            where: {
                vehicle_id: vehicleId,
                ride_status: {
                    [Op.notIn]: ["completed", "cancelled"],
                },
            },
        });
    }
}

export default new RideRepository();