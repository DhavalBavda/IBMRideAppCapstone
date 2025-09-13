import VehicleRepository from "../repositories/VehicleRepository.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

class VehicleService {
  async registerVehicle(data) {
    const {
      owner_id,
      registration_number,
      make,
      model,
      year,
      color,
      vehicle_type,
      status
    } = data;

    // Validate required fields
    if (!owner_id || !registration_number || !make || !model || !year || !color || !vehicle_type) {
      throw new ApiError(400, "Missing required vehicle fields.");
    }

    // Validate owner exists and is a driver
    const owner = await User.findByPk(owner_id);
    if (!owner || owner.role !== "driver") {
      throw new ApiError(400, "Invalid owner. Must be a driver.");
    }

    // Validate vehicle_type
    const allowedTypes = ["hatchback", "sedan", "suv", "auto", "bike"];
    if (!allowedTypes.includes(vehicle_type)) {
      throw new ApiError(400, `Invalid vehicle_type. Must be one of: ${allowedTypes.join(", ")}`);
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1990 || year > currentYear) {
      throw new ApiError(400, `Invalid year. Must be between 1990 and ${currentYear}`);
    }

    // Check duplicate registration number
    const existing = await VehicleRepository.findByRegNumber(registration_number);
    if (existing) {
      throw new ApiError(400, "Vehicle with this registration number already exists.");
    }

    // Default status if not provided
    const vehicleStatus = status || "active";

    // Create vehicle
    return await VehicleRepository.createVehicle({
      owner_id,
      registration_number,
      make,
      model,
      year,
      color,
      vehicle_type,
      status: vehicleStatus,
    });
  }

  async updateVehicle(id, data) {
    // First fetch the vehicle
    const vehicle = await VehicleRepository.findById(id);

    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }

    // deleted can't change
    if (vehicle.is_deleted) {
      throw new ApiError(400, "Vehicle is deleted and cannot be updated");
    }

    const { color, status } = data;

    // Allow only color and status updates
    if (!color && !status) {
      throw new ApiError(400, "Nothing to update. Only color or status can be updated.");
    }

    // Validate status if provided
    if (status) {
      const allowedStatus = ["active", "inactive"];
      if (!allowedStatus.includes(status)) {
        throw new ApiError(400, "Invalid status value. Allowed: active, inactive");
      }
    }

    // Prepare update object
    const updateFields = {};
    if (color) updateFields.color = color;
    if (status) updateFields.status = status;

    // Update in repository
    const updated = await VehicleRepository.updateVehicle(id, updateFields);

    return updated;
  }

  async deactivateVehicle(id) {
    const deactivated = await VehicleRepository.softDeleteVehicle(id);
    if (!deactivated) throw new ApiError(404, "Vehicle not found");
    return deactivated;
  }

  async getVehiclesByDriver(driverId) {
    return await VehicleRepository.findByOwner(driverId);
  }
}

export default new VehicleService();
