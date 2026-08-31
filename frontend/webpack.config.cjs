const fs = require('node:fs');
const path = require('node:path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

/** @type {import('webpack').ConfigurationFactory} */
module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';
  const apiBaseUrl = process.env.B2B_API_BASE_URL ?? '/api/b2b';
  const useMockApi = process.env.B2B_USE_MSW
    ? process.env.B2B_USE_MSW === 'true'
    : !isProduction;

  return {
    entry: path.resolve(__dirname, 'src/main.tsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'assets/js/[name].[contenthash:8].js',
      chunkFilename: 'assets/js/[name].[contenthash:8].chunk.js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: 'ts-loader',
        },
        {
          test: /\.(png|jpe?g|gif|webp|svg)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 4 * 1024,
            },
          },
          generator: {
            filename: 'assets/images/[name].[contenthash:8][ext]',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'public'),
            to: '.',
            globOptions: {
              ignore: ['**/index.html'],
            },
          },
        ],
      }),
      new webpack.DefinePlugin({
        __API_BASE_URL__: JSON.stringify(apiBaseUrl),
        __USE_MOCK_API__: JSON.stringify(useMockApi),
      }),
    ],
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    devServer: {
      port: 3001,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
    },
  };
};
