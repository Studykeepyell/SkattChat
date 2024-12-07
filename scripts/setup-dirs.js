const fs = require('fs-extra');
const path = require('path');

const appDir = path.join(__dirname, '../dist/app');
const webDir = path.join(__dirname, '../dist/web');
const electronSrcDir = path.join(__dirname, '../electron/src');

// Create necessary directories
const dirs = [
    'dist/app',
    'dist/web',
    'dist/releases',
    'build'
];

// Ensure directories exist
dirs.forEach(dir => {
    fs.ensureDirSync(path.join(__dirname, '..', dir));
    console.log(`Ensured ${dir} exists`);
});

// Create minimal package.json for the app (remove build config)
const appPackageJson = {
    name: "skattchat",
    version: "1.0.0",
    author: "SkyJin",
    description: "An Electron chat app with both web and desktop versions.",
    main: "main.js",  // Important: This should be relative to the app root
    dependencies: {
        "axios": "^1.7.8",
        "cors": "^2.8.5",
        "socket.io-client": "^4.8.1"
    }
};

// Write app package.json
fs.writeFileSync(
    path.join(appDir, 'package.json'),
    JSON.stringify(appPackageJson, null, 2)
);

// Ensure main.js exists
const mainJsContent = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);
`;

fs.writeFileSync(path.join(appDir, 'main.js'), mainJsContent);

// Copy necessary files and directories
const filesToCopy = [
    { src: 'electron/src/index.html', dest: 'index.html' },
    { src: 'electron/main.cjs', dest: 'main.js' },
    { src: 'electron/preload.js', dest: 'preload.js' },
    { src: 'electron/src/styles', dest: 'styles' },
    { src: 'electron/src/scripts', dest: 'scripts' },
    { src: 'electron/src/pages', dest: 'pages' }
];

filesToCopy.forEach(({ src, dest }) => {
    const sourcePath = path.join(__dirname, '..', src);
    const destPath = path.join(appDir, dest);
    
    if (fs.existsSync(sourcePath)) {
        if (fs.lstatSync(sourcePath).isDirectory()) {
            fs.copySync(sourcePath, destPath);
        } else {
            fs.copySync(sourcePath, destPath);
        }
    } else {
        console.warn(`Warning: Source path not found: ${sourcePath}`);
    }
});

console.log('Setup completed successfully!');