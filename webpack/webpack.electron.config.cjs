const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Define environment
const isDev = process.env.NODE_ENV === 'development';

// Main process configuration
const mainConfig = {
    mode: isDev ? 'development' : 'production',
    target: 'electron-main',
    entry: path.resolve(process.cwd(), 'electron/main.ts'),
    output: {
        filename: 'main.bundle.cjs',
        path: path.resolve(process.cwd(), 'electron/dist'),
        clean: false,
        library: {
            type: 'commonjs2'
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        compilerOptions: {
                            module: 'commonjs',
                            moduleResolution: 'node',
                            esModuleInterop: true
                        }
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            path: false,
            fs: false
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
                API_URL: JSON.stringify(isDev ? 'http://localhost:3001' : 'https://skattchat.online')
            }
        })
    ],
    externals: {
        electron: 'electron'
    }
};

// Renderer process configuration
const rendererConfig = {
    mode: isDev ? 'development' : 'production',
    target: 'electron-renderer',
    entry: {
        // Main pages
        login: path.resolve(process.cwd(), 'src/scripts/pages/AuthPages/LoginPage.ts'),
        register: path.resolve(process.cwd(), 'src/scripts/pages/AuthPages/RegisterPage.ts'),
        chat: path.resolve(process.cwd(), 'src/scripts/pages/ChatPage.ts'),
        friends: path.resolve(process.cwd(), 'src/scripts/pages/FriendsPage.ts'),
        account: path.resolve(process.cwd(), 'src/scripts/pages/AccountPage.ts'),
        explore: path.resolve(process.cwd(), 'src/scripts/pages/ExplorePage.ts'),
        videoCall: path.resolve(process.cwd(), 'src/scripts/pages/VideoCallPage.ts')
    },
    output: {
        path: path.resolve(process.cwd(), 'electron/dist'),
        filename: '[name].bundle.js',
        clean: false,
        publicPath: './'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        compilerOptions: {
                            module: 'commonjs',
                            moduleResolution: 'node',
                            esModuleInterop: true
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
        }
    },
    plugins: [
        // HTML templates for each page
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/login.html'),
            filename: 'pages/login.html',
            chunks: ['vendors', 'runtime', 'login'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/register.html'),
            filename: 'pages/register.html',
            chunks: ['vendors', 'runtime', 'register'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/chat.html'),
            filename: 'pages/chat.html',
            chunks: ['vendors', 'runtime', 'chat', 'messageInput'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/addFriend.html'),
            filename: 'pages/addFriend.html',
            chunks: ['vendors', 'runtime', 'friends'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/account.html'),
            filename: 'pages/account.html',
            chunks: ['vendors', 'runtime', 'account'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/settings.html'),
            filename: 'pages/settings.html',
            chunks: ['vendors', 'runtime', 'settings'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/help.html'),
            filename: 'pages/help.html',
            chunks: ['vendors', 'runtime', 'help'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/navigate.html'),
            filename: 'pages/navigate.html',
            chunks: ['vendors', 'runtime', 'navigate'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/video-call.html'),
            filename: 'pages/video-call.html',
            chunks: ['vendors', 'runtime', 'videoCall'],
            publicPath: '../'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/explore.html'),
            filename: 'pages/explore.html',
            chunks: ['vendors', 'runtime', 'explore'],
            publicPath: '../'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(process.cwd(), 'src/assets'),
                    to: path.resolve(process.cwd(), 'electron/dist/assets'),
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(process.cwd(), 'src/styles'),
                    to: path.resolve(process.cwd(), 'electron/dist/styles'),
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(process.cwd(), 'src/resources'),
                    to: path.resolve(process.cwd(), 'electron/dist/resources'),
                    noErrorOnMissing: true
                }
            ],
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
                API_URL: JSON.stringify(isDev ? 'http://localhost:3001' : 'https://skattchat.online')
            }
        })
    ],
    optimization: {
        runtimeChunk: {
            name: 'runtime'
        },
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    }
};

// Preload process configuration
const preloadConfig = {
    mode: isDev ? 'development' : 'production',
    target: 'electron-preload',
    entry: path.resolve(process.cwd(), 'electron/preload.ts'),
    output: {
        filename: 'preload.bundle.cjs',
        path: path.resolve(process.cwd(), 'electron/dist'),
        clean: false
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        compilerOptions: {
                            module: 'commonjs',
                            moduleResolution: 'node',
                            esModuleInterop: true,
                            target: 'es2015'
                        }
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            path: false,
            fs: false
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            'process.env.API_URL': JSON.stringify(isDev ? 'http://localhost:3001' : 'https://skattchat.online')
        })
    ],
    externals: {
        electron: 'electron'
    }
};

// Export all configurations
module.exports = [mainConfig, rendererConfig, preloadConfig]; 