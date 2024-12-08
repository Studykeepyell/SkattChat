// webpack.web.config.js
const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'production', // Use 'development' for development build
  entry: {
    app: path.resolve(__dirname, '../public/scripts/index.js'),
  },
  output: {
    path: path.resolve(__dirname, '../public/dist'),
    filename: '[name].bundle.js',
    clean: true, // Clean the output directory before emit
  },
  target: 'web',
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../public/assets'),
          to: 'assets',
        },
        {
          from: path.resolve(__dirname, '../public/styles'),
          to: 'styles',
        },
      ],
    }),
    new webpack.DefinePlugin({
      IS_ELECTRON: JSON.stringify(false),
    }),
  ],
});