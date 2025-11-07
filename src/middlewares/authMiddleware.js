import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

export const validateRegister = [
    body("firstName")
        .trim()
        .notEmpty().withMessage("First name is required")
        .escape(),
    body("lastName")
        .trim()
        .notEmpty().withMessage("Last name is required")
        .escape(),
    body("phone")
        .trim()
        .notEmpty().withMessage("Phone is required")
        .isMobilePhone().withMessage("Invalid phone number")
        .escape(),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 4 }).withMessage("Password must be at least 4 characters"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
