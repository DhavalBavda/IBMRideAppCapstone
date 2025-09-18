import ApiError from "../utils/ApiError.js";
import HelperFunction from "../utils/HelperFunction.js";
import RideRepository from "../repositories/RideRepository.js";

class PaymentService {

    async createCheckout(reqObj){
        
        const { ride_id, rider_id, driver_id, amount, payment_method } = reqObj.body;

        if (!ride_id) { throw new ApiError(400, "Missing the ride id"); }
        //if (!wallet_id) { throw new ApiError(400, "Missing the wallet id"); }
        if (!rider_id) { throw new ApiError(400, "Missing the rider id"); }
        if (!driver_id) { throw new ApiError(400, "Missing the driver id"); }
        if (!amount) { throw new ApiError(400, "Missing the amount"); }
        if (!payment_method) { throw new ApiError(400, "Missing the payment method"); }

        const payload = {
            ride_id,
            rider_id,
            driver_id,
            amount,
            payment_method
        };

        const apiResponseData = await HelperFunction.axiosSendRequest("post", `payments/create-order/`, payload);
        
        console.log("API Response:", apiResponseData);

        if (apiResponseData.error) {
            throw new ApiError(400, apiResponseData.error);
        }

        return apiResponseData;

    }

    async verifyPayment(reqObj) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id , ride_id } = reqObj.body;

        if (!razorpay_order_id) { throw new ApiError(400, "Missing razorpay_order_id"); }
        if (!razorpay_payment_id) { throw new ApiError(400, "Missing razorpay_payment_id"); }
        if (!razorpay_signature) { throw new ApiError(400, "Missing razorpay_signature"); }
        if (!payment_id) { throw new ApiError(400, "Missing payment_id"); }
        if (!ride_id) {throw new ApiError(400,"Missing ride_id"); }

        const payload = {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            payment_id,
            ride_id
        };

        const apiResponseData = await HelperFunction.axiosSendRequest("post", `payments/verify-payment/`, payload);
        
        console.log("Verify Payment API Response:", apiResponseData);
        
        if (apiResponseData.error) { throw new ApiError(400, apiResponseData.error); }
        
        let pay_status;

        if (apiResponseData.status === "SUCCESS") { 
            pay_status = "completed" ;
        } else {
            pay_status = "failed";
        }

        await RideRepository.updatePaymentStatus(ride_id, pay_status);

        return apiResponseData;
    }

    async getPayDetails(reqObj){
        if (!reqObj) {throw new ApiError(400,"Missing required data")};

        const { ride_id } = reqObj.params;

        if(!ride_id) {throw new ApiError(400, "Missing ride_id")};

        const apiResponseData = await HelperFunction.axiosSendRequest("get", `payments/getPaymentDetails/${ride_id}`);

        return apiResponseData;
    }

    async createCashPayment(reqObj) {
    const { ride_id, rider_id, driver_id, amount } = reqObj.body;

    if (!ride_id || !rider_id || !driver_id || !amount) {
        throw new ApiError(400, "Missing required data for cash payment");
    }

    const payload = { ride_id, rider_id, driver_id, amount, payment_method: "CASH" };

    const apiResponseData = await HelperFunction.axiosSendRequest(
        "post",
        "payments/cash-payment/", 
        payload
    );
    
    let pay_status;

        if (apiResponseData.status === "SUCCESS") { 
            pay_status = "completed" ;
        } else {
            pay_status = "failed";
        }

        await RideRepository.updatePaymentStatus(ride_id, pay_status);

    return apiResponseData;
}


}
export default new PaymentService();