require('dotenv').config();

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // Use preload for safe integration
            contextIsolation:false
        }
    });

    // Point Electron to the built HTML file
mainWindow.loadURL('http://localhost:3000'||'https://skattchat.online');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});




app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
