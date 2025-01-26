const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const isDev = process.env.NODE_ENV === 'development';
const API_URL = isDev ? 'http://localhost:3001' : 'https://skattchat.online';

// Define environment variables for the frontend
const FRONTEND_ENV = {
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
};

module.exports = merge(common, {
  mode: 'development',
  entry: {
    // Main pages
    login: path.resolve(process.cwd(), 'src/scripts/pages/AuthPages/LoginPage.ts'),
    register: path.resolve(process.cwd(), 'src/scripts/pages/AuthPages/RegisterPage.ts'),
    chat: path.resolve(process.cwd(), 'src/scripts/pages/ChatPage.ts'),
    friends: path.resolve(process.cwd(), 'src/scripts/pages/FriendsPage.ts'),
    account: path.resolve(process.cwd(), 'src/scripts/pages/AccountPage.ts'),
    explore: path.resolve(process.cwd(), 'src/scripts/pages/ExplorePage.ts'),
    videoCall: path.resolve(process.cwd(), 'src/scripts/pages/VideoCallPage.ts'),
    
    // Rhythm Game entries
    'game/endscreen': path.resolve(process.cwd(), 'src/RythtmGame/endscreen.js'),
    'game/gamescreen': path.resolve(process.cwd(), 'src/RythtmGame/gamescreen.js'),
    'game/startscreen': path.resolve(process.cwd(), 'src/RythtmGame/startscreen.js'),
    'game/levels': path.resolve(process.cwd(), 'src/RythtmGame/levels.js'),
    
    // Download related entries
    downloadHandler: path.resolve(process.cwd(), 'public/download/download-handler.ts'),
    apiConfig: path.resolve(process.cwd(), 'public/download/api.config.ts'),
    downloadInit: path.resolve(process.cwd(), 'public/download/init.ts'),
    downloadButtons: path.resolve(process.cwd(), 'public/download/download-buttons.ts'),
  },
  output: {
    path: path.resolve(process.cwd(), 'public/dist'),
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    publicPath: '/dist/',
    clean: true
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          enforce: true
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: -20,
          reuseExistingChunk: true,
          enforce: true
        }
      },
    }
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
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-transform-class-properties'
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: false
            }
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'resources/visuals/[name][ext]',
        },
      },
      {
        test: /\.(mp3|wav|m4a)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'resources/songs/[name][ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
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
      publicPath: '/',
    },
    hot: true,
    liveReload: false,
    client: {
      overlay: true,
      progress: true,
      reconnect: true,
    },
    port: 3000,
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true,
    },
    proxy: [{
      context: ['/api', '/socket.io'],
      target: 'http://backend:3001',  // Use container name for internal routing
      changeOrigin: true,
      ws: true
    }],
    watchFiles: ['src/**/*'],
    hot: 'only',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin(FRONTEND_ENV),
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
      chunks: ['vendors', 'runtime', 'chat', 'messageInput']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/addFriend.html'),
      filename: 'pages/addFriend.html',
      chunks: ['vendors', 'runtime', 'friends']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/account.html'),
      filename: 'pages/account.html',
      chunks: ['runtime', 'vendors', 'common', 'account']
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
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/video-call.html'),
      filename: 'pages/video-call.html',
      chunks: ['vendors', 'runtime', 'videoCall']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/RythtmGame/index.html'),
      filename: 'game/index.html',
      chunks: ['runtime', 'vendors', 'game/startscreen', 'game/styles/startscreen']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/RythtmGame/gamescreen.html'),
      filename: 'game/gamescreen.html',
      chunks: ['runtime', 'vendors', 'game/gamescreen']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/RythtmGame/endscreen.html'),
      filename: 'game/endscreen.html',
      chunks: ['runtime', 'vendors', 'game/endscreen', 'game/styles/endscreen']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'src/pages/explore.html'),
      filename: 'pages/explore.html',
      chunks: ['runtime', 'vendors', 'explore']
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
        },
        {
          from: path.resolve(process.cwd(), 'src/RythtmGame/resources'),
          to: path.resolve(process.cwd(), 'public/dist/resources'),
          noErrorOnMissing: true
        }
      ],
    })
  ],
}); 