const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load env vars
const env = dotenv.config().parsed || {};

module.exports = {
    module: {
        rules: [
            /*
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            */
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg|gif|svg|woff|woff2|eot|ttf|otf)$/,
                type: 'asset/resource',
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.json'],
        fallback: {
            "path": require.resolve("path-browserify"),
            "fs": false
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(env)
        })
    ]
};