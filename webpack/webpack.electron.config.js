// webpack/webpack.electron.js
const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = [
  // Main process configuration
  merge(common, {
    mode: 'production',
    entry: {
      main: path.resolve(__dirname, '../electron/main.cjs'),
    },
    output: {
      path: path.resolve(__dirname, '../electron/dist'),
      filename: '[name].bundle.cjs',
      clean: true,
    },
    target: 'electron-main',
    node: {
      __dirname: false,
      __filename: false,
    },
  }),
  // Renderer process configuration
  merge(common, {
    mode: 'production',
    entry: {
      renderer: path.resolve(__dirname, '../electron/src/scripts/login.js'),
    },
    output: {
      path: path.resolve(__dirname, '../electron/dist'),
      filename: '[name].bundle.js',
      clean: true,
    },
    target: 'electron-renderer',
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, '../electron/src/pages'),
            to: 'pages',
          },
          {
            from: path.resolve(__dirname, '../electron/src/styles'),
            to: 'styles',
          },
          {
            from: path.resolve(__dirname, '../electron/src/assets'),
            to: 'assets',
          },
          {
            from: path.resolve(__dirname, '../electron/preload.js'),
            to: 'preload.js',
          },
        ],
      }),
      new webpack.DefinePlugin({
        IS_ELECTRON: JSON.stringify(true),
      }),
    ],
    node: {
      __dirname: false,
      __filename: false,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      electron: '25.2.0', // Replace with your Electron version
                    },
                  },
                ],
              ],
            },
          },
        },
      ],
    },
  }),
];