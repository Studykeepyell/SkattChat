const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'development',
  entry: {
    // Main pages
    login: path.resolve(process.cwd(), 'src/scripts/pages/AuthPages/LoginPage.ts'),
    register: path.resolve(process.cwd(), 'src/scripts/pages/AuthPages/RegisterPage.ts'),
    chat: path.resolve(process.cwd(), 'src/scripts/pages/ChatPage.ts'),
    friends: path.resolve(process.cwd(), 'src/scripts/pages/FriendsPage.ts'),
    account: path.resolve(process.cwd(), 'src/scripts/pages/AccountPage.ts'),
  },
  output: {
    path: path.resolve(process.cwd(), 'public/dist'),
    filename: '[name].bundle.js',
    clean: true,
    publicPath: '/dist/'
  },
  target: 'web',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.resolve(process.cwd(), 'tsconfig.json'),
            compilerOptions: {
              module: 'esnext',
              moduleResolution: 'node'
            }
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      '@shared': path.resolve(process.cwd(), 'shared'),
      '@electron': path.resolve(process.cwd(), 'electron/src'),
      '@web': path.resolve(process.cwd(), 'public')
    },
  },
  devServer: {
    static: {
      directory: path.join(process.cwd(), 'public'),
      publicPath: '/'
    },
    hot: false,
    liveReload: false,
    client: {
      overlay: false,
      progress: false,
      reconnect: false
    },
    port: 3000,
    historyApiFallback: {
      rewrites: [
        { from: /^\/pages\/.*/, to: '/pages/index.html' },
        { from: /./, to: '/pages/login.html' }
      ]
    },
    devMiddleware: {
      writeToDisk: true,
    },
    watchFiles: false,
    proxy: [{
      context: ['/api', '/socket.io'],
      target: 'http://localhost:3000',
      ws: true
    }],
    open: true,
    compress: true
  },
  plugins: [
    // HTML templates for each page
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/login.html'),
      filename: 'pages/login.html',
      chunks: ['vendors', 'runtime', 'login']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/register.html'),
      filename: 'pages/register.html',
      chunks: ['vendors', 'runtime', 'register']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/chat.html'),
      filename: 'pages/chat.html',
      chunks: ['vendors', 'runtime', 'chat']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/addFriend.html'),
      filename: 'pages/addFriend.html',
      chunks: ['vendors', 'runtime', 'friends']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/account.html'),
      filename: 'pages/account.html',
      chunks: ['vendors', 'runtime', 'account']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/settings.html'),
      filename: 'pages/settings.html',
      chunks: ['vendors', 'runtime', 'settings']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/help.html'),
      filename: 'pages/help.html',
      chunks: ['vendors', 'runtime', 'help']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/navigate.html'),
      filename: 'pages/navigate.html',
      chunks: ['vendors', 'runtime', 'navigate']
    }),
    new CopyWebpackPlugin({
      patterns: [
        // Copy directories
        {
          from: path.resolve(process.cwd(), 'src/assets'),
          to: path.resolve(process.cwd(), 'public/dist/assets'),
          noErrorOnMissing: true
        },
        {
          from: path.resolve(process.cwd(), 'src/styles'),
          to: path.resolve(process.cwd(), 'public/dist/styles'),
          noErrorOnMissing: true
        },
        {
          from: path.resolve(process.cwd(), 'src/resources'),
          to: path.resolve(process.cwd(), 'public/dist/resources'),
          noErrorOnMissing: true
        },
        // Copy favicon
        {
          from: path.resolve(process.cwd(), 'src/favicon.ico'),
          to: path.resolve(process.cwd(), 'public/dist'),
          noErrorOnMissing: true
        },
        // Preserve download directory
        {
          from: path.resolve(process.cwd(), 'public/download'),
          to: path.resolve(process.cwd(), 'public/dist/download'),
          noErrorOnMissing: true
        }
      ],
    })
  ],
}); 