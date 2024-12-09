const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/dbConfig');
const friendRequestRoutes = require('./routes/friendRequestRoutes');
const opinionRoutes = require('./routes/opinionRoutes');
const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); 
const { setupSocket } = require('./socket/index');
const downloadRoutes = require('./routes/downloadRoutes'); // Add this line

const { Server } = require('socket.io'); // Add this

require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const fs = require('fs'); // Add this line

const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Environment:', process.env.NODE_ENV); // Add this line

// Ensure downloads directory exists and use dist/releases
const DOWNLOADS_DIR = path.join(__dirname, '../dist/releases');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// App and Server Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'https://skattchat.online', 'app://skattchat'],
        methods: ['GET', 'POST'],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    allowEIO3: true,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e8
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Update CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow Electron app URLs
  if (origin && (origin.startsWith('app://') || 
      origin.startsWith('http://localhost') || 
      origin.startsWith('https://skattchat.online'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

//Centralized CORS
const corsOptions = require('./config/corsConfig');
app.use(cors(corsOptions));

// Add CSP headers middleware
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "connect-src 'self' ws: wss: http: https:; " +
        "script-src 'self' 'unsafe-inline' https://cdn.socket.io; " +
        "style-src 'self' 'unsafe-inline';"
    );
    next();
});

//Debugging middleware
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    if (Object.keys(req.body).length) console.log('Body:', req.body);
    next();
});

// Add this before your static routes
app.use((req, res, next) => {
  if (req.path.includes('/assets/images/')) {
    console.log('Image request:', req.path);
  }
  next();
});

const chatRoutes = require('./routes/chatRoutes')(io);

// Set up static routes before API routes
app.use('/', express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/styles', express.static(path.join(__dirname, '../public/styles')));
app.use('/scripts', express.static(path.join(__dirname, '../public/scripts')));
app.use('/pages', express.static(path.join(__dirname, '../public/pages')));
app.use('/fonts', express.static(path.join(__dirname, '../public/fonts')));
app.use('/downloads', express.static(DOWNLOADS_DIR));

// Add API version prefix
const API_PREFIX = '/api/v1';

// Update route definitions with API prefix and leading slashes
app.use('/api/auth', authRoutes);
app.use('/api/friendRequests', friendRequestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/opinion', opinionRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/downloads', downloadRoutes);

// Add these routes before the SPA support
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files based on environment
app.use(express.static(path.join(__dirname, '../public/dist/index.html')));

// Update static file paths
app.use('/', express.static(path.join(__dirname, '../public')));
app.use('/', express.static(path.join(__dirname, '../electron/src')));  // Serve from electron/src root
app.use('/pages', express.static(path.join(__dirname, '../electron/src/pages')));

// SPA support - should be after API routes
app.get('*', (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        const filePath = req.path.startsWith('/pages/') ? req.path.slice(7) : req.path;
        const paths = [
            path.join(__dirname, '../public', req.path),
            path.join(__dirname, '../electron/dist/pages', filePath),
            path.join(__dirname, '../electron/dist', req.path)
        ];

        for (const tryPath of paths) {
            if (fs.existsSync(tryPath)) {
                return res.sendFile(tryPath);
            }
        }
        res.status(404).send('Not found');
    } else {
        res.status(404).send('Not found');
    }
});

// Add Electron-specific error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal Server Error',
    details: isDevelopment ? err.stack : undefined
  });
});

//Socket.IO Intergration
setupSocket(io);

// Connect to MongoDB
connectDB();

//Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));
