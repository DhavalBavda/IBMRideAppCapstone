import express from "express";
import VehicleController from "../controllers/VehicleController.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { authorizeRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Vehicle management
router.post("/register", authenticateJWT, authorizeRole(["driver"]), VehicleController.registerVehicle);
router.put("/update/:id", authenticateJWT, authorizeRole(["driver"]), VehicleController.updateVehicle);
router.patch("/delete/:id", authenticateJWT, authorizeRole(["driver"]), VehicleController.deactivateVehicle);

// Admin or driver himself can view vehicles by driver
router.get("/driver/:driverId", authenticateJWT, authorizeRole(["driver", "admin"]), VehicleController.getVehiclesByDriver);

export default router;
