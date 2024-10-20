const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Hardcoded list of users (replace this with a database in a real application)
const users = [
    { username: 'user1', password: 'pass1' },
    { username: 'user2', password: 'pass2' },
    { username: 'user3', password: 'pass3' },
    { username: 'user4', password: 'pass4' }
];

// Serve the login and chat HTML files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/chat.html', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

// Handle login POST request
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Authenticate against the hardcoded list of users
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid username or password' });
    }
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('A user connected');

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
        io.emit('chat message', data); // Broadcast the message to all clients
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
