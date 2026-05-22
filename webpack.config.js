const path = require("path");

module.exports = {
  mode: "production",
  entry: "./js/index.js",
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
