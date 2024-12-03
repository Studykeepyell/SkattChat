const path = require('path');
const webpack = require('webpack');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
    mode: isDev ? 'development' : 'production',
    entry: {
        login: path.resolve(__dirname, 'src/scripts/login.js'),
        chat: path.resolve(__dirname, 'src/scripts/chat.js')
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'src/dist')
    },
    devtool: 'source-map',
    optimization: {
        minimize: false
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        }]
    },
    resolve: {
        extensions: ['.js'],
        modules: [
            'node_modules',
            path.resolve(__dirname, 'src')
        ],
        alias: {
            '@': path.resolve(__dirname, 'src')
        },
        fallback: {
            "ws": require.resolve('ws'),
            "buffer": require.resolve("buffer/")
        }
    },
    target: 'web',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer']
        })
    ],
    stats: {
        errorDetails: true
    },
    watchOptions: {
        ignored: /node_modules/
    }
};