module.exports = {
  // ESBuild configuration to handle JSX in JS files
  build: {
    esbuild: {
      loader: {
        '.js': 'jsx'
      },
      external: [
        '@ray-js/core', 
        '@ray-js/api', 
        '@ray-js/components',
        '@ray-js/panel-sdk',
        '@ray-js/framework'
      ]
    }
  },
  // Mini app name
  name: 'FoxESS Pairing',
  // Mini app description
  description: 'Tuya mini app for pairing with FoxESS hybrid inverters',
  // Entry file
  entry: './app.js',
  // Mini app capabilities
  capabilities: {
    // Enable Bluetooth capability
    'Bluetooth-Adapter': true,
    'Bluetooth-Central': true,
    'Bluetooth-Peripheral': true,
  },
  // Pages configuration
  pages: [
    'pages/index/index',
    'pages/scan/scan',
    'pages/config/config',
    'pages/result/result'
  ],
  // Window configuration
  window: {
    navigationBarTitleText: 'FoxESS Pairing',
    navigationBarBackgroundColor: '#f8f8f8',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8f8f8'
  },
  // Tab bar configuration (optional)
  tabBar: {
    color: '#7A7E83',
    selectedColor: '#3cc51f',
    borderStyle: 'black',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: 'Home'
      },
      {
        pagePath: 'pages/scan/scan',
        text: 'Scan'
      }
    ]
  }
};
