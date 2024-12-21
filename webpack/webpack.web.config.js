// webpack.web.config.js
import path from 'path';
import { merge } from 'webpack-merge';
import common from './webpack.common.js';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

export default merge(common, {
  mode: 'development',
  entry: {
    index: path.resolve(process.cwd(), 'public/scripts/index.ts'),
    login: path.resolve(process.cwd(), 'public/scripts/login.ts'),
    register: path.resolve(process.cwd(), 'public/scripts/register.ts'),
    chat: path.resolve(process.cwd(), 'public/scripts/chat/chat.ts'),
    account: path.resolve(process.cwd(), 'public/scripts/account.ts'),
  },
  output: {
    path: path.resolve(process.cwd(), 'public/dist'),
    filename: '[name].bundle.js',
    clean: true,
  },
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(process.cwd(), 'public/index.html'),
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(process.cwd(), 'public/assets'),
          to: 'assets',
        },
        {
          from: path.resolve(process.cwd(), 'public/styles'),
          to: 'styles',
        },
      ],
    }),
    new webpack.DefinePlugin({
      IS_ELECTRON: JSON.stringify(false),
    }),
  ],
});