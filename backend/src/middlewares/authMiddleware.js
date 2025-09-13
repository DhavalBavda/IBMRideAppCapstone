// middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import Config from "../config/Config.js";

export const authenticateJWT = (req, res, next) => {
  let token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!token && req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return next(new ApiError(401, "Authorization token missing"));
  }

  try {
    const decoded = jwt.verify(token, Config.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};