import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDirectories = () => {
    const rootDir = path.resolve(__dirname, '..');
    const publicDownloadDir = path.join(rootDir, 'public', 'download');
    
    // Ensure public/download directory exists
    if (!fs.existsSync(publicDownloadDir)) {
        fs.mkdirSync(publicDownloadDir, { recursive: true });
        console.log('Created public/download directory');
    }
};

// Run when script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    ensureDirectories();
}

export default ensureDirectories;