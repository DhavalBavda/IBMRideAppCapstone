import express from "express";
import PaymentController from '../controllers/PaymentController.js'
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', authenticateJWT, authorizeRole(['rider']), PaymentController.createCheckoutOrder);
paymentRouter.post('/verify-payment', authenticateJWT, authorizeRole(['rider']), PaymentController.verifyPaymentStatus); 
paymentRouter.get('/paymentDetails/:ride_id',authenticateJWT, authorizeRole(['rider']), PaymentController.getPaymentDetails)
paymentRouter.post(
    '/cash-payment',
    authenticateJWT,
    authorizeRole(['rider']),
    PaymentController.createCashPayment
);

export default paymentRouter;