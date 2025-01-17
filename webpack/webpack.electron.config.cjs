const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Define environment
const isDev = process.env.NODE_ENV === 'development';

// Shared configuration options
const sharedConfig = {
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'source-map' : false,
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
    }
};

// Main process configuration
const mainConfig = {
    ...sharedConfig,
    target: 'electron-main',
    entry: path.resolve(process.cwd(), 'electron/main.ts'),
    output: {
        filename: 'main.bundle.cjs',
        path: path.resolve(process.cwd(), 'dist'),
        clean: false,
        library: {
            type: 'commonjs2'
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

// Preload process configuration
const preloadConfig = {
    ...sharedConfig,
    target: 'electron-preload',
    entry: path.resolve(process.cwd(), 'electron/preload.ts'),
    output: {
        filename: 'preload.bundle.cjs',
        path: path.resolve(process.cwd(), 'dist'),
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
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            'process.env.API_URL': JSON.stringify(isDev ? 'http://localhost:3001' : 'https://skattchat.online')
        })
    ],
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            path: false,
            fs: false
        }
    },
    externals: {
        electron: 'commonjs2 electron'
    }
};

// Renderer process configuration
const rendererConfig = {
    ...sharedConfig,
    target: 'web',
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
        path: path.resolve(process.cwd(), 'dist'),
        filename: '[name].bundle.js',
        clean: false,
        publicPath: '../'
    },
    module: {
        rules: [
            ...sharedConfig.module.rules,
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: (pathData) => {
                        return `assets/images/${path.basename(pathData.filename)}`;
                    }
                }
            }
        ]
    },
    resolve: {
        ...sharedConfig.resolve,
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            '@': path.resolve(process.cwd(), 'src'),
            '@shared': path.resolve(process.cwd(), 'shared'),
            '@electron': path.resolve(process.cwd(), 'electron/src'),
            '@web': path.resolve(process.cwd(), 'public'),
            '@assets': path.resolve(process.cwd(), 'src/assets')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            global: require.resolve('./polyfills/global.js')
        }),
        // HTML templates for each page
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/login.html'),
            filename: 'pages/login.html',
            chunks: ['runtime', 'vendors', 'login'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/register.html'),
            filename: 'pages/register.html',
            chunks: ['runtime', 'vendors', 'register'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/chat.html'),
            filename: 'pages/chat.html',
            chunks: ['runtime', 'vendors', 'chat'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/addFriend.html'),
            filename: 'pages/addFriend.html',
            chunks: ['runtime', 'vendors', 'friends'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/account.html'),
            filename: 'pages/account.html',
            chunks: ['runtime', 'vendors', 'account'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/settings.html'),
            filename: 'pages/settings.html',
            chunks: ['runtime', 'vendors', 'settings'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/help.html'),
            filename: 'pages/help.html',
            chunks: ['runtime', 'vendors', 'help'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/navigate.html'),
            filename: 'pages/navigate.html',
            chunks: ['runtime', 'vendors', 'navigate'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/video-call.html'),
            filename: 'pages/video-call.html',
            chunks: ['runtime', 'vendors', 'videoCall'],
            publicPath: '../',
            minify: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/explore.html'),
            filename: 'pages/explore.html',
            chunks: ['runtime', 'vendors', 'explore'],
            publicPath: '../',
            minify: false
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(process.cwd(), 'src/assets'),
                    to: path.resolve(process.cwd(), 'dist/assets'),
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(process.cwd(), 'src/styles'),
                    to: path.resolve(process.cwd(), 'dist/styles'),
                    noErrorOnMissing: true
                }
            ]
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

// Export all configurations
module.exports = [mainConfig, preloadConfig, rendererConfig]; 