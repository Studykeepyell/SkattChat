import path from 'path';
import webpack from 'webpack';
import dotenv from 'dotenv';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import pathBrowserify from 'path-browserify';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const env = dotenv.config().parsed || {};

export default {
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
            "path": path.resolve(__dirname, '../node_modules/path-browserify/index.js'),
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