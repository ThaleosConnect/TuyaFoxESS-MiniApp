// App setup
App({
  // Global data accessible throughout the app
  globalData: {
    selectedDevice: null,
    connectionInfo: null,
    wifiCredentials: null,
    pairingToken: null,
    pairingStatus: null
  },

  // App lifecycle - called when app launches
  onLaunch: function() {
    console.log('App launched');
    
    // Initialize BLE if needed
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('Bluetooth adapter opened successfully');
      },
      fail: (err) => {
        console.error('Failed to open Bluetooth adapter:', err);
      }
    });
  },
  
  // App lifecycle - called when app is shown
  onShow: function() {
    console.log('App shown');
  },
  
  // App lifecycle - called when app is hidden
  onHide: function() {
    console.log('App hidden');
  },
  
  // App lifecycle - called when app encounters an error
  onError: function(err) {
    console.error('App error:', err);
  }
});
