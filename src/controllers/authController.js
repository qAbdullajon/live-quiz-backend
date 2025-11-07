import prisma from "../prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
    try {
        const { firstName, lastName, phone, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const teacher = await prisma.teacher.create({
            data: {
                firstName,
                lastName,
                phone,
                password: hashedPassword
            },
        });

        const token = jwt.sign(
            { id: teacher.id, phone: teacher.phone },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({ message: "Teacher registered successfully", teacher, token });
    } catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({ message: "Phone already in use" });
        }
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { phone, password } = req.body;

        const teacher = await prisma.teacher.findUnique({ where: { phone } });
        if (!teacher) return res.status(404).json({ message: "Teacher not found" });

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) return res.status(401).json({ message: "Wrong password" });

        // JWT token
        const token = jwt.sign(
            { id: teacher.id, phone: teacher.phone },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ message: "Login successful", token });
    } catch (err) {
        next(err);
    }
};

export const auth = async (req, res, next) => {
    try {
        const teacher = await prisma.teacher.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
            },
        });

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.json({ isAuth: true, teacher });
    } catch (err) {
        next(err);
    }
};
