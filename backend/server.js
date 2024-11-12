const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Import routes and modules
const userRoutes = require('./userRoute');
const ticTacToe = require('./ticTacToe');
const chat = require('./chat');  // Import chat module

const isWord = require('is-word');
const englishWords = isWord('american-english');

// Middleware
app.use(cors());
// app.use(cors({ origin: ['http://127.0.0.1:5500', 'https://skattchat.online'], 
//   methods: 'GET,POST,PUT,DELETE', 
//   credentials: true, 
// }));
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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 })
  .then(() => console.log('MongoDB Atlas connected'))
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

// app.use(cors());
// Define an endpoint to check if a word is English
app.get('/check-word', async (req, res) => {
    const word = req.query.word;
    const isEnglishWord = await englishWords.check(word.toLowerCase());
    console.log('isEnglishhard:', isEnglishWord);
    res.json({ word, isEnglishWord });
});

app.use(express.static(path.join(__dirname, '\public\Games')));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
