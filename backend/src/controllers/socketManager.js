import { Server } from "socket.io";
import { verifyToken } from "../middlewares/auth.middleware.js";
// this file handles real time features like joining calls, chat, webRTC signaling, leaving calls.


const messages = {};
const timeOnline = {};

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.use(verifyToken);

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Join a meeting room
        socket.on("join-call", (roomId) => {
            socket.join(roomId);

            timeOnline[socket.id] = new Date();

            // Notify others in the room
            socket.to(roomId).emit("user-joined", socket.id);

            // Send previous chat messages to new user
            if (messages[roomId]) {
                messages[roomId].forEach(msg => {
                    socket.emit("chat-message", msg.message, msg.sender, msg.socketId);
                });
            }
        });

        // WebRTC signaling
        socket.on("signal", (toId, message) => {
            //sends message to everyone including user.
            io.to(toId).emit("signal", socket.id, message);
        });

        // Chat messages
        socket.on("chat-message", (roomId, message, sender) => {
            if (!messages[roomId]) {
                messages[roomId] = [];
            }

            messages[roomId].push({
                sender,
                message,
                socketId: socket.id
            });

            io.to(roomId).emit("chat-message", message, sender, socket.id);
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);

            const joinedAt = timeOnline[socket.id];
            if (joinedAt) {
                const duration = Math.abs(new Date() - joinedAt);
                console.log("Time online:", duration);
            }
            
            socket.rooms.forEach(roomId => {
                socket.to(roomId).emit("user-left", socket.id);
            });

            delete timeOnline[socket.id];
        });
    })

    return io;
};

export default connectToSocket;