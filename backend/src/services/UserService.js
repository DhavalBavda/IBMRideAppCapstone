import bcrypt from "bcryptjs";
import fs from "fs";
import cloudinary from "../config/cloudinary.js"; // make sure you created this
import UserRepository from "../repositories/UserRepository.js";
import HelperFunction from "../utils/HelperFunction.js";
import ApiError from "../utils/ApiError.js";

class UserService {

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

    if (!firstname || !lastname || !email || !phone || !password) {
      throw new ApiError(400, "Missing required fields");
    }

    if (await UserRepository.findByEmail(email)) {
      throw new ApiError(409, "Email already registered");
    }
    if (await UserRepository.findByPhone(phone)) {
      throw new ApiError(409, "Phone already registered");
    }

    const password_hash = await bcrypt.hash(password, 10);

    if (role === "driver") {
      if (!license_number || !license_expiry_date || !aadhar_number) {
        throw new ApiError(
          422,
          "Driver must provide license number, expiry date, and Aadhaar"
        );
      }
    }

    const avatar_url = files?.avatar
      ? await HelperFunction.uploadToCloudinary(files.avatar[0], "avatars")
      : null;

    const license_url =
      role === "driver" && files?.license
        ? await HelperFunction.uploadToCloudinary(files.license[0], "licenses")
        : null;

    const aadhar_url =
      role === "driver" && files?.aadhar
        ? await HelperFunction.uploadToCloudinary(files.aadhar[0], "aadhars")
        : null;

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
}

export default new UserService();
