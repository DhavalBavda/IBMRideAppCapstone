import ApiError from "../utils/ApiError.js";

export const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    try {
      // roles param can be a single role or array
      if (!Array.isArray(roles)) roles = [roles];

      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, "Access denied. Insufficient permissions.");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};