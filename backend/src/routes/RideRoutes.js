import express from "express";
import RideController from "../controllers/RideController.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { authorizeRole } from "../middlewares/roleMiddleware.js"

const router = express.Router();

// Rider Routes 
router.post("/", authenticateJWT, authorizeRole("rider"), RideController.createRide);
router.get("/ongoing/rider", authenticateJWT, authorizeRole("rider"), RideController.getOngoingRidesForRider);
router.post("/:id/cancel", authenticateJWT, authorizeRole("rider", "driver"), RideController.cancelRide);
router.get("/", authenticateJWT, authorizeRole("rider", "driver"), RideController.listRides);
router.get("/:id", authenticateJWT, authorizeRole("rider", "driver", "admin"), RideController.getRide);

// Driver Routes 
router.get("/available", authenticateJWT, authorizeRole("driver"), RideController.getAvailableRides);
router.get("/ongoing/driver", authenticateJWT, authorizeRole("driver"), RideController.getOngoingRides);
router.get("/history/driver", authenticateJWT, authorizeRole("driver"), RideController.getRideHistory);
router.post("/:id/accept", authenticateJWT, authorizeRole("driver"), RideController.acceptRide);
router.post("/:id/start", authenticateJWT, authorizeRole("driver"), RideController.startRide);
router.post("/:id/complete", authenticateJWT, authorizeRole("driver"), RideController.completeRide);

// Admin Routes
router.get("/all", authenticateJWT, authorizeRole("admin"), RideController.getAllRides);
router.post("/:id/force-cancel", authenticateJWT, authorizeRole("admin"), RideController.forceCancelRide);
router.delete("/:id", authenticateJWT, authorizeRole("admin"), RideController.deleteRide);

export default router;
