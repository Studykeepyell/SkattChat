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

let waitinguser = null;
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
        if (waitingPlayer) {
            // If there's a player waiting, start a game
            const gameData = { player1: waitingPlayer.id, player2: socket.id };
            waitingPlayer.emit('startTictactoeGame', gameData);
            socket.emit('startTictactoeGame', gameData);
            waitingPlayer = null; // Clear the waiting player
        } else {
            // No player waiting, set the current player as the waiting player
            waitingPlayer = socket;

            // Optional timeout to reset waiting status after 30 seconds
            const waitTimeout = setTimeout(() => {
                if (waitingPlayer === socket) {
                    socket.emit('TictactoeWaitTimeout');
                    waitingPlayer = null;
                }
            }, 30000); // 30 seconds timeout
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        if (waitingPlayer === socket) {
            waitingPlayer = null; // Clear waiting player if they disconnect
        }
    });


});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});