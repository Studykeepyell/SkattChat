import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directories = [
    'dist',
    'dist/pages',
    'dist/assets',
    'dist/styles',
    'electron/dist'
];

directories.forEach(dir => {
    const fullPath = path.join(path.resolve(__dirname, '..'), dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created directory: ${fullPath}`);
    }
});

console.log('All directories created successfully!'); 