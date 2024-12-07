const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  // ...existing config...
  output: {
    path: path.resolve(__dirname, 'dist/app'),
    filename: '[name].js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'electron/src/styles', to: 'styles' },
        { from: 'electron/src/scripts', to: 'scripts' },
        { from: 'electron/src/index.html', to: 'index.html' },
        { from: 'electron/preload.js', to: 'preload.js' }
      ]
    })
  ]
};