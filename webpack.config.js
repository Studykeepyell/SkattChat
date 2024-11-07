const path = require('path');

module.exports = {
  entry: './public/client.js', // Use client.js as the single entry point
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
};
