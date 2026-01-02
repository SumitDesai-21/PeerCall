import { Server } from "socket.io"
import { verifyToken } from "../middlewares/auth.middleware.js";

const connectToSocket = (server) =>{
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Verify token on socket connection
    io.use(verifyToken);

    return io;
}

export default connectToSocket;