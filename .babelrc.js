module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Target Chrome 52 specifically
        targets: {
          chrome: '52'
        },
        // Use core-js 3 for polyfills
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: true
        },
        // Ensure all necessary transforms are applied
        modules: false, // Let Rollup handle modules
        // Enable debugging to see what transforms are applied
        debug: process.env.DEBUG === 'true'
      }
    ]
  ]
};

