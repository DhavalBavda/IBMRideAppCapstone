import { asyncHandler } from "../utils/asynHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import VehicleService from "../services/VehicleService.js";

class VehicleController {
  registerVehicle = asyncHandler(async (req, res) => {
    const vehicle = await VehicleService.registerVehicle(req.body);
    res.status(201).json(new ApiResponse(201, vehicle, "Vehicle registered successfully"));
  });

  updateVehicle = asyncHandler(async (req, res) => {
    const vehicle = await VehicleService.updateVehicle(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, vehicle, "Vehicle updated successfully"));
  });

  deactivateVehicle = asyncHandler(async (req, res) => {
    await VehicleService.deactivateVehicle(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Vehicle deleted successfully"));
  });

  getVehiclesByDriver = asyncHandler(async (req, res) => {
    const vehicles = await VehicleService.getVehiclesByDriver(req.params.driverId);
    res.status(200).json(new ApiResponse(200, vehicles, "Vehicles fetched successfully"));
  });
}


export default new VehicleController();
