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
import { setupSocket } from './socket/index.js';
import connectDB from './config/dbConfig.js';

// Load environment variables
config({ path: join(__dirname, '../.env') });

const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Environment:', process.env.NODE_ENV);

// Ensure downloads directory exists
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

// Apply CORS middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure security headers including CSP
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
    next();
});

// Debugging middleware
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    if (Object.keys(req.body).length) console.log('Body:', req.body);
    if (req.headers.authorization) console.log('Auth header present');
    next();
});

// Image request logging
app.use((req, res, next) => {
    if (req.path.includes('/assets/images/')) {
        console.log('Image request:', req.path);
    }
    next();
});

// Set up static routes before API routes
app.use(express.static(join(__dirname, '../../public')));
app.use('/assets', express.static(join(__dirname, '../../public/assets')));

// Serve dist directory and its contents
app.use('/dist', express.static(join(__dirname, '../../public/dist'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        }
    }
}));

// Other static routes
app.use('/assets', express.static(join(__dirname, '../../public/dist/assets')));
app.use('/styles', express.static(join(__dirname, '../../public/dist/styles')));
app.use('/scripts', express.static(join(__dirname, '../../public/dist/scripts')));
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

// API routes with proper error handling
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal Server Error',
        details: isDevelopment ? err.stack : undefined
    });
};

app.use(errorHandler);

// Socket.IO setup
setupSocket(io);

// Database connection
connectDB();

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT, () => console.log(`Server running at http://${HOST}:${PORT}`));
