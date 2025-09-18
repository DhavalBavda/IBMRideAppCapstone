import PaymentService from '../services/PaymentService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asynHandler.js';

class PaymentController {
    
    createCheckoutOrder = asyncHandler(async (req, res) => {
       
        const result = await PaymentService.createCheckout(req);
        return res
            .status(201)
            .json(result);
        
    });
    
    createCashPayment = asyncHandler(async (req, res) => {
    const result = await PaymentService.createCashPayment(req);
    return res.status(201).json(result);
    });


    verifyPaymentStatus = asyncHandler(async (req, res) => {
       
        const result = await PaymentService.verifyPayment(req);
        return res
            .status(201)
            .json(result);
        
    });

    getPaymentDetails = asyncHandler(async (req,res) => {
        const result = await PaymentService.getPayDetails(req);
        return res
            .status(201)
            .json(result);
    })

}
export default new PaymentController();