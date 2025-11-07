import { body, validationResult } from "express-validator";

export const createQuizValidator = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ min: 3 })
        .withMessage("Title must be at least 3 characters"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const createQuestionValidator = [
    body("text")
        .trim()
        .notEmpty()
        .withMessage("Question text is required")
        .isLength({ min: 3 })
        .withMessage("Question text must be at least 3 characters"),

    body("options")
        .isArray({ min: 2, max: 6 })
        .withMessage("Options must be an array of 2 to 6 elements"),
    body("options.*")
        .trim()
        .notEmpty()
        .withMessage("Option text cannot be empty"),

    body("correctIndex")
        .notEmpty()
        .withMessage("Correct Index index is required"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const startQuizValidator = [
    body("duration")
        .notEmpty()
        .withMessage("Duration is required")
        .isInt({ min: 1 })
        .withMessage("Duration must be a positive integer (seconds)"),

    body("maxParticipants")
        .notEmpty()
        .withMessage("Max participants is required")
        .isInt({ min: 1 })
        .withMessage("Max participants must be a positive integer"),


    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const joinQuizValidator = [
    body("code")
        .notEmpty()
        .withMessage("Code is required")
        .isInt({ min: 1000, max: 9999 })
        .withMessage("Code must be a 4-digit number"),
    body("name")
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];