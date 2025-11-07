import app from "./app.js";
import dotenv from "dotenv";
import { initSocket } from "./src/socket/index.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const io = initSocket(server);
