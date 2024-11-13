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
const predefinedRooms = ['General', 'Random', 'Gaming', 'Music'];


const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const userSocketMap = {}; // Map to track user IDs and their corresponding socket IDs

console.log('Test Variable:', process.env.TEST_VAR); // Check if TEST_VAR is defined
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/get-opinion', async (req, res) => {
  const { message, username } = req.body;  // username should be passed from the client
  console.log('Received request at /api/get-opinion');
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an assistant that gives opinions on messages.' },
          { role: 'user', content: `What is your opinion on this message: "${message}"` }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const opinion = response.data.choices[0].message.content;

    // Save AI response to the database
    const aiMessage = new Message({
      username: 'AttyAI',
      message: `Response to ${username}: "${message}" - ${opinion}`,
      timestamp: new Date()
    });
    await aiMessage.save();

    res.json({ opinion });
  } catch (error) {
    console.error('Error fetching opinion from ChatGPT:', error);
    res.status(500).json({ error: 'Error fetching opinion from ChatGPT' });
  }
});

// Middleware
// Updated CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://skattchat.online'], // Allow both localhost and the live app origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow common HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow required headers
}));


app.use((req, res, next) => {
    console.log(`Serving request for: ${req.url}`);
    next();
});

async function initializeStaticRooms() {
  try {
      for (const roomName of predefinedRooms) {
          const roomId = roomName; // Use room name as ID
          const existingRoom = await Room.findOne({ roomId });
          if (!existingRoom) {
              await Room.create({ roomId, participants: [] });
              console.log(`Created static room: ${roomId}`);
          }
      }
  } catch (err) {
      console.error('Error initializing static rooms:', err);
  }
}


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


// Serve static files from the 'public' directory
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

console.log('MongoDB URI:', process.env.MONGO_URI); // Log the MongoDB URI for debugging

mongoose.connect(process.env.MONGO_URI )
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
// Initialize Chat and Tic-Tac-Toe functionality
ticTacToe(io);// Initializes Tic-Tac-Toe functionality
setupChat(io);

initializeStaticRooms();

// Socket.io for handling chat rooms
// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Endpoint to get all friends of the user
app.get('/api/friends/:userId', async (req, res) => {
  try {
      const userId = req.params.userId;
      const user = await User.findById(userId).populate('friends'); // Assuming 'friends' is an array of user IDs
      res.json(user.friends); // Send list of friends
  } catch (err) {
      res.status(500).json({ error: 'Error retrieving friends' });
  }
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





// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});