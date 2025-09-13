import { asyncHandler } from "../utils/asynHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import UserService from "../services/UserService.js";

class UserController {
  register = asyncHandler(async (req, res) => {
    const user = await UserService.registerUser(req.body, req.files);
    return res
      .status(201)
      .json(new ApiResponse(201, user, "User registered successfully"));
  });

  login = asyncHandler(async (req, res) => {
    const result = await UserService.loginUser(req.body);

    // service returns: { user, accessToken, cookieOptions }
    res.cookie("access_token", result.accessToken, result.cookieOptions);

    return res
      .status(200)
      .json(new ApiResponse(200, { user: result.user, accessToken: result.accessToken }, "Login successful"));
  });

  logout = asyncHandler(async (req, res) => {
    await UserService.logoutUser(res); // service handles cookie clearing
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully"));
  });
}

export default new UserController();
