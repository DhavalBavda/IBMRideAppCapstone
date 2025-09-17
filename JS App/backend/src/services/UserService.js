import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";
import HelperFunction from "../utils/HelperFunction.js";
import ApiError from "../utils/ApiError.js";
import { generateRidesPDF } from "../utils/pdfGenerator.js"
import CommonMethods from "../utils/CommonMethods.js";
import Config from "../config/Config.js";
import redisClient from '../config/redisClient.js'
import axios from "axios";
import DriverWalletService from "./wallets/DriverWalletService.js";

class UserService {
  // ----------------- REGISTER -----------------
async startRegistration(data, files, req) {
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

  // ----------------- CHECK EXISTING USER -----------------
  const existingUser = await UserRepository.findByEmail(email);

  if (existingUser) {
    if (existingUser.account_status === "inactive") {
      return {
        alreadyRegistered: true,
        message: "Account exists but inactive. Please recover your account.",
        recover: true,
      };
    }
    throw new ApiError(409, "Email already registered and active");
  }

  // ----------------- REQUIRED FIELDS VALIDATION -----------------
  if (!firstname || !lastname || !email || !phone || !password) {
    throw new ApiError(400, "Missing required fields");
  }

  if (await UserRepository.findByPhone(phone)) {
    throw new ApiError(409, "Phone already registered");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password length must be > 6");
  }

  // ----------------- FILE VALIDATION -----------------
  // Avatar is required for all users
  if (!files?.avatar?.length || !files.avatar[0].buffer) {
    throw new ApiError(422, "User must upload a valid profile photo");
  }

  if (role === "driver") {
    if (!license_number || !license_expiry_date || !aadhar_number) {
      throw new ApiError(
        422,
        "Driver must provide license number, expiry date, and Aadhaar"
      );
    }

    if (!files?.license?.length || !files.license[0].buffer) {
      throw new ApiError(422, "Driver must upload a valid license photo");
    }

    if (!files?.aadhar?.length || !files.aadhar[0].buffer) {
      throw new ApiError(422, "Driver must upload a valid Aadhaar photo");
    }
  }

  // ----------------- PASSWORD HASH -----------------
  const password_hash = await bcrypt.hash(password, 10);

  // ----------------- CLOUDINARY UPLOADS -----------------
  let avatar_url = null;
  let license_url = null;
  let aadhar_url = null;

  try {
    // Avatar (all users)
    avatar_url = await HelperFunction.uploadToCloudinary(files.avatar[0], "avatars");

    // License & Aadhaar (drivers only)
    if (role === "driver") {
      license_url = await HelperFunction.uploadToCloudinary(files.license[0], "licenses");
      aadhar_url = await HelperFunction.uploadToCloudinary(files.aadhar[0], "aadhars");
    }
  } catch (uploadError) {
    console.error("File upload error:", uploadError);
    throw new ApiError(500, "File upload failed. Please try again.");
  }

  // ----------------- PREPARE USER PAYLOAD -----------------
  const userPayload = {
    firstname,
    lastname,
    email,
    phone,
    password_hash,
    role,
    profile_image_url : avatar_url,
    license_number: role === "driver" ? license_number : null,
    license_url,
    license_expiry_date: role === "driver" ? license_expiry_date : null,
    aadhar_number: role === "driver" ? aadhar_number : null,
    aadhar_url,
  };

  // ----------------- OTP GENERATION -----------------
  const otp = "" + Math.floor(100000 + Math.random() * 900000);
  const phone_otp = "" + Math.floor(100000 + Math.random() * 900000);

  req.session.pendingUser = {
    userPayload,
    otp,
    phone_otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
  };

  // ----------------- SEND OTP & WELCOME MAIL -----------------
  try {
    const mailObj = {
      to: email,
      subject: "Welcome to Ride App!",
      htmlTemplate: "welcome.html",
      templateData: {
        username: firstname,
        email,
        appname: "rideapp",
        otpcode: otp,
      },
    };

    await HelperFunction.sendOtp(phone, phone_otp);
    await HelperFunction.sendMail(mailObj);
  } catch (notificationError) {
    console.error("Notification error:", notificationError);
    // Don't throw, allow registration to proceed
  }

  return { otpSent: true };
}


