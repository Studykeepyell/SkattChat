const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors'); // Added CORS support
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const User = require('../backend/models/User');
const Message = require('../backend/models/Message');

let waitingPlayer = null;
const games = {};

// Enable CORS for all requests
app.use(cors({
    origin: 'https://skattchat.online',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));


// Middleware to parse JSON and URL-encoded data
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

app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Sky:Sky090726@cluster1.ripon.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';
mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 30000 // 30 seconds timeout
})
.then(() => console.log('MongoDB Atlas connected'))
.catch(err => console.log('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'chat.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

app.post('/index', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login request received:', { username, password });

    try {
        // Find the user in the database
        const user = await User.findOne({ username: username });

        // Check if the user exists and the password matches
        if (user && await user.comparePassword(password)) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
});





app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log('Registration request received:', { username });

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Username already taken' });
        }

        // Create a new user
        const newUser = new User({ username, password });
        await newUser.save();

        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ success: false, message: 'An error occurred during registration' });
    }
});




// Socket.IO handling for real-time chat functionality
io.on('connection', (socket) => {
    console.log('A user connected'+socket.id);

    // Load chat history from the database and send it to the client
    Message.find().sort({ timestamp: 1 }).limit(100)
        .then(messages => {
            socket.emit('chat history', messages);
        })
        .catch(err => {
            console.log('Error fetching messages:', err);
        });

    // Handle incoming chat messages
    socket.on('chat message', (data) => {
        console.log(`Message from ${data.username}: ${data.message}`);
        
        // Save the message to the database
        const newMessage = new Message({
            username: data.username,
            message: data.message,
            timestamp: data.timestamp
        });

        newMessage.save()
            .then(() => {
                console.log('Message saved successfully');
                // Broadcast the message to all connected clients
                io.emit('chat message', data);
            })
            .catch(err => {
                console.log('Error saving message:', err);
            });
    });



    // Handle the 'clear messages' event
    socket.on('clear messages', () => {
        // Delete all messages from the database
        Message.deleteMany({})
            .then(() => {
                console.log('All messages deleted');
                // Broadcast the 'clear messages' event to all clients
                io.emit('clear messages');
            })
            .catch(err => {
                console.log('Error deleting messages:', err);
            });
    });



    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });



   
    socket.on('findTictactoeOpponent', () => {
        console.log(`User ${socket.id} clicked to find a Tic-Tac-Toe opponent.`);

        if (waitingPlayer) {
            // Create a unique room ID and initialize the game state
            const roomID = `game-${waitingPlayer.id}-${socket.id}`;
            const firstPlayer = Math.random() < 0.5 ? 'X' : 'O'; // Randomly choose the first player
            const secondPlayer = firstPlayer === 'X' ? 'O' : 'X';

            games[roomID] = {
                board: Array(3).fill(null).map(() => Array(3).fill(null)),
                currentPlayer: firstPlayer,
            };

            // Join both players to a room and notify them of their roles
            socket.join(roomID);
            waitingPlayer.join(roomID);

            // Notify both clients of their symbol and who goes first
            io.to(socket.id).emit('startTictactoeGame', { roomID, playerSymbol: secondPlayer, isFirstTurn: secondPlayer === firstPlayer });
            io.to(waitingPlayer.id).emit('startTictactoeGame', { roomID, playerSymbol: firstPlayer, isFirstTurn: firstPlayer === firstPlayer });

            console.log(`Game started in room ${roomID}, ${firstPlayer} goes first`);
            waitingPlayer = null; // Reset the waiting player
        } else {
            waitingPlayer = socket;
        }
    });

    socket.on('makeMove', ({ row, col, roomID, player }) => {
        const game = games[roomID];
        if (game && game.board[row][col] === null && game.currentPlayer === player) {
            // Update board and broadcast move
            game.board[row][col] = player;
            io.to(roomID).emit('moveMade', { row, col, player });

            // Check for game over conditions
            if (checkWin(game.board, player)) {
                io.to(roomID).emit('gameOver', player);
                delete games[roomID];
            } else if (isBoardFull(game.board)) {
                io.to(roomID).emit('gameOver', 'tie');
                delete games[roomID];
            } else {
                // Switch turns and notify players of the updated turn
                game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
                io.to(roomID).emit('updateTurn', game.currentPlayer);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }

        // Clean up any games that include the disconnected player
        for (const roomID in games) {
            if (roomID.includes(socket.id)) {
                io.to(roomID).emit('opponentDisconnected');
                delete games[roomID];
                break;
            }
        }
    });



});

function checkWin(board, player) {
    for (let i = 0; i < 3; i++) {
        if (board[i].every(cell => cell === player) || board.every(row => row[i] === player)) return true;
    }
    return (board[0][0] === player && board[1][1] === player && board[2][2] === player) ||
           (board[0][2] === player && board[1][1] === player && board[2][0] === player);
}

function isBoardFull(board) {
    return board.every(row => row.every(cell => cell !== null));
}

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});