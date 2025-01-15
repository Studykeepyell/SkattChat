const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// Common configuration for both main and renderer processes
const commonElectronConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
    ignoreWarnings: [
        /Module not found: Error: Can't resolve 'fsevents'/,
        /Conflicting values for 'process.env.NODE_ENV'/
    ],
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
        fallback: {
            path: require.resolve('path-browserify'),
            stream: require.resolve('stream-browserify'),
            buffer: require.resolve('buffer'),
            fs: false,
            fsevents: false
        }
    }
};

// Main process configuration
const mainConfig = merge(common, commonElectronConfig, {
    target: 'electron-main',
    entry: {
        main: path.resolve(process.cwd(), 'electron/main.ts')
    },
    output: {
        filename: 'main.bundle.cjs',
        path: path.resolve(process.cwd(), 'electron/dist'),
        clean: false
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['**/*'],
            cleanStaleWebpackAssets: false
        })
    ],
    optimization: {
        runtimeChunk: false,
        splitChunks: false,
        minimize: false
    },
    node: {
        __dirname: false,
        __filename: false,
    },
    externals: {
        electron: 'electron',
        fsevents: "require('fsevents')"
    }
});

// Preload process configuration
const preloadConfig = merge(common, commonElectronConfig, {
    target: 'electron-preload',
    entry: {
        preload: path.resolve(process.cwd(), 'electron/preload.ts')
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(process.cwd(), 'electron/dist'),
        clean: false
    },
    optimization: {
        runtimeChunk: false,
        splitChunks: false
    },
    externals: {
        electron: 'electron'
    }
});

// Renderer process configuration
const rendererConfig = merge(common, commonElectronConfig, {
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
    optimization: {
        runtimeChunk: {
            name: 'runtime'
        }
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
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/video-call.html'),
            filename: 'pages/video-call.html',
            chunks: ['vendors', 'runtime', 'videoCall']
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(process.cwd(), 'src/pages/explore.html'),
            filename: 'pages/explore.html',
            chunks: ['vendors', 'runtime', 'explore']
        }),
        new CopyWebpackPlugin({
            patterns: [
                // Copy directories
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
                },
                // Copy electron-specific files
                {
                    from: path.resolve(process.cwd(), 'electron/src/assets'),
                    to: path.resolve(process.cwd(), 'electron/dist/assets'),
                    noErrorOnMissing: true
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
});

module.exports = [mainConfig, preloadConfig, rendererConfig]; 