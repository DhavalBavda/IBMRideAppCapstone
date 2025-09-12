// src/middlewares/auth.js
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js"; // adjust path if needed

// 🔹 Middleware to check authentication
export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the user from DB
        const user = await UserRepository.findById(decoded.user_id);

        if (!user || user.status !== "active") {
            return res.status(401).json({ message: "Unauthorized: User not found or inactive" });
        }

        req.user = {
            user_id: user.user_id,
            role: user.role,
            email: user.email,
        };

        next();
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

// 🔹 Middleware to check roles
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Access denied" });
        }

        next();
    };
};
