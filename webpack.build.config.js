const path = require('path');
const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(commonConfig, {
    mode: 'production',
    entry: {
        main: './electron/main.cjs',
        bundle: './electron/src/scripts/chat-main.js'  // Update this path
    },
    target: 'electron-main',
    output: {
        path: path.resolve(__dirname, 'dist/app'),
        filename: '[name].js',
        clean: true
    },
    optimization: {
        minimize: false
    },
    node: {
        __dirname: false,
        __filename: false
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
                                    electron: '33', // Match your electron version
                                    node: '18'
                                },
                                modules: 'commonjs'
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-transform-runtime'
                        ]
                    }
                }
            }
        ]
    },
    resolve: {
        fallback: {
            "crypto": false,
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer/"),
            "util": require.resolve("util/"),
            "path": require.resolve("path-browserify")
        }
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                // Copy Electron-specific files
                {
                    from: './electron',
                    to: './',
                    globOptions: {
                        ignore: ['**/scripts/**', '**/*.ts', '**/*.map']
                    },
                    filter: (resourcePath) => {
                        const allowedFiles = ['main.cjs', 'preload.js', 'index.html'];
                        const filename = path.basename(resourcePath);
                        return allowedFiles.includes(filename);
                    }
                },
              
                // Copy other assets
                {
                    from: './assets',
                    to: './assets',
                    noErrorOnMissing: true
                },
                // Copy package.json with modifications
                {
                    from: 'package.json',
                    to: './package.json',
                    transform: (content) => {
                        const pkg = JSON.parse(content);
                        return JSON.stringify({
                            name: pkg.name,
                            version: pkg.version,
                            main: "main.js",
                            author: pkg.author,
                            description: pkg.description,
                            dependencies: pkg.dependencies,
                            scripts: {
                                start: "electron ."
                            }
                        }, null, 2);
                    }
                }
            ]
        })
    ],
    externals: {
        'del-cli': 'commonjs del-cli',
        'global-agent': 'commonjs global-agent',
        'jackspeak': 'commonjs jackspeak',
        'has-symbols': 'commonjs has-symbols'
    }
});