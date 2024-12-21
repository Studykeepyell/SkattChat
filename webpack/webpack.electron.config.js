import path from 'path';
import { merge } from 'webpack-merge';
import common from './webpack.common.js';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import pathBrowserify from 'path-browserify';
import streamBrowserify from 'stream-browserify';
import buffer from 'buffer';

// Common configuration
const commonElectronConfig = {
    mode: 'development',
    node: {
        __dirname: false,
        __filename: false,
    },
    module: {
        rules: []
    },
    resolve: {
        extensions: ['.js', '.ts'],
        fallback: {
            path: pathBrowserify,
            fs: false
        }
    },
    plugins: []
};

export default [
    // Main process configuration
    merge(common, commonElectronConfig, {
        target: 'electron-main',
        entry: {
            main: path.resolve(process.cwd(), '../electron/main.cjs'),
        },
        output: {
            filename: '[name].bundle.cjs',
            path: path.resolve(process.cwd(), '../electron/dist'),
            libraryTarget: 'commonjs2'
        },
        externals: {
            electron: 'electron'
        },
        module: {
            rules: []
        },
        resolve: {
            extensions: ['.js', '.ts'],
            fallback: {
                path: pathBrowserify,
                fs: false
            }
        },
        plugins: []
    }),

    // Renderer process configuration
    merge(common, commonElectronConfig, {
        target: 'electron-renderer',
        entry: {
            login: path.resolve(process.cwd(), '../electron/src/scripts/login.js'),
            chat: path.resolve(process.cwd(), '../electron/src/scripts/chat-main.js'),
            app: path.resolve(process.cwd(), '../electron/src/scripts/app.js')
            // Remove chat_scripts entry as it's not needed
        },
        experiments: {
            topLevelAwait: true
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(process.cwd(), '../electron/dist'),  // Update back to electron/dist
            publicPath: './'
        },
        resolve: {
            extensions: ['.js', '.json'],
            fallback: {
                "path": pathBrowserify,
                "stream": streamBrowserify,
                "buffer": buffer,
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
                template: path.resolve(process.cwd(), '../electron/src/pages/login.html'),
                filename: 'pages/login.html',  // Add pages/ prefix
                chunks: ['login'],
                minify: {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: false  // This prevents removal of type="text"
                }
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(process.cwd(), '../electron/src/pages/chat.html'),
                filename: 'pages/chat.html',   // Add pages/ prefix
                chunks: ['chat', 'app'],  // Include both chat and app chunks
                minify: {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: false
                }
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(process.cwd(), '../electron/src/pages/account.html'),
                filename: 'pages/account.html',  // Add pages/ prefix
                chunks: ['account']
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(process.cwd(), '../electron/src/pages/addFriend.html'),
                filename: 'pages/addFriend.html',  // Add pages/ prefix
                chunks: ['addFriend']
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(process.cwd(), '../electron/src/pages/help.html'),
                filename: 'pages/help.html',  // Add pages/ prefix
                chunks: ['help']
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(process.cwd(), '../electron/src/pages/settings.html'),
                filename: 'pages/settings.html',  // Add pages/ prefix
                chunks: ['settings']
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(process.cwd(), '../electron/src/pages/navigate.html'),
                filename: 'pages/navigate.html',  // Add pages/ prefix
                chunks: ['navigate']
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(process.cwd(), '../electron/src/pages/register.html'),
                filename: 'pages/register.html',  // Add pages/ prefix
                chunks: ['register']
            }),

            // Copy assets
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(process.cwd(), '../electron/src/assets'),
                        to: path.resolve(process.cwd(), '../electron/dist/assets')  // Absolute path
                    },
                    {
                        from: path.resolve(process.cwd(), '../electron/src/scripts'),  // Fixed 'form' to 'from'
                        to: path.resolve(process.cwd(), '../electron/dist/scripts')  // Absolute path
                    },
                    {
                        from: path.resolve(process.cwd(), '../electron/src/styles'),
                        to: path.resolve(process.cwd(), '../electron/dist/styles')  // Absolute path
                    },
                    {
                        from: path.resolve(process.cwd(), '../electron/preload.js'),
                        to: path.resolve(process.cwd(), '../electron/dist/preload.js')  // Absolute path
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