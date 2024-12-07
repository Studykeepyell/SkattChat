const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const DOWNLOADS_DIR = path.join(PROJECT_ROOT, 'public', 'downloads');
const RELEASES_DIR = path.join(PROJECT_ROOT, 'dist', 'releases');
const DIST_DOWNLOADS_DIR = path.join(PROJECT_ROOT, 'dist', 'web', 'downloads');

// Create necessary directories
[DOWNLOADS_DIR, RELEASES_DIR, DIST_DOWNLOADS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Platform-specific files
const FILES = {
    'SkyChat-Setup.exe': 'Windows Installer',
    'SkyChat.dmg': 'macOS Disk Image',
    'SkyChat.AppImage': 'Linux AppImage',
    'latest.json': 'Update Information'
};

// Create placeholder files if real files don't exist
Object.entries(FILES).forEach(([filename, description]) => {
    const releasePath = path.join(RELEASES_DIR, filename);
    const downloadPath = path.join(DOWNLOADS_DIR, filename);
    
    if (!fs.existsSync(releasePath)) {
        fs.writeFileSync(downloadPath, `Placeholder for ${description}`);
        console.log(`Created placeholder: ${downloadPath}`);
    }
});

// Create latest.json for auto-updates
const latestJson = {
    version: process.env.npm_package_version || '1.0.0',
    files: Object.keys(FILES).filter(f => f !== 'latest.json').map(filename => ({
        url: `downloads/${filename}`,
        filename: filename
    }))
};

fs.writeFileSync(
    path.join(DOWNLOADS_DIR, 'latest.json'),
    JSON.stringify(latestJson, null, 2)
);