import { Router } from "express";
import { register, login, auth } from "../controllers/authController.js";
import { authMiddleware, validateRegister } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", login);
router.get('/me', authMiddleware, auth)

export default router;
