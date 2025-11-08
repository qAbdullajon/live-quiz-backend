import prisma from "../prismaClient.js";
import sendTelegramMessage from "../utils/telegramNotifier.js";
import { quizService } from "../services/quizService.js";
import generateCode from "../utils/generateCode.js";

export const getMyQuiz = async (req, res, next) => {
    try {
        const teacherId = req.user.id;
        const quizzes = await prisma.quiz.findMany({
            where: {
                teacherId,
            },
            include: {
                questions: true,
                participants: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(quizzes);
    } catch (error) {
        next(error);
    }
};

export const createQuiz = async (req, res, next) => {
    try {
        const { title } = req.body;
        const quiz = await prisma.quiz.create({
            data: {
                title,
                teacherId: req.user.id,
            },
        });
        res.json(quiz);
    } catch (err) {
        next(err);
    }
};
export const deleteQuiz = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const teacherId = req.user.id;

        const quiz = await prisma.quiz.findUnique({
            where: { id: Number(quizId) },
            include: { questions: true },
        });

        if (!quiz) return res.status(404).json({ message: "Quiz topilmadi" });
        if (quiz.teacherId !== teacherId)
            return res.status(403).json({ message: "Siz bu quizni o‘chira olmaysiz" });
        for (const question of quiz.questions) {
            await prisma.answer.deleteMany({ where: { questionId: question.id } });
        }
        await prisma.question.deleteMany({ where: { quizId: Number(quizId) } });
        await prisma.quiz.delete({ where: { id: Number(quizId) } });
        res.json({ message: "Quiz va unga tegishli savollar muvaffaqiyatli o‘chirildi" });
    } catch (error) {
        next(error);
    }
};


// TEACHER: savol qo‘shish
export const addQuestion = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const { text, options, correctIndex } = req.body;
        const question = await quizService.addQuestion(quizId, text, options, correctIndex);
        res.json(question);
    } catch (err) {
        next(err);
    }
};

// TEACHER: quiz start
export const startQuiz = async (req, res, next) => {
    try {
        const quizId = Number(req.params.quizId);
        const { duration, maxParticipants } = req.body;
        const roomCode = generateCode();

        const participants = await prisma.participant.findMany({
            where: { quizId },
            select: { id: true },
        });

        const participantIds = participants.map((p) => p.id);

        if (participantIds.length > 0) {
            await prisma.answer.deleteMany({
                where: { participantId: { in: participantIds } },
            });
            await prisma.participant.deleteMany({
                where: { id: { in: participantIds } },
            });
        }

        const quiz = await quizService.startQuiz(quizId, duration, maxParticipants, roomCode);
        res.json({ message: "Quiz started", quiz });
    } catch (err) {
        next(err);
    }
};


// TEACHER: natijalarni olish
export const updateLive = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const results = await quizService.startLive(quizId);
        res.json(results);
    } catch (err) {
        next(err);
    }
};

// TEACHER: quiz tugaganda Telegramga yuborish
export const finishQuiz = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const top3 = await quizService.getTop3(quizId);
        const all = await quizService.getResults(quizId);

        const message = `
📊 Quiz tugadi!
Top 3 ishtirokchi:
${top3.map((s, i) => `${i + 1}. ${s.name} - ${s.correct} ta`).join("\n")}

Jami qatnashchilar: ${all.length}
    `;
        await sendTelegramMessage(message);
        res.json({ message: "Quiz finished" });
    } catch (err) {
        next(err);
    }
};

// STUDENT: quizga kirish
export const joinQuiz = async (req, res, next) => {
    try {
        const { code, name } = req.body;
        const quiz = await prisma.quiz.findUnique({ where: { code } });
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        const student = await prisma.user.create({
            data: { name, email: `${name}@fake.com`, password: "null", role: "STUDENT" },
        });

        await prisma.participant.create({
            data: { quizId: quiz.id, userId: student.id },
        });

        res.json({ message: "Joined quiz", quizId: quiz.id, student });
    } catch (err) {
        next(err);
    }
};

// STUDENT: javob yuborish
export const submitAnswer = async (req, res, next) => {
    try {
        const { quizId, questionId, answer, userId } = req.body;
        const result = await quizService.submitAnswer(quizId, questionId, answer, userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
