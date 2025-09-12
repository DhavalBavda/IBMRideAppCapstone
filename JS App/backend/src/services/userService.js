// import UserRepository from "../repositories/user.repository.js";
// import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
// import bcrypt from "bcrypt"

class UserService {
  async healthCheckerService() {
    console.log("in service");
    if (!false) {
      throw new ApiError(400, "Error generating by me");
    }
    return "success msg by me || endpoint health is good"; // will go to repo after database model creation
  } 
}

export default new UserService();