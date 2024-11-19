require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/dbConfig');
const chatRoutes = require('./routes/chatRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');
const opinionRoutes = require('./routes/opinionRoutes');
const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes'); 
const { setupSocket } = require('./socket/index');


// App and Server Setup
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Centralized CORS
const corsOptions = require('./config/corsConfig');
app.use(cors(corsOptions));


//Debugging middleware
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    if (Object.keys(req.body).length) console.log('Body:', req.body);
    next();
});



// Load user routes and pass io and userSocketMap
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/opinion', opinionRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/friendRequests', friendRequestRoutes);

//servve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//index Route
app.get('/index', (req, res) => res.sendFile(path.join(__dirname, '../public', 'index.html')));

//Socket.IO Intergration
setupSocket(io);

// Connect to MongoDB
connectDB();

//Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));
