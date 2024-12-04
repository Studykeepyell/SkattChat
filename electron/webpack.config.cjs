const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const os = require('os'); // Add missing os import

// Load env vars
const env = dotenv.config().parsed || {};

const isDev = process.env.NODE_ENV === 'development';
const safeTemp = path.join(os.tmpdir(), 'electron-build-cache');

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: './src/scripts/chat-main.js',
    target: 'web',
    output: {
        filename: 'chat.bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js'],
        modules: [
            'node_modules'
        ],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@chat': path.resolve(__dirname, 'src/scripts/chat'),
            '@utils': path.resolve(__dirname, 'src/scripts/utils')
        },
        fallback: {
            "path": false,
            "fs": false,
            "os": false
        }
    },
    experiments: {
        topLevelAwait: true
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        }]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(env)
        }),
        new webpack.ProvidePlugin({
            io: ['socket.io-client', 'default']
        })
    ],
    stats: {
        errorDetails: true
    },
    node: {
        __dirname: false,
        __filename: false
    },
    optimization: {
        minimize: false // For debugging
    }
};