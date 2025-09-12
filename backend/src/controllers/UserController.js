import { asyncHandler } from "../utils/asynHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import UserService from "../services/UserService.js"

class UserController {
  register = asyncHandler(async (req, res) => {
    const user = await UserService.registerUser(req.body,req.files);
    return res
      .status(201)
      .json(new ApiResponse(201, user, "User registered successfully"));
  });
}


export default new UserController();