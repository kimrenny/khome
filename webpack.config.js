const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const dotenv = require("dotenv");
const { getRequiredWeatherApiKey } = require("./js/weatherApiConfig");

const envPath = path.resolve(__dirname, ".env");
let localEnvironment = {};

try {
  localEnvironment = dotenv.parse(fs.readFileSync(envPath));
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

const weatherApiKey = getRequiredWeatherApiKey(
  localEnvironment.WEATHER_API_KEY,
);

module.exports = {
  mode: "production",
  entry: "./js/index.js",
  plugins: [
    new webpack.DefinePlugin({
      WEATHER_API_KEY: JSON.stringify(weatherApiKey),
    }),
  ],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  module: {
    rules: [
      {
        test: /\.(webp|png|jpg|jpeg)$/i,
        type: "asset/resource",
      },
    ],
  },
};
