// server.js
require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./userRoute');
const FriendRequest = require('./models/FriendRequest');
const Message = require('./models/Message');
const setupChat = require('./chat');
const path = require('path');
const ticTacToe = require('./ticTacToe');
const Room = require('./models/Room'); // Import the Room model



const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const userSocketMap = {}; // Map to track user IDs and their corresponding socket IDs

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://skattchat.online'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/users', userRoutes);

io.on('connection', (socket) => {
  console.log(`User connected with socket ID: ${socket.id}`);

  // Listen for an event where the client sends the userId
  socket.on('registerUser', (userId) => {
      console.log(`Registering user ${userId} with socket ID: ${socket.id}`);
      userSocketMap[userId] = socket.id; // Map the userId to the socketId
  });

  // Remove the user from userSocketMap when they disconnect
  socket.on('disconnect', () => {
      console.log(`User with socket ID ${socket.id} disconnected`);
      for (const [userId, socketId] of Object.entries(userSocketMap)) {
          if (socketId === socket.id) {
              delete userSocketMap[userId];
              console.log(`Removed user ${userId} from userSocketMap`);
              break;
          }
      }
  });
});


app.post('/api/sendFriendRequest', async (req, res) => {
  const { senderId, recipientId } = req.body;

  if (!senderId || !recipientId) {
      return res.status(400).json({ message: "Missing sender or recipient ID" });
  }

  // Create and save the friend request
  const friendRequest = new FriendRequest({ senderId, recipientId });
  await friendRequest.save();

  // Emit friend request event to the recipient
  const recipientSocketId = userSocketMap[recipientId];
  if (recipientSocketId) {
      io.to(recipientSocketId).emit('friendRequestReceived', { senderId });
      console.log(`Emitted friendRequestReceived to ${recipientId} from ${senderId}`); // Log emission
  } else {
      console.error(`Error: recipientSocketId not found for recipient ${recipientId}`);
  }

  res.json({ message: "Friend request sent successfully" });
});



app.post('/api/acceptFriendRequest', async (req, res) => {
  const { userId, friendId } = req.body;

  const updatedRequest = await FriendRequest.findOneAndUpdate(
      { senderId: friendId, recipientId: userId, status: 'pending' },
      { status: 'accepted' },
      { new: true }
  );

  // Create a unique room ID for the private chat room
  const roomId = `room-${userId}-${friendId}`;

  // Check if the room already exists to prevent duplicate rooms
  let room = await Room.findOne({ roomId });
  if (!room) {
      room = new Room({
          roomId: roomId,
          participants: [userId, friendId]
      });
      await room.save(); // Save the new room to the database
  }

  // Notify both users to join the new chat room and update their friend lists
  const userSocketId = userSocketMap[userId];
  const friendSocketId = userSocketMap[friendId];

  if (userSocketId) {
      io.to(userSocketId).emit('newChatRoom', { roomId });
      io.to(userSocketId).emit('addFriend', { friendId });
  }
  if (friendSocketId) {
      io.to(friendSocketId).emit('newChatRoom', { roomId });
      io.to(friendSocketId).emit('addFriend', { userId });
  }

  await FriendRequest.deleteOne({ senderId: friendId, recipientId: userId });

  res.json({ message: "Friend request accepted successfully", roomId });
});


app.post('/api/declineFriendRequest', async (req, res) => {
  const { userId, friendId } = req.body;

  await FriendRequest.deleteOne({ senderId: friendId, recipientId: userId });

  const userSocketId = userSocketMap[friendId];
  if (userSocketId) {
      io.to(userSocketId).emit('friendRequestDeclined', { userId });
  }
  
  res.json({ message: "Friend request declined" });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

app.use(express.static(path.join(__dirname, '../public')));
ticTacToe(io);
setupChat(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
