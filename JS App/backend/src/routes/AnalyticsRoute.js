import express from "express";
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';
import AnalyticsController from '../controllers/AnalyticsController.js';

const anaylticsRouter = express.Router();

anaylticsRouter.post('/fare-cal', authenticateJWT, authorizeRole(["rider", "admin"]), AnalyticsController.rideFareCalculation); // Calculation of the fare based on the destination and pickup
anaylticsRouter.get('/get-payment', authenticateJWT, authorizeRole(["admin"]), AnalyticsController.getAllCompletedPayments); // Calculation of the fare based on the destination and pickup
anaylticsRouter.get('/get-payment/:wallet_id', authenticateJWT, authorizeRole(["driver","admin"]), AnalyticsController.getAllCompletedPayments); // Calculation of the fare based on the destination and pickup

export default anaylticsRouter;