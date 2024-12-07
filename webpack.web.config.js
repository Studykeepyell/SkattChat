// webpack.web.config.js
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const fs = require('fs');

module.exports = merge(commonConfig, {
    mode: process.env.NODE_ENV || 'development',
    entry: {
        bundle: './public/scripts/index.js',
        'chat-main': './public/scripts/chat-main.js',
        'login': './public/scripts/login.js'
    },
    target: 'web',
    output: {
        path: path.resolve(__dirname, 'dist/web'),
        filename: '[name].js',
        clean: true
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
                                    browsers: [
                                        'last 2 Chrome versions',
                                        'last 2 Firefox versions',
                                        'last 2 Safari versions'
                                    ]
                                }
                            }]
                        ],
                        plugins: ['@babel/plugin-transform-modules-commonjs']
                    }
                }
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                // Copy all static assets
                {
                    from: './public',
                    to: './',
                    globOptions: {
                        dot: true,
                        gitignore: true,
                    }
                },
                // Copy any additional assets if needed
                {
                    from: './assets',
                    to: './assets',
                    noErrorOnMissing: true
                }
            ]
        })
    ]
});