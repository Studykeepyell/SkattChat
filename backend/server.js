// server.js
require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./userRoute');
const Message = require('./models/Message');
const setupChat = require('./chat'); 
const path = require('path');
const ticTacToe = require('./ticTacToe');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://skattchat.online'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  console.log(`Serving request for: ${req.url}`);
  next();
});
app.use('/api/users', userRoutes);

// Serve static files from the 'public' directory
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));



app.use(express.static(path.join(__dirname, '../public')));
// Initialize Chat and Tic-Tac-Toe functionality
ticTacToe(io);  // Initializes Tic-Tac-Toe functionality
setupChat(io);
// Socket.io for handling chat rooms

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
