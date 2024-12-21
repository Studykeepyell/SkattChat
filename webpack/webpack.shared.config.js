import path from 'path';
import { merge } from 'webpack-merge';
import common from './webpack.common.js';

export default merge(common, {
    entry: {
        core: './shared/core/index.ts'
    },
    output: {
        path: path.resolve(process.cwd(), 'dist/shared'),
        filename: '[name].[contenthash].js',
        library: {
            type: 'umd',
            name: 'SharedCore'
        },
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: path.resolve(__dirname, '../shared/tsconfig.json')
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    }
}); 