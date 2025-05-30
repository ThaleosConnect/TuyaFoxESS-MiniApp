// Result page for FoxESS Pairing Mini App
// This page shows the result of the WiFi pairing process
Page({
  data: {
    success: false,
    errorMessage: '',
    deviceName: ''
  },

  // Go back to the home page
  goHome: function() {
    wx.navigateBack({
      delta: 2 // Navigate back to index page
    });
  },

  // Check device connection status
  checkDeviceStatus: function() {
    const app = getApp();
    const selectedDevice = app.globalData.selectedDevice;
    const connectionInfo = app.globalData.connectionInfo;
    
    if (!selectedDevice || !connectionInfo) {
      this.setData({
        success: false,
        errorMessage: 'Device information not found'
      });
      return;
    }

    // In a real implementation, you might want to check the actual status 
    // by connecting to the device again and checking its WiFi connection state
    // For now, we'll just assume the connection was successful if we reached this page

    this.setData({
      success: true,
      deviceName: selectedDevice.name || 'FoxESS Inverter',
      deviceDetails: {
        ssid: connectionInfo.ssid,
        macAddress: selectedDevice.deviceId.replace(/:/g, '').toUpperCase()
      }
    });
    
    wx.showToast({
      title: 'Device connected',
      icon: 'success',
      duration: 2000
    });
  },

  // Lifecycle function - called when page loads
  onLoad: function(options) {
    console.log('Result page loaded with options:', options);
    
    // Check if success parameter is present
    if (options && options.success) {
      const success = options.success === 'true';
      
      this.setData({
        success: success,
        errorMessage: options.error || ''
      });
      
      if (success) {
        // If successful, check device status
        this.checkDeviceStatus();
      }
    } else {
      // No success parameter, assume failure
      this.setData({
        success: false,
        errorMessage: 'Unknown error during pairing process'
      });
    }
    
    // Get device info from global data
    const app = getApp();
    const selectedDevice = app.globalData.selectedDevice;
    
    if (selectedDevice) {
      this.setData({
        deviceName: selectedDevice.name || 'FoxESS Inverter'
      });
    }
  },

  // Lifecycle function - called when page is initially rendered
  onReady: function() {
    console.log('Result page ready');
  },

  // Lifecycle function - called when page show
  onShow: function() {
    console.log('Result page shown');
  },

  // Lifecycle function - called when page hide
  onHide: function() {
    console.log('Result page hidden');
  },

  // Lifecycle function - called when page unload
  onUnload: function() {
    console.log('Result page unloaded');
  }
});
