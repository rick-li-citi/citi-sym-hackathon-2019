var webpack = require('webpack');
var path = require("path"),
  CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  watch: true,
  entry: {
    // babelPolyfill: 'babel-polyfill',
    controller: path.resolve(__dirname, "./src/js/controller.js")
  },
  output: {
    path: path.resolve(__dirname),
    filename: "[name].bundle.js"
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      }
    ],
    // preLoaders: [
    //   { test: /\.jsx?$/, loader: 'eslint', exclude: /node_modules/ }
    // ],
    // loaders: [
    //   { test: /\.css$/, loader: "style!css" },
    //   {
    //     test: /\.jsx?$/,
    //     // exclude: /node_modules/,
    //     loader: 'babel',
    //     query: {
    //       presets: ['es2015'],
    //       plugins: ['transform-object-rest-spread'],
    //     }
    //   },
    //   { test: /\.(jpe?g|png|gif|svg)$/i, loader: 'url?limit=10000!img?progressive=true' },
    //   { test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/font-woff' },
    //   { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/octet-stream' },
    //   { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file' },
    //   { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=image/svg+xml' }
    // ]
  },
  // resolve: {
  //   extensions: ['', '.js', '.jsx']
  // },
  // eslint: {
  //   configFile: './.eslintrc',
  //   failOnWarning: false,
  //   failOnError: false,
  // },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'), // Tells React to build in either dev or prod modes. https://facebook.github.io/react/downloads.html (See bottom)
      __DEV__: true
    }),
    new CopyWebpackPlugin([{
      from: './src/html'
    }]),
    
    new CopyWebpackPlugin([{
      from: './bundle.json'
    }]),
    new CopyWebpackPlugin([{
      from: './src/img', to: 'img'
    }]),
  ],
  devServer: {
    publicPath: path.resolve(__dirname, '/'),
    contentBase: path.resolve(__dirname, '/'),
    port: 4000,
    inline: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  }
};
