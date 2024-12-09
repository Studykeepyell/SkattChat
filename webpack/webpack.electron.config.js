const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { Script } = require('vm');

// Common configuration for both main and renderer processes
const commonElectronConfig = {
  mode: 'production',
  node: {
    __dirname: false,
    __filename: false,
  },
};

module.exports = [
  // Main process configuration
  merge(common, commonElectronConfig, {
    target: 'electron-main',
    entry: {
      main: path.resolve(__dirname, '../electron/main.cjs'),
    },
    output: {
      filename: '[name].bundle.cjs',
      path: path.resolve(__dirname, '../electron/dist'),  // Update back to electron/dist
      libraryTarget: 'commonjs2'
    },
    externals: {
      electron: 'electron'
    },
  }),

  // Renderer process configuration
  merge(common, commonElectronConfig, {
    target: 'electron-renderer',
    entry: {
      login: path.resolve(__dirname, '../electron/src/scripts/login.js'),
      chat: path.resolve(__dirname, '../electron/src/scripts/chat-main.js'),
      app: path.resolve(__dirname, '../electron/src/scripts/app.js')
      // Remove chat_scripts entry as it's not needed
    },
    experiments: {
      topLevelAwait: true
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, '../electron/dist'),  // Update back to electron/dist
      publicPath: './'
    },
    resolve: {
      extensions: ['.js', '.json'],
      fallback: {
        "path": require.resolve("path-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
      }
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
                ['@babel/preset-env', {
                  targets: {
                    electron: '25.2.0'
                  }
                }]
              ],
              plugins: [
                '@babel/plugin-transform-runtime',
                '@babel/plugin-transform-modules-commonjs'
              ]
            }
          }
        }
      ]
    },
    plugins: [
      // HTML templates
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../electron/src/pages/login.html'),
        filename: 'pages/login.html',  // Add pages/ prefix
        chunks: ['login'],
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: false  // This prevents removal of type="text"
        }
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../electron/src/pages/chat.html'),
        filename: 'pages/chat.html',   // Add pages/ prefix
        chunks: ['chat', 'app'],  // Include both chat and app chunks
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: false
        }
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../electron/src/pages/account.html'),
        filename: 'pages/account.html',  // Add pages/ prefix
        chunks: ['account']
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../electron/src/pages/addFriend.html'),
        filename: 'pages/addFriend.html',  // Add pages/ prefix
        chunks: ['addFriend']
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../electron/src/pages/help.html'),
        filename: 'pages/help.html',  // Add pages/ prefix
        chunks: ['help']
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../electron/src/pages/settings.html'),
        filename: 'pages/settings.html',  // Add pages/ prefix
        chunks: ['settings']
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../electron/src/pages/navigate.html'),
        filename: 'pages/navigate.html',  // Add pages/ prefix
        chunks: ['navigate']
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../electron/src/pages/register.html'),
        filename: 'pages/register.html',  // Add pages/ prefix
        chunks: ['register']
      }),

      // Copy assets
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, '../electron/src/assets'),
            to: path.resolve(__dirname, '../electron/dist/assets')  // Absolute path
          },
          {
            from: path.resolve(__dirname, '../electron/src/scripts'),  // Fixed 'form' to 'from'
            to: path.resolve(__dirname, '../electron/dist/scripts')  // Absolute path
          },
          {
            from: path.resolve(__dirname, '../electron/src/styles'),
            to: path.resolve(__dirname, '../electron/dist/styles')  // Absolute path
          },
          {
            from: path.resolve(__dirname, '../electron/preload.js'),
            to: path.resolve(__dirname, '../electron/dist/preload.js')  // Absolute path
          }
        ],
      }),
      new webpack.DefinePlugin({
        IS_ELECTRON: JSON.stringify(true),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      })
    ],
  })
];