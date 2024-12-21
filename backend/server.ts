import express, { ErrorRequestHandler } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { join, dirname } from 'path';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes (update these to use ES module syntax)
import authRoutes from './routes/authRoutes.js';
import friendRequestRoutes from './routes/friendRequestRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';
import { setupSocket } from './socket/index.js';
import connectDB from './config/dbConfig.js';
import chatRoutesFactory from './routes/chatRoutes.js';

// Load environment variables
config({ path: join(__dirname, '../.env') });

const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Environment:', process.env.NODE_ENV);

// Ensure downloads directory exists and use dist/releases
const DOWNLOADS_DIR = join(__dirname, '../dist/releases');
if (!existsSync(DOWNLOADS_DIR)) {
    mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// App and Server Setup
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'https://skattchat.online', 'app://skattchat'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e8
});

// Middleware
app.use(cors());
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
import corsOptions from './config/corsConfig.js';
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

const chatRoutes = chatRoutesFactory(io);

// Set up static routes before API routes
app.use('/', express.static(join(__dirname, '../../public')));
app.use('/assets', express.static(join(__dirname, '../../public/assets')));
app.use('/styles', express.static(join(__dirname, '../../public/styles')));
app.use('/scripts', express.static(join(__dirname, '../../public/scripts')));
app.use('/pages', express.static(join(__dirname, '../../public/pages')));
app.use('/fonts', express.static(join(__dirname, '../../public/fonts')));
app.use('/downloads', express.static(DOWNLOADS_DIR));

// Add API version prefix
const API_PREFIX = '/api/v1';

// Update route definitions with API prefix and leading slashes
app.use('/api/auth', authRoutes);
app.use('/api/friendRequests', friendRequestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/downloads', downloadRoutes);

// Add these routes before the SPA support
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files
app.use(express.static(join(__dirname, '../../public')));

// SPA fallback - send index.html for all non-API routes
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).send('API endpoint not found');
    }
    res.sendFile(join(__dirname, '../../public/index.html'));
});

// Add Electron-specific error handling
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal Server Error',
    details: isDevelopment ? err.stack : undefined
  });
};

app.use(errorHandler);

//Socket.IO Intergration
setupSocket(io);

// Connect to MongoDB
connectDB();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT, () => console.log(`Server running at http://${HOST}:${PORT}`));
