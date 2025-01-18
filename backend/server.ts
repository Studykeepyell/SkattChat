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

// Import routes
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { setupSocket } from './socket/index.js';
import connectDB from './config/dbConfig.js';
import friendRoutes from './routes/friendRoutes.js';

// Load environment variables
config({ path: join(__dirname, '../.env') });

const isDevelopment = process.env.NODE_ENV === 'development';
console.log('[SERVER] Environment:', process.env.NODE_ENV);
console.log('[SERVER] MongoDB URI:', process.env.MONGODB_URI);

// Ensure downloads directory exists
const DOWNLOADS_DIR = join(__dirname, '../dist/releases');
if (!existsSync(DOWNLOADS_DIR)) {
    mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// App and Server Setup
const app = express();
const httpServer = createServer(app);

// Unified CORS configuration for both Express and Socket.IO
const allowedOrigins = isDevelopment 
    ? ['http://localhost', 'http://localhost:80', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080']
    : ['https://skattchat.online', 'app://skattchat'];

console.log('[SERVER] Allowed origins:', allowedOrigins);

const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            console.log('[CORS] Accepted origin:', origin);
            callback(null, true);
        } else {
            console.log('[CORS] Rejected origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false
};

// Socket.IO setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e8
});

// Apply CORS middleware
app.use(cors(corsOptions));

// Add OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// Configure security headers including CSP
app.use((req, res, next) => {
    const isDev = process.env.NODE_ENV === 'development';
    const cspDirectives = isDev ? {
        'default-src': ["'self'"],
        'connect-src': [
            "'self'",
            "http://localhost",
            "ws://localhost",
            "wss://localhost",
            "http://localhost:3000",
            "ws://localhost:3000",
            "wss://localhost:3000",
            "http://localhost:3001",
            "ws://localhost:3001",
            "wss://localhost:3001",
            "http://localhost:3001/socket.io/",
            "ws://localhost:3001/socket.io/",
            "wss://localhost:3001/socket.io/",
            "http://localhost:3000/socket.io/",
            "ws://localhost:3000/socket.io/",
            "wss://localhost:3000/socket.io/"
        ],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "http://localhost", "http://localhost:3000", "http://localhost:3001", "data:", "blob:", "file:"],
        'font-src': ["'self'", "data:"],
        'media-src': ["'self'"],
        'worker-src': ["'self'", "blob:"],
        'frame-ancestors': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'object-src': ["'none'"],
        'manifest-src': ["'self'"]
    } : {
        'default-src': ["'self'"],
        'connect-src': [
            "'self'",
            "https://skattchat.online",
            "wss://skattchat.online",
            "https://skattchat.online/socket.io/",
            "wss://skattchat.online/socket.io/"
        ],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "https://skattchat.online", "data:", "blob:", "file:"],
        'font-src': ["'self'", "data:"],
        'media-src': ["'self'"],
        'worker-src': ["'self'", "blob:"],
        'frame-ancestors': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'object-src': ["'none'"],
        'manifest-src': ["'self'"]
    };

    const cspHeader = Object.entries(cspDirectives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');

    res.setHeader('Content-Security-Policy', cspHeader);
    next();
});

// Debugging middleware
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    if (Object.keys(req.body).length) console.log('[REQUEST] Body:', req.body);
    if (req.headers.authorization) console.log('[REQUEST] Auth header present');
    next();
});

// API routes with proper error handling
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/chat/rooms', roomRoutes);
app.use('/api/friends', friendRoutes);

// Set up static routes AFTER API routes
app.use(express.static(join(__dirname, '../../public')));
app.use('/assets', express.static(join(__dirname, '../../public/assets')));
app.use('/dist', express.static(join(__dirname, '../../public/dist')));
app.use('/styles', express.static(join(__dirname, '../../public/styles')));
app.use('/scripts', express.static(join(__dirname, '../../public/scripts')));
app.use('/pages', express.static(join(__dirname, '../../public/dist/pages')));
app.use('/fonts', express.static(join(__dirname, '../../public/dist/fonts')));
app.use('/downloads', express.static(DOWNLOADS_DIR));

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../../public/index.html'));
});

// Add specific routes for pages in dist
app.get('/pages/:page', (req, res) => {
    res.sendFile(join(__dirname, '../../public/dist/pages', req.params.page));
});

// Error handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('[ERROR]:', err);
    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal Server Error',
        details: isDevelopment ? err.stack : undefined
    });
};

app.use(errorHandler);

// Socket.IO setup
setupSocket(io);

// Database connection and server start
const startServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();
        console.log('[SERVER] MongoDB connected successfully');

        // Then start the server
        const PORT = parseInt(process.env.PORT || '3001', 10);
        const HOST = process.env.HOST || '0.0.0.0';
        
        httpServer.listen(PORT, () => {
            console.log(`[SERVER] Running at http://${HOST}:${PORT}`);
            console.log(`[SERVER] Development mode: ${isDevelopment}`);
        });
    } catch (error) {
        console.error('[SERVER] Failed to start:', error);
        process.exit(1);
    }
};

startServer();
