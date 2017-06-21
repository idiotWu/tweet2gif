const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

const joinRoot = path.join.bind(path, __dirname);

module.exports = {
  entry: joinRoot('src/index.ts'),
  resolve: {
    extensions: ['.js', '.ts', '.css'],
  },
  output: {
    path: joinRoot('dist/'),
    filename: 'tweet2gif.user.js',
  },
  module: {
    rules: [{
      test: /\.ts$/,
      use: [ 'ts-loader' ],
      include: [
        joinRoot('src'),
      ],
    }],
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.BannerPlugin({
      raw: true,
      banner:
`// ==UserScript==
// @name         tweet2gif
// @namespace    http://tampermonkey.net/
// @version      ${pkg.version}
// @description  ${pkg.description}
// @author       ${pkg.author}
// @match        https://twitter.com/**
// @grant        none
// ==/UserScript==
`
    })
  ],
}
