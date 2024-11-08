require('dotenv').config({ path: './.env' });

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Import routes and modules
const userRoutes = require('./userRoute');
const ticTacToe = require('./ticTacToe');
const chat = require('./chat');  // Import chat module

console.log('Test Variable:', process.env.TEST_VAR); // Check if TEST_VAR is defined

// Middleware
// Updated CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://skattchat.online'], // Allow both localhost and the live app origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow common HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow required headers
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`Serving request for: ${req.url}`);
    next();
});

// Serve static files from the 'public' directory
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

console.log('MongoDB URI:', process.env.MONGO_URI); // Log the MongoDB URI for debugging

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
// Initialize Chat and Tic-Tac-Toe functionality
chat(io);       // Initializes chat functionality
ticTacToe(io);  // Initializes Tic-Tac-Toe functionality

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
