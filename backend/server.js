require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios');

const FriendRequest = require('./models/FriendRequest');
const Message = require('./models/Message');
const Room = require('./models/Room');
const User = require('./models/User');
const ticTacToe = require('./ticTacToe');
const chatRoutes = require('./chatRoutes'); // Adjust the path as needed

// Configuration
const app = express();
const server = http.createServer(app);
const userSocketMap = {};

const io = socketIO(server);
const userRoutes = require('./userRoute')(io, userSocketMap); // Adjusted to pass io and userSocketMap

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['http://localhost:3000', 'https://skattchat.online'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Load user routes and pass io and userSocketMap
app.use('/api/users', userRoutes); // Updated usage
app.use('/api/chat', chatRoutes);


// Debugging middleware
app.use((req, res, next) => {
    console.log(`Request Path: ${req.path}`);
    next();
});

// Routes
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/index', (req, res) => res.sendFile(path.join(__dirname, '../public', 'index.html')));



async function createDefaultRooms() {
  const defaultRooms = [
      { roomId: 'general', name: 'General' },
      { roomId: 'random', name: 'Random' },
      { roomId: 'gaming', name: 'Gaming' },
      { roomId: 'music', name: 'Music' }
  ];

  for (const room of defaultRooms) {
      try {
          const existingRoom = await Room.findOne({ roomId: room.roomId });
          if (!existingRoom) {
              await Room.create(room);
              console.log(`Default room created: ${room.name}`);
          } else {
              console.log(`Default room already exists: ${room.name}`);
          }
      } catch (error) {
          console.error(`Error creating room ${room.name}:`, error);
      }
  }
}



// Friend Request Routes
app.post('/api/sendFriendRequest', async (req, res) => {
    const { senderId, recipientId } = req.body;
    const recipientSocketId = userSocketMap[recipientId];
    if (recipientSocketId) {
        io.to(recipientSocketId).emit('friendRequestReceived', { senderId });
    }
    res.json({ message: "Friend request sent successfully" });
});

app.post('/api/acceptFriendRequest', async (req, res) => {
    const { userId, friendId } = req.body;
    const roomId = `room-${userId}-${friendId}`;
    let room = await Room.findOne({ roomId }) || await Room.create({ roomId, participants: [userId, friendId] });

    [userSocketMap[userId], userSocketMap[friendId]].forEach(socketId => {
        if (socketId) io.to(socketId).emit('newChatRoom', { roomId });
    });

    await FriendRequest.deleteOne({ senderId: friendId, recipientId: userId });
    res.json({ message: "Friend request accepted successfully", roomId });
});

app.post('/api/declineFriendRequest', async (req, res) => {
    const { userId, friendId } = req.body;
    await FriendRequest.deleteOne({ senderId: friendId, recipientId: userId });
    if (userSocketMap[friendId]) io.to(userSocketMap[friendId]).emit('friendRequestDeclined', { userId });
    res.json({ message: "Friend request declined" });
});

// Opinion API using ChatGPT
app.post('/api/get-opinion', async (req, res) => {
    const { message, roomId, username } = req.body;
    if (!message || !roomId || !username) return res.status(400).json({ error: 'Required fields missing.' });

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: `Opinion on this message: "${message}"` }]
            },
            { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
        );

        const opinion = response.data.choices[0].message.content;
        await Message.create({ username: 'AttyAI', message: opinion, timestamp: new Date(), room: roomId });
        res.json({ opinion });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching opinion from ChatGPT' });
    }
});

// File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`)
});
const upload = multer({ storage });

app.post('/api/uploadProfileImage/:userId', upload.single('profileImage'), async (req, res) => {
    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.params.userId, { profileImage: imageUrl }, { new: true });
    if (user) res.json({ success: true, imageUrl });
    else res.status(404).json({ success: false, message: 'User not found' });
});

app.get('/api/getUserProfileImage/:userId', async (req, res) => {
    const user = await User.findById(req.params.userId);
    res.json(user ? { success: true, profileImage: user.profileImage } : { success: false, message: 'Profile image not found' });
});

// MongoDB and Socket.IO Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('Connected to MongoDB');

  // Create default rooms after database connection
  createDefaultRooms().then(() => {
      console.log('Default rooms initialized.');
  }).catch(console.error);
})
.catch(error => {
  console.error('Error connecting to MongoDB:', error);
});


// Socket.IO Handlers
// Socket.IO Handlers
io.on('connection', (socket) => {
    // Handle when a client joins a room
    socket.on('joinRoom', ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

  // Remove user from userSocketMap on disconnect
  socket.on('disconnect', () => {
      for (const [userId, socketId] of Object.entries(userSocketMap)) {
          if (socketId === socket.id) {
              delete userSocketMap[userId];
              console.log(`User ${userId} disconnected and removed from userSocketMap`);
          }
      }
  });



    // Listen for joinRoom event
    socket.on('joinRoom', (roomId) => {
      if (typeof roomId !== 'string') {
          console.error('Invalid roomId received:', roomId);
          return;
      }

      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
  });


  // Listen for new chat messages and broadcast them
  socket.on('chat message', async (data) => {
    const { roomId, username, userId, message, timestamp } = data;
    
    // Save the message to the database
    try {
        const newMessage = new Message({
            roomId,
            userId,
            username,
            message,
            timestamp
        });
        await newMessage.save();

        // Broadcast the message to everyone in the room
        io.to(roomId).emit('chat message', {
            roomId,
            username,
            userId,
            message,
            timestamp
        });
        console.log(`Message sent to room ${roomId} by ${username}: ${message}`);
    } catch (error) {
        console.error('Error saving message:', error);
    }
});





  socket.on('sendMessage', async ({ roomId, username, userId, message, timestamp }) => {
    try {
        if (!userId) {
            console.error("userId is undefined!");
            return; // Exit if userId is undefined
        }

        console.log("Received userId:", userId);

        // Save the message to the database
        const newMessage = new Message({ roomId, username, userId, message, timestamp });
        await newMessage.save();

        // Broadcast the message to all users in the room
        io.to(roomId).emit('chat message', {
            room: roomId,
            username,
            message,
            timestamp
        });
        console.log(`Message sent to room ${roomId} by ${username}: ${message}`);
    } catch (error) {
        console.error("Error saving message to database:", error);
    }
});



});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
