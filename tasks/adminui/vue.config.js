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
  }
}