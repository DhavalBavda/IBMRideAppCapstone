// src/routes/driverRoutes.js
import express from "express";
import DriverController from "../controllers/DriverController.js";
// import { authenticateJWT } from "../middlewares/auth.middleware.js";

const driverRouter = express.Router();

driverRouter.post("/accept/:rideId", DriverController.acceptRide);
driverRouter.post("/cancel/:rideId", DriverController.cancelRide);
driverRouter.post("/start/:rideId", DriverController.startRide);
driverRouter.post("/complete/:rideId", DriverController.completeRide);
//driverRouter.get("/new-rides", DriverController.getNewRides);
//driverRouter.get("/history/:driverId", DriverController.getRideHistory);

export default driverRouter;
