const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const pathBrowserify = require('path-browserify');

// Load env vars
const env = {
    ...process.env,
    ...dotenv.config().parsed,
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_URL: process.env.NODE_ENV === 'production' ? 'https://skattchat.online' : ''
};

// Stringify all values
const stringifiedEnv = {
    'process.env': Object.keys(env).reduce((acc, key) => {
        acc[key] = JSON.stringify(env[key]);
        return acc;
    }, {})
};

module.exports = {
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif|svg|woff|woff2|eot|ttf|otf)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 8 * 1024 // 8kb - inline smaller files
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: {
            '@shared': path.resolve(process.cwd(), 'shared'),
            '@electron': path.resolve(process.cwd(), 'electron/src'),
            '@web': path.resolve(process.cwd(), 'public')
        },
        fallback: {
            "path": require.resolve('path-browserify'),
            "fs": false,
            "crypto": false
        }
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin(stringifiedEnv),
        new webpack.ProgressPlugin()
    ],
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    cache: {
        type: 'filesystem' // Enable filesystem caching
    }
}; 