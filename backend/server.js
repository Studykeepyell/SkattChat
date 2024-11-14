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
const User = require('./models/User');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const userSocketMap = {}; // Map to track user IDs and their corresponding socket IDs


const isWord = require('is-word');
const englishWords = isWord('american-english');

app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Register user routes at /api/users
app.use('/api/users', userRoutes);

// Debugging middleware
app.use((req, res, next) => {
    console.log(`Received request on path: ${req.path}`);
    next();
});
app.use((req, res, next) => {
    console.log(`Serving request for: ${req.url}`);
    next();
});





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
app.use(cors({
  origin: ['http://localhost:3000', 'https://skattchat.online'], // Allow both localhost and the live app origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow common HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow required headers
}));



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
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes

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

app.get('/api/friends/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
      const user = await User.findById(userId).populate('friends');
      if (!user) {
          // User does not exist
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      // User exists but might not have friends
      res.json({ success: true, friends: user.friends || [] });
  } catch (err) {
      console.error('Error retrieving friends:', err);
      res.status(500).json({ success: false, message: 'Error retrieving friends' });
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads')); // Saves in 'uploads' folder
  },
  filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname); // Unique filename
  }
});

const upload = multer({ storage });



app.post('/api/uploadProfileImage/:userId', upload.single('profileImage'), async (req, res) => {
  const { userId } = req.params;

  if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  try {
      // Update user's profileImage in the database
      const user = await User.findByIdAndUpdate(userId, { profileImage: imageUrl }, { new: true });
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, imageUrl });
  } catch (error) {
      console.error('Error saving profile image:', error);
      res.status(500).json({ success: false, message: 'Failed to save profile image' });
  }
});







app.get('/api/getUserProfileImage/:userId', async (req, res) => {
  try {
      const user = await User.findById(req.params.userId);
      if (!user || !user.profileImage) {
          return res.json({ success: false, message: 'Profile image not found' });
      }
      res.json({ success: true, profileImage: user.profileImage });
  } catch (error) {
      console.error('Error retrieving profile image:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve profile image' });
  }
});

// Other routes, including JSON routes
app.use('/api/users', userRoutes);

// Static files and socket configuration
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
