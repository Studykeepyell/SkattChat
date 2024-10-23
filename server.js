const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
// Example if User model is defined in models/User.js
const User = require('./models/User');



// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// MongoDB connection
const mongoURI = 'mongodb+srv://Sky:Sky090726@cluster1.ripon.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';
mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 30000 // 30 seconds timeout
})
.then(() => console.log('MongoDB Atlas connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Define the message schema and model
const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);



// Serve the login and chat HTML files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/chat.html', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

// Handle login POST request
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user in the database
        const user = await User.findOne({ username: username });

        // Check if the user exists and the password matches
        if (user && user.password === password) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        console.log('Error during login:', err);
        res.json({ success: false, message: 'An error occurred during login' });
    }
});


// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send chat history to the newly connected client
    Message.find().sort({ timestamp: 1 }).limit(100) // Fetch the most recent 100 messages in chronological order
    .then(messages => {
        socket.emit('chat history', messages);
    })
    .catch(err => {
        console.log('Error fetching messages:', err);
    });

    // Handle a user joining the chat
    socket.on('join', (username) => {
        if (username && username.trim()) {
            console.log(`${username} joined the chat`);
            socket.username = username; // Store the username in the socket object
            io.emit('user joined', `${username} has joined the chat`);
        } else {
            console.warn('Received a join event with an invalid username');
        }
    });

    // Handle chat messages
    socket.on('chat message', (data) => {
        console.log(`Message from ${data.username}: ${data.message}`);
        io.emit('chat message', data); // Broadcast to all clients

        // Save message to MongoDB
        const newMessage = new Message({ username: data.username, message: data.message });
        newMessage.save()
            .then(() => console.log('Message saved to MongoDB'))
            .catch(err => console.log('Error saving message:', err));
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        if (socket.username) {
            io.emit('user left', `${socket.username} has left the chat`);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


