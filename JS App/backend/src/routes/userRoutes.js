import express from "express";
import userController from "../controllers/userController.js";
// import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asynHandler.js";

const router = express.Router();

// Public routes
router.get("/health", asyncHandler(userController.healthChecker));
// router.post("/login", asyncHandler(UserController.login));

// // Protected routes
// router.get("/:id", authenticateJWT, asyncHandler(UserController.getUserById));
// router.put("/:id", authenticateJWT, asyncHandler(UserController.updateUser));
// router.delete("/:id", authenticateJWT, asyncHandler(UserController.deleteUser));

export default router;
