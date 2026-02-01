import { Server } from "socket.io";
import { verifyToken } from "../middlewares/auth.middleware.js";
// this file handles real time features like joining calls, chat, webRTC signaling, leaving calls

const messages = {};
const MAX_MESSAGES_PER_ROOM = 100;

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  io.use(verifyToken);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a meeting room
    socket.on("join-call", (roomId, name) => {
      if (!roomId) return; // edge case
      // else join
      socket.data.name = name; // store name for session
      socket.join(roomId);

      // Get all clients in the room
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

      // Notify everyone urself too about the new user with client list
      const users = clients.map((id) => {
        const s = io.sockets.sockets.get(id);
        return {
          socketId: id,
          name: s?.data?.name || "Guest",
        };
      });

      io.to(roomId).emit("user-joined", socket.id, users);

      // Send previous chat messages to new user
      if (messages[roomId]) {
        messages[roomId].forEach((msg) => {
          socket.emit("chat-message", msg.message, msg.sender, msg.socketId);
        });
      }
    });

    // WebRTC signaling
    socket.on("signal", (toId, message) => {
      //sends message to everyone including user
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
        socketId: socket.id,
      });
      
      if (messages[roomId].length > MAX_MESSAGES_PER_ROOM) {
        messages[roomId].splice(0, messages[roomId].length - MAX_MESSAGES_PER_ROOM);
      }

      io.to(roomId).emit("chat-message", message, sender, socket.id);
      console.log(sender + ": " + message);
    });

    // Video state change
    socket.on("video-state", (videoState) => {
      // Use socket.rooms to broadcast to all rooms the user is in
      //socket.rooms is a Set so we can iterate
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
            socket.to(roomId).emit("video-state", socket.id, videoState);
        }
      }
    });
    // Use disconnecting instead of disconnect
    socket.on("disconnecting", () => {
      console.log("User disconnecting:", socket.id);

      // In disconnecting socket.rooms is still populated
      // Notify every room except the room with the same ID as the socket
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          
          // Emit user-left to the room
          socket.to(roomId).emit("user-left", {
            socketId: socket.id,
            name: socket.data.name,
          });

          // Clean up room messages if now empty (check size before leaving)
          const room = io.sockets.adapter.rooms.get(roomId);
          // room.size includes the current user, so if size is 1, it will be empty after this
          if (room && room.size === 1) {
            delete messages[roomId];
          }
        }
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // socket.rooms is empty here, logic moved to 'disconnecting'
    });
  });

  return io;
};

export default connectToSocket;