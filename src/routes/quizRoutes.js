import { Router } from "express";
import {
    createQuiz,
    addQuestion,
    startQuiz,
    updateLive,
    finishQuiz,
    joinQuiz,
    submitAnswer,
    getMyQuiz,
    deleteQuiz,
} from "../controllers/quizController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createQuestionValidator, createQuizValidator, joinQuizValidator, startQuizValidator } from "../middlewares/quizMiddleware.js";

const router = Router();

// Teacher yo‘llari
router.post("/", authMiddleware, createQuizValidator, createQuiz);
router.post("/:quizId/questions", authMiddleware, createQuestionValidator, addQuestion);
router.post("/:quizId/start", authMiddleware, startQuizValidator, startQuiz);
router.post("/:quizId/active", authMiddleware, updateLive);
router.post("/:quizId/finish", authMiddleware, finishQuiz);
router.get('/my-quiz', authMiddleware, getMyQuiz)
router.delete('/delete/:quizId', authMiddleware, deleteQuiz)

// Student yo‘llari
router.post("/join", joinQuizValidator, joinQuiz);
router.post("/answer", submitAnswer);

export default router;
