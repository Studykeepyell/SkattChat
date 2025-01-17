import { config } from 'dotenv';
import { app, BrowserWindow, WebContents, Session } from 'electron';
import path from 'path';
import { exec } from 'child_process';

// Load environment variables
config();

// Environment setup
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const API_URL = isDev ? 'http://localhost:3001' : 'https://skattchat.online';

console.log('Environment:', process.env.NODE_ENV);
console.log('Development mode:', isDev);
console.log('API URL:', API_URL);

let mainWindow: BrowserWindow | null = null;

function packageApp(): void {
    exec('electron-builder', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error packaging app: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Packaging stderr: ${stderr}`);
            return;
        }
        console.log(`Packaging stdout: ${stdout}`);
    });
}

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.bundle.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            sandbox: true
        }
    });

    // Development specific settings
    if (isDev && mainWindow.webContents) {
        mainWindow.webContents.session.clearCache();
        mainWindow.webContents.openDevTools();
    }

    // Configure CSP based on environment
    const developmentCSP = {
        'default-src': ["'self'"],
        'connect-src': [
            "'self'",
            "http://localhost:3001",
            "ws://localhost:3001",
            "wss://localhost:3001",
            "http://localhost:3001/socket.io/",
            "ws://localhost:3001/socket.io/",
            "wss://localhost:3001/socket.io/",
            "https://api.giphy.com",
            "https://*.giphy.com"
        ],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://api.giphy.com"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': [
            "'self'", 
            "http://localhost:3001", 
            "data:", 
            "blob:", 
            "file:",
            "https://*.giphy.com",
            "https://media*.giphy.com"
        ],
        'font-src': ["'self'", "data:"],
        'media-src': ["'self'", "https://*.giphy.com", "https://media*.giphy.com"],
        'worker-src': ["'self'", "blob:"],
        'frame-ancestors': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'object-src': ["'none'"],
        'manifest-src': ["'self'"]
    };

    const productionCSP = {
        'default-src': ["'self'"],
        'connect-src': [
            "'self'",
            "https://skattchat.online",
            "wss://skattchat.online",
            "https://skattchat.online/socket.io/",
            "wss://skattchat.online/socket.io/",
            "https://api.giphy.com",
            "https://*.giphy.com"
        ],
        'script-src': ["'self'", "'unsafe-inline'", "https://api.giphy.com"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': [
            "'self'", 
            "https://skattchat.online", 
            "data:", 
            "blob:", 
            "file:",
            "https://*.giphy.com",
            "https://media*.giphy.com"
        ],
        'font-src': ["'self'", "data:"],
        'media-src': ["'self'", "https://*.giphy.com", "https://media*.giphy.com"],
        'worker-src': ["'self'", "blob:"],
        'frame-ancestors': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'object-src': ["'none'"],
        'manifest-src': ["'self'"]
    };

    const cspHeader = Object.entries(isDev ? developmentCSP : productionCSP)
        .map(([key, values]) => `${key} ${values.join(' ')};`)
        .join(' ');

    // Set CSP headers with environment-specific configuration
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [cspHeader]
            }
        });
    });

    // Protocol handler for serving local files
    mainWindow.webContents.session.protocol.interceptFileProtocol('file', (request, callback) => {
        const fileUrl = request.url.substr('file:///'.length);
        
        // Normalize the URL to use forward slashes and remove query parameters
        const normalizedUrl = fileUrl.replace(/\\/g, '/').split('?')[0];
        
        // Handle absolute paths that start with C:/ or similar
        if (/^[A-Za-z]:/i.test(normalizedUrl)) {
            // If it's a direct path to dist/pages, use it as is
            if (normalizedUrl.includes('electron/dist')) {
                const relativePath = normalizedUrl.substring(normalizedUrl.indexOf('electron/dist') + 'electron/dist'.length).replace(/^\//, '');
                const filePath = path.join(process.cwd(), 'electron', 'dist', relativePath);
                console.log('Full path request:', filePath);
                return callback({ path: filePath });
            }
            
            // If it's a path like C:/dist/pages/chat.html, reconstruct it
            if (normalizedUrl.includes('/dist/')) {
                const relativePath = normalizedUrl.substring(normalizedUrl.indexOf('/dist/') + '/dist/'.length);
                const filePath = path.join(process.cwd(), 'electron', 'dist', relativePath);
                console.log('Reconstructed path:', filePath);
                return callback({ path: filePath });
            }
        }
        
        // For relative paths
        const filePath = path.join(process.cwd(), 'electron', 'dist', normalizedUrl);
        
        console.log('Request URL:', request.url);
        console.log('Normalized URL (no query):', normalizedUrl);
        console.log('Final Path:', filePath);
        
        // Check if file exists
        if (require('fs').existsSync(filePath)) {
            callback({ path: filePath });
        } else {
            console.error('File not found:', filePath);
            callback({ error: -6 }); // ERR_FILE_NOT_FOUND
        }
    });

    // Updated path resolution logic
    const indexPath = path.join(process.cwd(), 'electron', 'dist', 'pages', 'login.html');

    console.log('Current working directory:', process.cwd());
    console.log('Loading index from:', indexPath);

    // Verify file exists before loading
    if (!require('fs').existsSync(indexPath)) {
        console.error('File does not exist:', indexPath);
        mainWindow?.loadURL(`data:text/html;charset=utf-8,
            <html>
                <body>
                    <h2>Error loading application</h2>
                    <p>Could not find the login page at: ${indexPath}</p>
                    <p>Current directory: ${process.cwd()}</p>
                </body>
            </html>
        `);
        return;
    }

    // Add error handling for file loading
    mainWindow.loadFile(indexPath)
        .catch(err => {
            console.error('Failed to load login.html:', err);
            console.error('File path:', indexPath);
            console.error('Error details:', err);
        });

    // Error handling
    mainWindow.webContents.on('did-fail-load', (_, code, desc) => {
        console.error('Page load failed:', code, desc);
    });

    // Enhanced dev tools and logging for development
    if (isDev) {
        mainWindow.webContents.openDevTools();
        console.log('Running in development mode');
        console.log('API URL:', API_URL);
        
        try {
            // Note: electron-reload types might not be available
            const electronReload = require('electron-reload');
            electronReload(__dirname, {
                electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
            });
        } catch (error) {
            console.warn('electron-reload not available:', (error as Error).message);
        }
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    // Add environment logging
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API URL:', API_URL);
}

app.whenReady().then(() => {
    createWindow();
    if (!isDev) {
        packageApp();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}); 