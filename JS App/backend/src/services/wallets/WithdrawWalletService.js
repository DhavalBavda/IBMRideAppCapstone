import HelperFunction from "../../utils/HelperFunction.js";

class WithdrawWalletService {
  async getAllWithdrawReqDetails(req) {
     
    const apiResponseData = await HelperFunction.axiosSendRequest(
      "get",
      "wallet/withdraw/"
    );
     

    return apiResponseData;
  }

  async getAllWithdrawReqByidDetails(req) {
     const { driver_id } = req.params;
    const apiResponseData = await HelperFunction.axiosSendRequest(
      "get",
      `wallet/withdraw/${driver_id}/`
    );
    return apiResponseData;
  }

  async postAllWithdrawReqByidDetails(req) {
     const { driver_id } = req.params;
     const {amount,account_holder_name,bank_name,ifsc_code,account_number,contact_info}=req.body;
     if (!amount || !account_holder_name||!bank_name||!ifsc_code||!account_number||!contact_info) {
        throw new Error("All The Details Are require,Please Enter All The Details");
      }
    const apiResponseData = await HelperFunction.axiosSendRequest(
      "post",
      `wallet/withdraw/${driver_id}/`,{amount,account_holder_name,bank_name,ifsc_code,account_number,contact_info}
    );
    return apiResponseData;
  }


async changeReqStatus(req) {
    try {
      const { withdraw_id } = req.params;
      const { status } = req.body;

      if (!withdraw_id || !status) {
        throw new Error("Withdraw ID and status are required");
      }
 
      // Send PATCH request to Django API
      const apiResponseData = await HelperFunction.axiosSendRequest(
        "patch",
        `wallet/withdraw/status/${withdraw_id}/`,
        { status }
      );

      console.log("Change Request Status Response:", apiResponseData);
      return apiResponseData;
    } catch (error) {
      console.error("Error changing withdrawal request status:", error.message);
      throw error;
    }
  }
}



export default new WithdrawWalletService();
