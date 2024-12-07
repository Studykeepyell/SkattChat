const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load env vars
const env = dotenv.config().parsed || {};

module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.js'],
        fallback: {
            "path": require.resolve("path-browserify"),
            "fs": false,
            "crypto": false
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(env)
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
        })
    ]
};