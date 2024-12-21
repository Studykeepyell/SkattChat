import { Server } from "socket.io";
import { userSocketMap } from "../socket/index.js";

let io: Server;

export const initializeIO = (socketServer: Server) => {
    io = socketServer;
};

export const notifyUser = (userId: string, event: string, data: any) => {
    if (userSocketMap[userId]) {
        io.to(userSocketMap[userId]).emit(event, data);
    } else {
        console.log(`User ${userId} is offline or not registered in userSocketMap.`);
    }
};
// Compare this snippet from backend/socket/index.ts: