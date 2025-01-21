import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directories = [
    'dist',
    'electron/dist'
];

function cleanDirectory(dir) {
    const fullPath = path.join(path.resolve(__dirname, '..'), dir);
    if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`Cleaned directory: ${fullPath}`);
    }
}

// Clean each directory
directories.forEach(cleanDirectory);

console.log('All directories cleaned successfully!'); 