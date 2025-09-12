import Rating from "../models/ratingModel.js";

class RatingRepository {
    // Add or update rider rating for a driver on a ride
    async addRating({ rideId, riderId, driverId, rating }) {
        return await Rating.findOneAndUpdate(
            { rideId },
            { riderId, driverId, rating },
            { upsert: true, new: true } // create if not exists
        );
    }

    // Get rating for a specific ride
    async getRatingByRide(rideId) {
        return await Rating.findOne({ rideId });
    }

    // Calculate average rating of a driver
    async getAverageDriverRating(driverId) {
        const result = await Rating.aggregate([
            { $match: { driverId } },
            { $group: { _id: "$driverId", avgRating: { $avg: "$rating" } } },
        ]);
        return result.length > 0 ? result[0].avgRating : null;
    }
}

export default new RatingRepository();