  async verifyEmailOtp(req) {
    // Check if OTP exists in session

    const pendingUser = req.session?.pendingUser;
    const recoverOtp = req.session?.recoverOtp;

    // console.log(pendingUser, recoverOtp);


    // ----------------- CASE 1: REGISTRATION OTP -----------------
    if (pendingUser) {
      if (pendingUser.userPayload.email !== req.body.email) {
        throw new ApiError(400, "Email does not match OTP request");
      }

      if (pendingUser.otp !== req.body.otp) {
        throw new ApiError(400, "Invalid OTP");
      }

      if (pendingUser.phone_otp !== req.body.phone_otp) {
        throw new ApiError(400, "Invalid OTP")
      }

      if (Date.now() > pendingUser.expiresAt) {
        throw new ApiError(400, "OTP expired");
      }

      // OTP valid → Create user in DB
      const user = await UserRepository.create({
        ...pendingUser.userPayload,
        email_verified: true,
        phone_verified: true,
      });

      // Clear OTP from session
      delete req.session.pendingUser;

      // the driver crete wallet if the user is a driver
      if (user?.role == "driver") {

        const walletCreateObj = {
          body: { driver_id: user.user_id }
        }
        const driverWalletData = await DriverWalletService.createDriverWallet(walletCreateObj);
        console.log(driverWalletData);

      }

      return { registered: true };
    }

    // ----------------- CASE 2: RECOVERY OTP -----------------
    if (recoverOtp) {
      if (recoverOtp.email !== req.body.email) {
        throw new ApiError(400, "Email does not match recovery request");
      }

      if (recoverOtp.otp !== req.body.otp) {
        throw new ApiError(400, "Invalid OTP");
      }

      if (Date.now() > recoverOtp.expiresAt) {
        throw new ApiError(400, "OTP expired");
      }

      // OTP valid → Reactivate user
      const user = await UserRepository.findByEmail(req.body.email);
      if (!user) throw new ApiError(404, "User not found for recovery");

      user.account_status = "active";
      await user.save();

      // Clear OTP from session
      delete req.session.recoverOtp;

      // ACCOUNT RECOVERED SUCCESS MAIL

      return { recovered: true };
    }

    // ----------------- NO SESSION FOUND -----------------
    throw new ApiError(400, "No OTP request found. Please register or recover again.");
  }

  async AdminRegister({ name, email, phone, password }) {
    if (!name || !email || !phone || !password) {
      throw new ApiError(400, "Name, Email, Phone and Password are required");
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/analysis/register/", {
        name,
        email,
        phone,
        password,
      });

      console.log("✅ Python API responded with:", response.status);

      if (response.status !== 201) {
        throw new ApiError(response.status, "Unexpected response from Python API");
      }

