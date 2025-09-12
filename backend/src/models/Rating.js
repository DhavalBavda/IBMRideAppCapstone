import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  rideId: {
    type: String, // UUID from Postgres rides
    required: true,
    unique: true, // one rating per ride
  },
  riderId: {
    type: String, // UUID from Postgres users
    required: true,
  },
  driverId: {
    type: String, // UUID from Postgres users
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Rating", ratingSchema);
