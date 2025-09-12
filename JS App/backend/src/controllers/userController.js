import { asyncHandler } from "../utils/asynHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import UserService from "../services/userService.js"

class UserController {

    healthChecker = asyncHandler(async (req, res) => {
      console.log("in");
      const user = await UserService.healthCheckerService();
      res.status(201).json(new ApiResponse(201, user, "Health check successfully"));
  }); 

}

export default new UserController();