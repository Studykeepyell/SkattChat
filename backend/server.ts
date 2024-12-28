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

// Unified CORS configuration
const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        const allowedOrigins = ['http://localhost:3000', 'https://skattchat.online', 'app://skattchat'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
};

// Apply CORS middleware once
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    if (req.headers.authorization) console.log('Auth header present');
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
app.use('/', express.static(join(__dirname, '../public')));
app.use('/assets', express.static(join(__dirname, '../public/assets')));
app.use('/styles', express.static(join(__dirname, '../public/styles')));
app.use('/scripts', express.static(join(__dirname, '../public/scripts')));
app.use('/pages', express.static(join(__dirname, '../public/pages')));
app.use('/fonts', express.static(join(__dirname, '../public/fonts')));
app.use('/dist', express.static(join(__dirname, '../dist')));
app.use('/downloads', express.static(DOWNLOADS_DIR));

// API routes with proper error handling
app.use('/api/auth', authRoutes);
app.use('/api/friendRequests', friendRequestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', (req, res, next) => {
    console.log('\n[CHAT ROUTE] Request details:', {
        path: req.path,
        method: req.method,
        headers: {
            ...req.headers,
            authorization: req.headers.authorization ? 
                `${req.headers.authorization.substring(0, 20)}...` : 
                'none'
        },
        query: req.query,
        body: req.body
    });

    // Check token format
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const [type, token] = authHeader.split(' ');
        console.log('[CHAT ROUTE] Auth header analysis:', {
            type,
            tokenPresent: !!token,
            tokenLength: token?.length,
            tokenStart: token ? `${token.substring(0, 20)}...` : 'none'
        });
    } else {
        console.log('[CHAT ROUTE] No authorization header present');
    }

    next();
}, chatRoutes);
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
  console.error('Error occurred:', err);
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal Server Error',
    details: isDevelopment ? err.stack : undefined
  });
};

app.use(errorHandler);

//Socket.IO Integration
setupSocket(io);

// Connect to MongoDB
connectDB();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT, () => console.log(`Server running at http://${HOST}:${PORT}`));
