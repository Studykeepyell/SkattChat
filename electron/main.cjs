require('dotenv').config();
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development';
const API_URL = isDev ? 'http://localhost:3000' : 'https://skattchat.online';

function packageApp() {
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

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true, // Enable context isolation
            webSecurity: isDev ? false : true  // Disable only in development
        }
    });

    // Development specific settings
    if (isDev) {
        mainWindow.webContents.session.clearCache();
        mainWindow.webContents.openDevTools();
    }

    // Fix path resolution
    const indexPath = isDev 
        ? path.join(__dirname, 'src', 'pages/login.html')
        : path.join(__dirname,  'pages/login.html');  // Update path
    
    console.log('Loading index from:', indexPath);

    mainWindow.loadFile(indexPath).catch(err => {
        console.error('Failed to load index.html:', err);
    });

    // Set CSP for development
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': isDev ? [
                    "default-src 'self'",
                    "connect-src 'self' http://localhost:3000",
                    "script-src 'self' 'unsafe-inline'",
                    "style-src 'self' 'unsafe-inline'"
                ].join('; ') : undefined
            }
        });
    });

    // Error handling
    mainWindow.webContents.on('did-fail-load', (_, code, desc) => {
        console.error('Page load failed:', code, desc);
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Enhanced dev tools and logging for development
    if (isDev) {
        mainWindow.webContents.openDevTools();
        console.log('Running in development mode');
        console.log('API URL:', API_URL);
        
        try {
            const electronReload = require('electron-reload');
            electronReload(__dirname, {
                electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
            });
        } catch (error) {
            console.warn('electron-reload not available:', error.message);
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