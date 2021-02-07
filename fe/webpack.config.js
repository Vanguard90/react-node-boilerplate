/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  // Create different index.html for streamable and vimeo
  template: path.join(__dirname, "/src/html/index.html"),
  filename: "index.html",
  inject: "body",
});

const copyWebpackPluginConfig = new CopyPlugin([
  { from: "./public", to: "./" },
]);

const processPluginConfig = new webpack.DefinePlugin({
  // Make the environmental variables available throughout the app
  "process.env": {
    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
  },
});

module.exports = (env, options) => {
  console.log(`--- Webpack is running in ${options.mode} mode ---`);
  const selectedModeIsProd = options.mode === "production" ? true : false;
  return {
    devServer: {
      host: "localhost",
      port: "8080",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      historyApiFallback: true,
      public: publicUrl,
    },
    entry: [path.join(__dirname, "/src/index.tsx")],
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
          exclude: /node_modules/,
          loaders: ["awesome-typescript-loader"],
        },
        {
          test: /\.scss$|\.css$/,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: "[name]__[local]--[hash:base64:5]",
                  getLocalIdent: (
                    loaderContext,
                    localIdentName,
                    localName,
                    options
                  ) => {
                    // If you want to make sure something is not modularized, put them here
                  },
                },
              },
            },
            {
              loader: "sass-loader",
            },
          ],
        },
        {
          test: /\.(jpe?g|png|gif|svg|ttf|woff|woff2)$/i,
          loader: "url-loader",
          options: {
            esModule: false,
            limit: 10000,
          },
        },
      ],
    },
    devtool: selectedModeIsProd ? "" : "source-map",
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    plugins: selectedModeIsProd
      ? [
          new CleanWebpackPlugin({ verbose: true }),
          HTMLWebpackPluginConfig,
          copyWebpackPluginConfig,
          processPluginConfig,
        ]
      : [HTMLWebpackPluginConfig, copyWebpackPluginConfig, processPluginConfig],
    output: {
      filename: "[name].[contenthash].js",
      // chunkFilename: '[name].bundle.js',
      path: path.join(__dirname, "/build"),
    },
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()],
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js
              // or node_modules/packageName
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];

              // npm package names are URL-safe, but some servers don't like @ symbols
              return `npm.${packageName.replace("@", "")}`;
            },
          },
        },
      },
    },
  };
};
