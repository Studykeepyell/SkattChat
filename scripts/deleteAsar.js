const fs = require('fs');
const path = require('path');

const asarPath = path.join(__dirname, '..', 'downloads', 'app.asar');

try {
    if (fs.existsSync(asarPath)) {
        fs.unlinkSync(asarPath);
        console.log('app.asar deleted successfully');
    } else {
        console.log('app.asar not found');
    }
} catch (error) {
    console.error('Error deleting app.asar:', error);
}