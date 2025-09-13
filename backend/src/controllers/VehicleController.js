import { asyncHandler } from "../utils/asynHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import VehicleService from "../services/VehicleService.js";
import UserRepository from "../repositories/UserRepository.js";

class VehicleController {
  registerVehicle = asyncHandler(async (req, res) => {
    if (req.user.role !== "driver") {
      throw new ApiError(403, "Only drivers can register vehicles");
    }
    // Force owner_id to be the logged-in driver
    req.body.owner_id = req.user.id; // JWT contains id of logged-in user

    const vehicle = await VehicleService.registerVehicle(req.body);
    res.status(201).json(new ApiResponse(201, vehicle, "Vehicle registered successfully"));
  });

  updateVehicle = asyncHandler(async (req, res) => {
    // Service will check existence, ownership, and deletion
    const updatedVehicle = await VehicleService.updateVehicle(req.params.id, req.body, req.user);
    res.status(200).json(new ApiResponse(200, updatedVehicle, "Vehicle updated successfully"));
  });


  deactivateVehicle = asyncHandler(async (req, res) => {
    const vehicle = await VehicleService.deactivateVehicle(req.params.id);
    if (!vehicle) throw new ApiError(404, "Vehicle not found");

    // Only the owner driver can deactivate
    if (req.user.role !== "driver" || req.user.id !== vehicle.owner_id) {
      throw new ApiError(403, "You cannot delete another driver’s vehicle");
    }

    await VehicleService.deactivateVehicle(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Vehicle deleted successfully"));
  });

  getVehiclesByDriver = asyncHandler(async (req, res) => {
    const driver = await UserRepository.findById(req.params.driverId);
    if (!driver || driver.role !== "driver") {
      throw new ApiError(404, "Driver not found");
    }

    // Only admin or the driver himself can view
    if (req.user.role !== "admin" && req.user.id !== driver.uuid) {
      throw new ApiError(403, "You cannot view vehicles of another driver");
    }

    const vehicles = await VehicleService.getVehiclesByDriver(req.params.driverId);
    res.status(200).json(new ApiResponse(200, vehicles, "Vehicles fetched successfully"));
  });
}


export default new VehicleController();
