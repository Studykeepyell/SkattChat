const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const dirsToClean = [
    'dist',
    'build',
    'public/dist'
];

function cleanDir(dir) {
    return new Promise((resolve) => {
        // On Windows, use rmdir with /s /q for force deletion
        const command = process.platform === 'win32' 
            ? `rmdir /s /q "${dir}"` 
            : `rm -rf "${dir}"`;

        exec(command, (error) => {
            if (error) {
                console.log(`Warning: Could not delete ${dir}:`, error.message);
            }
            resolve();
        });
    });
}

async function cleanup() {
    // Kill any running electron processes
    if (process.platform === 'win32') {
        exec('taskkill /F /IM electron.exe');
    }

    // Wait a moment for processes to close
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clean directories
    await Promise.all(dirsToClean.map(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        return cleanDir(fullPath);
    }));
}

cleanup().then(() => console.log('Cleanup complete'));