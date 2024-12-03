require('dotenv').config();
const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development';
const API_URL = isDev ? 'http://localhost:3000' : 'https://skattchat.online';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        }
    });

    // Disable cache while debugging
    if (isDev) {
        mainWindow.webContents.session.clearCache();
    }

    // Fix path resolution
    const indexPath = path.resolve(__dirname, 'src', 'index.html');
    console.log('Loading index from:', indexPath);

    // Load file with error handling
    mainWindow.loadFile(indexPath).catch(err => {
        console.error('Failed to load index.html:', err);
    });

    // Add error logging
    mainWindow.webContents.on('did-fail-load', (_, code, desc) => {
        console.error('Page load failed:', code, desc);
    });

    // Set CSP header with development-specific rules
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const csp = isDev ? 
            "default-src 'self';" +
            `connect-src 'self' ${API_URL} ws://${API_URL.replace('https://', '')} wss://${API_URL.replace('https://', '')};" +` +
            "script-src 'self' 'unsafe-inline';" +
            "style-src 'self' 'unsafe-inline';" +
            "img-src 'self' data: https: blob:;" :
            "default-src 'self';" +
            "connect-src 'self' https://skattchat.online wss://skattchat.online;" +
            "script-src 'self' 'unsafe-inline';" +
            "style-src 'self' 'unsafe-inline';" +
            "img-src 'self' data: https:;";

        console.log('Setting CSP:', csp);

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [csp]
            }
        });
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    // Add environment logging
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API URL:', API_URL);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});