const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Point to the correct releases directory where electron-builder outputs files
const DOWNLOADS_DIR = path.join(__dirname, '../../dist/releases');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Update platform mapping to match electron-builder output naming
const platformMap = {
    'windows': 'SkattChat-Setup-1.0.0.exe',
    'mac': 'Skychat.dmg',
    'linux': 'Skychat.AppImage'
};

// Add default app.asar if it doesn't exist
const defaultAsar = path.join(DOWNLOADS_DIR, 'app.asar');
if (!fs.existsSync(defaultAsar)) {
    fs.writeFileSync(defaultAsar, ''); // Create empty file as placeholder
}

// List all files in downloads directory
router.get('/list', (req, res) => {
    try {
        const files = fs.readdirSync(DOWNLOADS_DIR);
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Update routes to match API_CONFIG endpoints
router.get('/latest/:platform/verify', (req, res) => {
    const { platform } = req.params;

    const filename = platformMap[platform.toLowerCase()];
    if (!filename) {
        return res.status(400).json({ 
            available: false,
            error: 'Invalid platform' 
        });
    }

    const filePath = path.join(DOWNLOADS_DIR, platform.toLowerCase(), filename);
    const asarPath = path.join(DOWNLOADS_DIR, 'app.asar');

    // Check if either the platform-specific file or app.asar exists
    const fileExists = fs.existsSync(filePath);
    const asarExists = fs.existsSync(asarPath);

    res.json({
        available: fileExists || asarExists,
        filename: fileExists ? filename : 'app.asar',
        fallback: !fileExists && asarExists
    });
});

router.get('/latest/:platform', (req, res) => {
    const { platform } = req.params;
    const filename = platformMap[platform.toLowerCase()];
    
    if (!filename) {
        return res.status(400).json({ error: 'Invalid platform' });
    }

    const filePath = path.join(DOWNLOADS_DIR, filename);
    
    // Add debug logging
    console.log('Download requested:', {
        platform,
        filename,
        filePath,
        exists: fs.existsSync(filePath),
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
    });

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Download not available' });
    }

    // Set proper headers for binary file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    // Stream the file instead of loading it all into memory
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    });
});

module.exports = router;