import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import http from "http"
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';
import { Socket } from 'dgram';

dotenv.config()

//Create Express app and Http server
const app = express();
const server = http.createServer(app);

//initialise socket.io server
export const  io = new Server(server,{
    cors: {origin: '*'}
})

//store online users
export const userSocketMap = {}; // {userId:socketId}

//socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
    socket.userId = userId;  // ✅ store userId in socket object
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (socket.userId) {
      delete userSocketMap[socket.userId];  // ✅ safe access
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

//Middleware setup
app.use(express.json({limit:"4mb"}));
app.use(cors());

//routes setup
app.use("/api/status",(req,res)=>res.send("Server is live"));
app.use("/api/auth",userRouter)
app.use("/api/messages",messageRouter)

//connect to MONGODB
await connectDB();

if(process.env.NODE_ENV !== "production"){
  const PORT = process.env.PORT || 5000
server.listen(PORT,()=>console.log("Server is running on PORT:" + PORT))
}
//export server for vercel
export default server;

 