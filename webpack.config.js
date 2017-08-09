/**
 * Created by wuhan01 on 2017/8/9.
 */
const webpack = require('webpack');
const path = require('path');
const buildPath = path.resolve(__dirname, 'dist/');
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const StripWhitespace = require('strip-whitespace-plugin');

module.exports = {
    entry: {
        PullToRefresh: './src/index.js'
    },
    output: {
        filename: '[name].js',
        path: buildPath,
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: nodeModulesPath,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['env'],
                            plugins: [
                                'transform-object-assign'
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            output: {
                comments: false
            }
        }),
        new StripWhitespace()
    ]
};