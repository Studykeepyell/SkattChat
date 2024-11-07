const path = require('path');

module.exports = {
  entry: './public/client.js', // Your main JavaScript file
  output: {
    filename: 'bundle.js', // Output filename
    path: path.resolve(__dirname, 'public', 'dist'), // Output directory set to "public/dist"
  },
  mode: 'production',
};
