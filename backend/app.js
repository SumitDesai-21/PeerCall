import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectToSocket from "./src/controllers/socketManager.js";
import userRoutes from './src/routes/users.routes.js';

dotenv.config();  

const app = express();
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({extended: true})); 
let port = process.env.PORT || 8080;
/*
Create HTTP server with Express inside it
Socket.io needs raw HTTP server to attach WebSocket functionality */
const server = createServer(app);

/* 
Attach Socket.io to the same server i.e shares port with Express
This allows both HTTP requests and WebSocket connections on same port */
const io = connectToSocket(server);

// user routes 
app.use('/api/users', userRoutes);


const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully.");
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();

