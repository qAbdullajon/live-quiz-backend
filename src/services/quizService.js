import prisma from "../prismaClient.js";
import generateCode from "../utils/generateCode.js";

export const quizService = {
    createQuiz: async (teacherId, name) => {
        const code = generateCode(6);
        return prisma.quiz.create({
            data: { name, code, teacherId },
        });
    },

    addQuestion: async (quizId, text, options, correctIndex) => {
        return prisma.question.create({
            data: { quizId: +quizId, text, options, correctIndex },
        });
    },

    startQuiz: async (quizId, duration, maxParticipants, roomCode) => {
        return prisma.quiz.update({
            where: { id: +quizId },
            data: {
                status: "waiting",
                duration: duration,
                maxParticipants: maxParticipants,
                roomCode: roomCode
            },
        });
    },

    startLive: async (quizId) => {
        return prisma.quiz.update({
            where: { id: +quizId },
            data: {
                status: "active"
            },
        });
    },
    getResults: async (quizId) => {
        return prisma.result.findMany({
            where: { quizId: +quizId },
            include: { user: true },
            orderBy: { correct: "desc" },
        });
    },

    getTop3: async (quizId) => {
        return prisma.result.findMany({
            where: { quizId: +quizId },
            include: { user: true },
            orderBy: { correct: "desc" },
            take: 3,
        });
    },

    submitAnswer: async (quizId, questionId, answer, userId) => {
        const question = await prisma.question.findUnique({ where: { id: +questionId } });
        const correct = question.answer === answer ? 1 : 0;

        await prisma.result.upsert({
            where: { userId_quizId: { userId, quizId } },
            update: { correct: { increment: correct } },
            create: { quizId, userId, correct },
        });

        return { correct: Boolean(correct) };
    },
};
