const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const User = require('./models/User');
const Message = require('./models/Message');


// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Sky:Sky090726@cluster1.ripon.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';
mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 30000 // 30 seconds timeout
})
.then(() => console.log('MongoDB Atlas connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Serve the login and chat HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user in the database
        const user = await User.findOne({ username: username });

        // Check if the user exists and the password matches
        if (user && await user.comparePassword(password)) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        console.log('Error during login:', err);
        res.json({ success: false, message: 'An error occurred during login' });
    }
});

// Registration route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Validate the input
        if (!username || !password) {
            return res.json({ success: false, message: 'Username and password are required' });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.json({ success: false, message: 'Username already taken' });
        }

        // Create a new user
        const newUser = new User({ username, password });
        await newUser.save();

        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.log('Error during registration:', err);
        res.json({ success: false, message: 'An error occurred during registration' });
    }
});


// Socket.IO handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Load chat history from the database and send it to the client
    Message.find().sort({ timestamp: 1 }).limit(100)
        .then(messages => {
            socket.emit('chat history', messages);
        })
        .catch(err => {
            console.log('Error fetching messages:', err);
        });

    // Handle incoming chat messages
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
            console.log('Message saved successfully'); // Debug log
            // Broadcast the message to all connected clients
            io.emit('chat message', data); // Emit the message event
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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
