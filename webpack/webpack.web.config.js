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
    app: path.resolve(process.cwd(), 'public/src/index.tsx'),
  },
  output: {
    path: path.resolve(process.cwd(), 'public/dist'),
    filename: '[name].bundle.js',
    clean: true,
    publicPath: '/'
  },
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
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
      '@': path.resolve(process.cwd(), 'public/src'),
    },
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 3000,
    static: {
      directory: path.join(process.cwd(), 'public'),
    },
    proxy: {
      '/api': 'http://localhost:3000',
    },
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
      'process.env': JSON.stringify(process.env),
      IS_ELECTRON: JSON.stringify(false),
    }),
  ],
});