      return { user: response.data, message: "Admin registered successfully" };
    } catch (error) {
      if (error.response) {
        console.error("❌ Python API Error:", error.response.status, error.response.data);

        let friendlyMessage = "Registration failed";

        const data = error.response.data;

        if (data.email) {
          friendlyMessage = `Email: ${data.email.join(", ")}`;
        } else if (data.phone) {
          friendlyMessage = `Phone: ${data.phone.join(", ")}`;
        } else if (data.non_field_errors) {
          friendlyMessage = data.non_field_errors.join(", ");
        } else if (data.detail) {
          friendlyMessage = data.detail;
        }

        throw new ApiError(error.response.status, friendlyMessage);
      }

      console.error("❌ Network/Other Error:", error.message);
      throw new ApiError(500, "Unable to connect to Python API");
    }
  }

  async loginAdmin({ email, password }) {
    if (!email || !password) {
      throw new ApiError(400, "Email and Password are required");
    }

    try {
      // 🔗 Call Python API
      const response = await axios.post("http://127.0.0.1:8000/analysis/login/", {
        email,
        password,
      });

      if (response.status !== 200) {
        throw new ApiError(response.status, "Invalid credentials");
      }

      const adminData = response.data.admin; // from Python API
      const message = response.data.message;

      // 🔑 Generate JWT Token
      const accessToken = jwt.sign(
        { id: adminData.id, email: adminData.email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // 🍪 Cookie Options
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 60 * 60 * 1000, // 1 hour
      };

      return { user: adminData, accessToken, cookieOptions, message };
    } catch (error) {
      if (error.response) {
        throw new ApiError(error.response.status, error.response.data);
      }
      console.log(error);

      throw new ApiError(500, "Unable to connect to Python API");
    }
  }



  async recoverAccount(email, req) {
    if (!email) {
      throw new ApiError(400, "Email is required")
    }
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new ApiError(404, "No account found with this email");

    if (user.account_status === "active") {
      throw new ApiError(400, "Account is already active");
    }

    // Generate OTP
    const otp = "" + Math.floor(100000 + Math.random() * 900000);
    req.session.recoverOtp = {
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    // Send mail
    await HelperFunction.sendMail({
      to: email,
      subject: "Recover your Ride App account",
      htmlTemplate: "recover.html",
      templateData: { username: user.firstname, otpcode: otp },
    });

    return { otpSent: true };
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

    if (user.account_status === "inactive") {
      // business rule: auto-reactivate on login
      throw new ApiError(402, "Your account is deactivated.For activation please register again or recover...")
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate JWT
    const accessToken = jwt.sign(
      { id: user.user_id, role: user.role },
      Config.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 60 * 60 * 1000, // 1h
    };

    return { user, accessToken, cookieOptions };
  }

  async forgotPassword(req) {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Generate 6-digit OTP
    const otp = "" + Math.floor(100000 + Math.random() * 900000);

    // Save OTP in session with expiry (10 min)
    req.session.forgotPassword = {
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    // Send OTP email
    const mailObj = {
      to: email,
      subject: "Reset your password",
      htmlTemplate: "forgotpassword.html",
      templateData: {
        username: user.firstname,
        otpcode: otp,
        appname: "RideApp",
      },
    };

    await HelperFunction.sendMail(mailObj);

    return true
  }

  // ----------------- VERIFY OTP -----------------
  async verifyForgotPasswordOtp(req) {
    const { email, otp } = req.body;

    const sessionData = req.session?.forgotPassword;
    if (!sessionData) {
      throw new ApiError(400, "No OTP request found. Please try again.");
    }

    if (sessionData.email !== email) {
      throw new ApiError(400, "Email does not match OTP request");
    }

    if (sessionData.otp !== otp) {
      throw new ApiError(400, "Invalid OTP");
    }

    if (Date.now() > sessionData.expiresAt) {
      throw new ApiError(400, "OTP expired");
    }

    // OTP verified
    return true
  }

  // ----------------- RESET PASSWORD -----------------
  async resetPassword(req) {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      throw new ApiError(400, "Email and new password are required");
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "Password length must be >= 6")
    }

    const sessionData = req.session?.forgotPassword;
    if (!sessionData || sessionData.email !== email) {
      throw new ApiError(400, "OTP verification required before resetting password");
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    const user = await UserRepository.updatePassword(email, password_hash);

    // Clear session OTP
    delete req.session.forgotPassword;

    // SEND MAIL TO THE USER ABOUT THE PASSWORD CHANGE 
    let mailObj = {
      to: email,
      subject: `Your Ride App password was changed successfully`,
      htmlTemplate: "passwordchangesuccess.html",
      templateData: {
        username: user.firstname + user.lastname,
        appName: "Ride App",
        // resetUrl: "https://yourapp.com/login",
        year: new Date().getFullYear()
      }
    };
    HelperFunction.sendMail(mailObj);

    return true
  }

  async getProfile(req) {
    const { id, role } = req.user;

    const user = await UserRepository.findById(id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Common fields for all roles
    let profile = {
      user_id: user.user_id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      role: role,
      profile_image_url: user.profile_image_url,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      account_status: user.account_status,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      isAvailable : user.isAvailable
    };

    if (role === "driver") {
      // Driver-specific fields
      profile.license_number = user.license_number;
      profile.license_url = user.license_url;
      profile.license_expiry_date = user.license_expiry_date;
      profile.aadhar_number = user.aadhar_number;
      profile.aadhar_url = user.aadhar_url;

      // KYC object
      profile.kyc = {
        license_status: user.license_url ? user.verification_status : "pending",
        aadhar_status: user.aadhar_url ? user.verification_status : "pending",
        overall_status: user.verification_status || "pending",
        notes: user.verification_notes || "",
        verified_by: user.verified_by || null,
        verified_at: user.verified_at || null,
      };
    }

    return profile;
  }

  async updateProfile(req) {
    const { id, role } = req.user;
    const data = req.body;
    const files = req.files;

    const user = await UserRepository.findById(id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    let updateFields = {};

    if (role === "rider") {
      // Riders: basic info + optional profile image
      const { firstname, lastname, phone } = data;
      updateFields = { firstname, lastname, phone };

      if (files?.avatar?.[0]) {
        const avatarUrl = await HelperFunction.uploadToCloudinary(
          files.avatar[0],
          "avatars"
        );
        updateFields.profile_image_url = avatarUrl;
      }
    } else if (role === "driver") {
      // Drivers: rider fields + KYC files
      const {
        firstname,
        lastname,
        phone,
        license_number,
        license_expiry_date,
        aadhar_number,
      } = data;

      updateFields = {
        firstname,
        lastname,
        phone,
        license_number,
        license_expiry_date,
        aadhar_number,
      };

      if (files?.avatar?.[0]) {
        const avatarUrl = await HelperFunction.uploadToCloudinary(
          files.avatar[0],
          "avatars"
        );
        updateFields.profile_image_url = avatarUrl;
      }

      if (files?.license?.[0]) {
        const licenseUrl = await HelperFunction.uploadToCloudinary(
          files.license[0],
          "licenses"
        );
        updateFields.license_url = licenseUrl;
      }

      if (files?.aadhar?.[0]) {
        const aadharUrl = await HelperFunction.uploadToCloudinary(
          files.aadhar[0],
          "aadhars"
        );
        updateFields.aadhar_url = aadharUrl;
      }
    } else {
      throw new ApiError(403, "Only riders and drivers can update profile");
    }

    // Remove undefined values (in case not all fields were passed)
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    await UserRepository.updateById(id, updateFields);

    const updatedUser = await UserRepository.findById(id);

    return { updatedUser };
  }

  async logoutUser(req, res) {
    // Clear the cookie where token is stored
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: Config.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("user_info", {
      httpOnly: false,
      secure: Config.NODE_ENV === "production",
      sameSite: "lax"
    });

    // add the logic to make isAvailable = false
    await UserRepository.updateById(req.user.id, {isAvailable : false});

    return true;
  }

  async deactivateUser(req) {

    const { id } = req.user; // from auth middleware

    const updatedUser = await UserRepository.updateIsActive(id, "inActive");

    if (!updatedUser) {
      throw new ApiError(404, "User not found or could not be deactivated");
    }

    return updatedUser;
  };

  async exportUserRides(userId, totalDays = 14) {

    // 1. Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - totalDays);

    // 2. Split into 7-day chunks
    const ranges = CommonMethods.splitDateRanges(startDate, endDate, 7);

    // 3. Generate PDFs
    const pdfFiles = [];
    for (let i = 0; i < ranges.length; i++) {
      const rides = await UserRepository.getUserRidesByDateRange(
        userId,
        ranges[i].start,
        ranges[i].end
      );

      if (!rides || rides.length === 0) {
        continue; // skip empty ranges
      }

      const filePath = `./user_${userId}_rides_${i + 1}.pdf`;
      await generateRidesPDF(rides, filePath);
      pdfFiles.push(filePath);
    }

    if (pdfFiles.length === 0) {
      throw new ApiError(404, "No rides found for this user in the given range");
    }

    // 4. Create ZIP
    const zipPath = `./user_${userId}_rides_export_${Date.now()}.zip`;
    await CommonMethods.createZipFromFiles(pdfFiles, zipPath);

    // 5. Return ZIP path
    return zipPath;
  }

  // Function to update (or insert) the user's location in Redis
  async updateUserLocation(req) {
    // Get user ID from request
    const { id } = req.user;
    const data = req.body;

    // Validate required fields
    if (!id || !data) {
      throw new ApiError(400, "Missing required data");
    }

    // Extract longitude and latitude from request body
    const longitude = data.longitude || null;
    const latitude = data.latitude || null;

    // Ensure both coordinates are provided
    if (!longitude || !latitude) {
      throw new ApiError(400, "Missing the user coordinates");
    }

    // Store the user’s location in Redis using GEOADD
    // If the user already exists, Redis will update their coordinates
    const redisStoreRes = await redisClient.redis.geoadd(
      "users:location",
      longitude,
      latitude,
      id?.toString()
    );

    // GEOADD returns:
    // 1 -> new element added
    // 0 -> existing element updated
    return redisStoreRes;
  }
// services/userService.js
async getAllUsers() {
  const result = await UserRepository.findAllUsers();
   
  
  if (!result || result.count === 0) {
    throw new ApiError(400, "Currently there are no users");
  }
  return result; // Will contain count + rows
}


  async getPendingVerifications() {
     
    const users = await UserRepository.findUsersByVerificationStatus("pending", "driver");
    console.log(users)
    if (!users || users.length === 0) {
      throw new ApiError(404, "No pending verifications found");
    }
    return users;
  }

  async approveUserVerification(req) {
    const { id } = req.params;
    const notes = req.body?.notes || null;   // safe access
    const adminId = req.user.id;             // from auth middleware

    const user = await UserRepository.findById(id);

    // Only allow if account is active
    if (user.account_status !== "active") {
      throw new ApiError(400, "Only active accounts can be verified");
    }

    if (!user) throw new ApiError(404, "User not found");


    const updateResponse = await UserRepository.updateVerificationStatus(id, {
      status: "approved",   // 👈 now matches repo param
      notes,
      adminId,
    });

    // SEND MAIL AND NOTIFICATION OF VERIFICATION TO THE USER

    let mailObj = {
      to: user.email,
      subject: `Ride App Verification Approved – Welcome on Board, ${user.firstname ? user.firstname : ''} ${user.lastname ? user.lastname : ''}!`,
      htmlTemplate: "driveraccountapproval.html",
      templateData: {
        driverName: user.firstname + user.lastname,
        appName: "Ride App",
        // loginUrl: "https://yourapp.com/login",
        supportEmail: "support@yourapp.com",
        year: new Date().getFullYear()
      }
    };
    HelperFunction.sendMail(mailObj);

    HelperFunction.sendFirebasePushNotification('driverVerificationApproved', { ...(mailObj.templateData), ...user }, [user.id]);

    return updateResponse;
  }

  async rejectUserVerification(req) {
    const { id } = req.params;
    const reason = req.body?.reason || null;   // safe access
    const adminId = req.user.id;

    const user = await UserRepository.findById(id);
    if (!user) throw new ApiError(404, "User not found");

    // Only allow if account is active
    if (user.account_status !== "active") {
      throw new ApiError(400, "Only active accounts can be rejected");
    }

    const updateResponse = await UserRepository.updateVerificationStatus(id, {
      status: "rejected",
      notes: reason,
      adminId,
    }, "active");

    // SEND MAIL AND NOTIFICATION OF VERIFICATION TO THE USER

    let mailObj = {
      to: user.email,
      subject: `Ride App Verification Approved – Welcome on Board, ${user.firstname ? user.firstname : ''} ${user.lastname ? user.lastname : ''}!`,
      htmlTemplate: "driveraccountreject.html",
      templateData: {
        username: user.firstname + user.lastname,
        driverName: user.firstname + user.lastname,
        appname: "Ride App",
        rejectionReason: reason,
        // loginUrl: "https://yourapp.com/login",
        supportEmail: "support@yourapp.com",
        year: new Date().getFullYear()
      }
    };
    HelperFunction.sendMail(mailObj);

    HelperFunction.sendFirebasePushNotification('driverVerificationRejected', { ...(mailObj.templateData), ...user }, [user.id]);

    return updateResponse;
  }

  async setAvailableForRide(reqObj) {
    const driver_id = reqObj.user?.id;
    const isAvailable = reqObj.body.isAvailable;
    if (!driver_id) { throw new ApiError(400, 'Missing required data') };

    return await UserRepository.updateById(driver_id, {isAvailable : isAvailable});
  }


}
export default new UserService();