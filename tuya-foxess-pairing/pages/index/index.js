// Index page for FoxESS Pairing Mini App
Page({
  data: {
    isBluetoothAvailable: false
  },

  // Start the pairing process
  onStartPairing: function() {
    if (!this.data.isBluetoothAvailable) {
      wx.showToast({
        title: 'Please enable Bluetooth',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // Navigate to scan page
    wx.navigateTo({
      url: '/pages/scan/scan'
    });
  },

  // Check if Bluetooth is available
  checkBluetoothAvailability: function() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        isBluetoothAvailable: systemInfo.bluetoothEnabled
      });
    } catch (error) {
      console.error('Error checking Bluetooth availability:', error);
      this.setData({
        isBluetoothAvailable: false
      });
    }
  },

  // Lifecycle function - called when page loads
  onLoad: function() {
    console.log('Index page loaded');
    this.checkBluetoothAvailability();
  },

  // Lifecycle function - called when page is initially rendered
  onReady: function() {
    console.log('Index page ready');
  },

  // Lifecycle function - called when page show
  onShow: function() {
    console.log('Index page shown');
    this.checkBluetoothAvailability();
  },

  // Lifecycle function - called when page hide
  onHide: function() {
    console.log('Index page hidden');
  },

  // Lifecycle function - called when page unload
  onUnload: function() {
    console.log('Index page unloaded');
  }
});
