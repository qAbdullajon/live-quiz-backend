import { Server } from "socket.io";
import prisma from "../prismaClient.js";

export const initSocket = (server) => {
	const io = new Server(server, {
		cors: { origin: "*" },
	});

	io.on("connection", (socket) => {
		console.log("✅ Client connected:", socket.id);

		socket.on("joinQuiz", async ({ code, name, teacher }) => {
			const quiz = await prisma.quiz.findUnique({
				where: { roomCode: code },
				include: { questions: true },
			});
			if (!quiz) return socket.emit("error", "Quiz not found");

			socket.join(code);

			if (teacher) {
				return;
			}

			let participant = await prisma.participant.findFirst({
				where: { quizId: quiz.id, name },
			});

			if (!participant) {
				participant = await prisma.participant.create({
					data: { quizId: quiz.id, name, socketId: socket.id },
				});
			} else {
				await prisma.participant.update({
					where: { id: participant.id },
					data: { socketId: socket.id },
				});
			}

			const participants = await prisma.participant.findMany({
				where: { quizId: quiz.id },
				include: { answers: true, quiz: true },
			});

			io.to(code).emit("newParticipant", {
				participants,
				currentParticipant: participant,
				quiz,
			});
		});


		socket.on("goLive", async ({ code }) => {
			try {
				const quiz = await prisma.quiz.findUnique({ where: { roomCode: code } });
				if (!quiz) return;

				const updatedQuiz = await prisma.quiz.update({
					where: { roomCode: code },
					data: { status: "active" },
					include: { questions: true },
				});

				io.to(code).emit("quizStarted", updatedQuiz);

				// ⏱ Timer ishga tushadi
				let timeLeft = updatedQuiz.duration;
				io.to(code).emit("timerUpdate", { timeLeft });

				const timerInterval = setInterval(async () => {
					if (timeLeft <= 0) {
						clearInterval(timerInterval);
						const finishedQuiz = await prisma.quiz.update({
							where: { roomCode: code },
							data: { status: "draft" },
							include: {
								participants: {
									include: {
										answers: true,
									},
								},
							},

						});
						io.to(code).emit("quizFinished", finishedQuiz);
					} else {
						timeLeft--;
						io.to(code).emit("timerUpdate", { timeLeft });
					}
				}, 1000);
			} catch (err) {
				console.error("❌ goLive error:", err);
			}
		});

		// 📝 Javob yuborish
		socket.on("submitAnswer", async ({ participantId, questionId, selectedIndex }) => {
			try {
				const question = await prisma.question.findUnique({
					where: { id: questionId },
					include: { quiz: true },
				});
				if (!question) return;

				const correct = question.correctIndex === selectedIndex;

				await prisma.answer.create({
					data: { participantId, questionId, selectedIndex, correct },
				});

				if (correct) {
					await prisma.participant.update({
						where: { id: participantId },
						data: { score: { increment: 1 } },
					});
				}

				const participants = await prisma.participant.findMany({
					where: { quizId: question.quizId },
					include: { answers: true },
				});

				participants.sort((a, b) => {
					if (b.score !== a.score) return b.score - a.score;
					const aTime = a.finishedAt ? new Date(a.finishedAt).getTime() : Infinity;
					const bTime = b.finishedAt ? new Date(b.finishedAt).getTime() : Infinity;
					return aTime - bTime;
				});

				io.to(question.quiz.roomCode).emit("updateLeaderboard", participants);
			} catch (err) {
				console.error("❌ submitAnswer error:", err);
			}
		});

		// 🏁 Testni tugatish
		socket.on("finishQuiz", async ({ participantId, quizCode }) => {
			const participant = await prisma.participant.findUnique({
				where: { id: participantId },
			});
			if (!participant) {
				console.log("❌ Participant not found for finishQuiz");
				return;
			}

			await prisma.participant.update({
				where: { id: participantId },
				data: { finishedAt: new Date() },
			});

			const participants = await prisma.participant.findMany({
				where: { quiz: { roomCode: quizCode } },
				include: { answers: true },
			});

			participants.sort((a, b) => {
				if (b.score !== a.score) return b.score - a.score;
				const aTime = a.finishedAt ? new Date(a.finishedAt).getTime() : Infinity;
				const bTime = b.finishedAt ? new Date(b.finishedAt).getTime() : Infinity;
				return aTime - bTime;
			});

			io.to(quizCode).emit("updateLeaderboard", participants);
		});

		socket.on("disconnect", async () => {
			console.log("Client disconnected:", socket.id);
			await prisma.participant.updateMany({
				where: { socketId: socket.id },
				data: { socketId: null },
			});
		});
	});

	return io;
};
