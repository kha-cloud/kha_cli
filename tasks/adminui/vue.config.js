module.exports = {
  configureWebpack: {
    target: 'web',
    mode: 'production',
    externals: {
      vue: {
        commonjs: 'vue',
        commonjs2: 'vue',
        amd: 'vue',
        root: 'Vue'  // for browser globals
      }
    },
    // resolve: {
    //   fallback: {
    //     "stream": require.resolve("stream-browserify"),
    //     "string_decoder": require.resolve("string_decoder/"),
    //     "buffer": require.resolve("buffer/")
    //   }
    // },
  }
}