const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const pathBrowserify = require('path-browserify');

// Load env vars
const env = dotenv.config().parsed || {};

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
                test: /\.css$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            modules: {
                                auto: true
                            }
                        }
                    }
                ]
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
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(env)
        }),
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