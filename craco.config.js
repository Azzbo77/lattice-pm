module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        // Disable Node core-module polyfills in the browser bundle.
        // bcryptjs can still work via browser-native crypto APIs.
        crypto: false,
        buffer: false,
        stream: false,
        vm: false,
      };

      return webpackConfig;
    },
  },
};
