const fs = require('fs-extra');
const path = require('path');

async function copyInstallers() {
    const releasesDir = path.join(__dirname, '../dist/releases');
    const downloadDir = path.join(__dirname, '../public/downloads');

    try {
        // Ensure download directory exists
        await fs.ensureDir(downloadDir);

        // Find the installer
        const files = await fs.readdir(releasesDir);
        const installer = files.find(file => file === 'Skychat-Setup.exe');

        if (!installer) {
            throw new Error('Installer not found in releases directory');
        }

        const source = path.join(releasesDir, installer);
        const dest = path.join(downloadDir, installer);

        // Copy installer with progress logging
        console.log(`Copying installer from ${source} to ${dest}`);
        await fs.copy(source, dest);
        
        // Verify file exists and log size
        const stats = await fs.stat(dest);
        console.log(`Successfully copied installer (${stats.size} bytes)`);

    } catch (error) {
        console.error('Error in copyInstallers:', error);
        process.exit(1);
    }
}

copyInstallers();