const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {ProvidePlugin, EnvironmentPlugin} = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Spectrum Viewer Tool',
            template: 'index.html',
            favicon: './favicon.ico'
        }),
        new EnvironmentPlugin(
            ['DEPLOYMENT_TYPE']
        )
    ],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        assetModuleFilename: '[hash][ext][query]',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'ify-loader'
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    }
};
