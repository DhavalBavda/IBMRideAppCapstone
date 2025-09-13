import { asyncHandler } from "../utils/asynHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import UserService from "../services/UserService.js"
import UserRepository from "../repositories/UserRepository.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class UserController {
  register = asyncHandler(async (req, res) => {
    const user = await UserService.registerUser(req.body, req.files);
    return res
      .status(201)
      .json(new ApiResponse(201, user, "User registered successfully"));
  });
}


export default new UserController();