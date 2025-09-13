import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";
import HelperFunction from "../utils/HelperFunction.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Config from "../config/Config.js";
import { config } from "dotenv";

class UserService {
  // ----------------- REGISTER -----------------
  async registerUser(data, files) {
    if (!data) throw new ApiError(400, "Missing data");

    const {
      firstname,
      lastname,
      email,
      phone,
      password,
      role = "rider",
      license_number,
      license_expiry_date,
      aadhar_number,
    } = data;

    // ----------------- VALIDATIONS -----------------
    if (!firstname || !lastname || !email || !phone || !password) {
      throw new ApiError(400, "Missing required fields");
    }

    if (await UserRepository.findByEmail(email)) {
      throw new ApiError(409, "Email already registered");
    }
    if (await UserRepository.findByPhone(phone)) {
      throw new ApiError(409, "Phone already registered");
    }

    if (role === "driver") {
      if (!license_number || !license_expiry_date || !aadhar_number) {
        throw new ApiError(
          422,
          "Driver must provide license number, expiry date, and Aadhaar"
        );
      }
    }

    // ----------------- PASSWORD -----------------
    const password_hash = await bcrypt.hash(password, 10);

    // ----------------- CLOUDINARY UPLOADS -----------------
    const avatar_url = files?.avatar?.[0]
      ? await HelperFunction.uploadToCloudinary(files.avatar[0], "avatars")
      : null;

    const license_url =
      role === "driver" && files?.license?.[0]
        ? await HelperFunction.uploadToCloudinary(files.license[0], "licenses")
        : null;

    const aadhar_url =
      role === "driver" && files?.aadhar?.[0]
        ? await HelperFunction.uploadToCloudinary(files.aadhar[0], "aadhars")
        : null;

    // ----------------- USER PAYLOAD -----------------
    const userPayload = {
      firstname,
      lastname,
      email,
      phone,
      password_hash,
      role,
      avatar_url,
      license_number: role === "driver" ? license_number : null,
      license_url,
      license_expiry_date: role === "driver" ? license_expiry_date : null,
      aadhar_number: role === "driver" ? aadhar_number : null,
      aadhar_url,
    };

    return UserRepository.create(userPayload);
  }

  // ----------------- LOGIN -----------------
  async loginUser({ email, password }) {
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate JWT
    const accessToken = jwt.sign(
      { id: user.uuid, role: user.role },
      Config.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: Config.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1h
    };

    return { user, accessToken, cookieOptions };
  }

  async logoutUser(res) {
    // Clear the cookie where token is stored
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: Config.NODE_ENV === "production",
      sameSite: "strict",
    });

    return new ApiResponse(200, null, "Logged out successfully");
  }
}

export default new UserService();
