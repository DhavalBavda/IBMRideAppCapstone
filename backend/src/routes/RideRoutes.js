import express from "express";
import RideController from "../controllers/RideController.js";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Rider Routes 
router.post("/", authMiddleware, authorizeRoles("rider"), RideController.createRide);
router.get("/ongoing/rider", authMiddleware, authorizeRoles("rider"), RideController.getOngoingRidesForRider);
router.post("/:id/cancel", authMiddleware, authorizeRoles("rider", "driver"), RideController.cancelRide);
router.get("/", authMiddleware, authorizeRoles("rider", "driver"), RideController.listRides);
router.get("/:id", authMiddleware, authorizeRoles("rider", "driver", "admin"), RideController.getRide);

// Driver Routes 
router.get("/available", authMiddleware, authorizeRoles("driver"), RideController.getAvailableRides);
router.get("/ongoing/driver", authMiddleware, authorizeRoles("driver"), RideController.getOngoingRides);
router.get("/history/driver", authMiddleware, authorizeRoles("driver"), RideController.getRideHistory);
router.post("/:id/accept", authMiddleware, authorizeRoles("driver"), RideController.acceptRide);
router.post("/:id/start", authMiddleware, authorizeRoles("driver"), RideController.startRide);
router.post("/:id/complete", authMiddleware, authorizeRoles("driver"), RideController.completeRide);

// Admin Routes
router.get("/all", authMiddleware, authorizeRoles("admin"), RideController.getAllRides);
router.post("/:id/force-cancel", authMiddleware, authorizeRoles("admin"), RideController.forceCancelRide);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), RideController.deleteRide);

export default router;
