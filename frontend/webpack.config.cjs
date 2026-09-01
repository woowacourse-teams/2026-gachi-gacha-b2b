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
  const apiBaseUrl = process.env.B2B_API_BASE_URL ?? '/api/v1';
  const aiApiBaseUrl = process.env.B2B_AI_API_BASE_URL ?? '/api/b2b-ai';
  const backendOrigin =
    process.env.B2B_BACKEND_ORIGIN ?? 'http://127.0.0.1:8080';
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
        __AI_API_BASE_URL__: JSON.stringify(aiApiBaseUrl),
        __USE_MOCK_API__: JSON.stringify(useMockApi),
      }),
    ],
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    devServer: {
      port: 3001,
      hot: true,
      historyApiFallback: true,
      setupMiddlewares: useMockApi
        ? (middlewares) => {
            middlewares.unshift({
              name: 'mock-api-miss',
              path: '/api',
              middleware: (_request, response) => {
                response.statusCode = 503;
                response.setHeader(
                  'Content-Type',
                  'application/json; charset=utf-8',
                );
                response.end(
                  JSON.stringify({
                    message:
                      '개발용 목 API가 요청을 처리하지 못했습니다. 페이지를 새로고침해 주세요.',
                  }),
                );
              },
            });

            return middlewares;
          }
        : undefined,
      proxy: useMockApi
        ? undefined
        : [
            {
              context: ['/api/v1'],
              target: backendOrigin,
            },
            {
              context: ['/api/b2b-ai'],
              target: 'http://127.0.0.1:8787',
            },
          ],
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
