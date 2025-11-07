import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { json, urlencoded } from "express";
import authRoutes from "./src/routes/authRoutes.js";
import quizRoutes from "./src/routes/quizRoutes.js";
import errorMiddleware from "./src/middlewares/errorMiddleware.js";

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(helmet());
app.use(morgan("dev"));
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);

// Error handler
app.use(errorMiddleware);

export default app;
