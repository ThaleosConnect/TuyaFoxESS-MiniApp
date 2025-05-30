// Scan page for FoxESS Pairing Mini App
Page({
  data: {
    scanning: false,
    devices: [],
    selectedDevice: null
  },

  // Start scanning for Bluetooth devices
  startScan: function() {
    this.setData({
      scanning: true,
      devices: []
    });

    wx.showLoading({
      title: 'Scanning...',
      mask: false // Changed from true to allow interaction with back button
    });

    // Using wx.getBLEDevices API to scan for devices
    wx.openBluetoothAdapter({
      success: (res) => {
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true, // Allow RSSI updates
          success: (res) => {
            console.log('Started scanning for devices:', res);
            
            // Listen for devices found
            wx.onBluetoothDeviceFound((res) => {
              const devices = res.devices.map(device => {
                // Better filtering for FoxESS devices:
                // 1. Check name pattern
                // 2. Check for FoxESS signature in advertisData if available
                const advertisDataHex = Array.from(new Uint8Array(device.advertisData || new ArrayBuffer(0)))
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('');
                
                const isFoxEss = 
                  // Check name (common patterns)
                  (device.name && (/^FOX/i.test(device.name) || device.name.includes('FoxESS'))) ||
                  // Check for 55AA header in advertisData (FoxESS protocol marker)
                  advertisDataHex.includes('55aa') ||
                  // Look for service 00FF in the list
                  (device.advertisServiceUUIDs && device.advertisServiceUUIDs.some(uuid => uuid.toLowerCase().includes('00ff')));
                
                if (isFoxEss) {
                  return {
                    deviceId: device.deviceId,
                    name: device.name || 'Unknown FoxESS Device',
                    RSSI: device.RSSI || 0,
                    advertisData: device.advertisData
                  };
                }
                return null;
              }).filter(Boolean);

              // Add new devices to the list
              if (devices.length > 0) {
                const currentDevices = this.data.devices;
                const updatedDevices = [...currentDevices];
                
                devices.forEach(newDevice => {
                  const existingIndex = updatedDevices.findIndex(d => d.deviceId === newDevice.deviceId);
                  if (existingIndex >= 0) {
                    updatedDevices[existingIndex] = newDevice;
                  } else {
                    updatedDevices.push(newDevice);
                  }
                });

                this.setData({
                  devices: updatedDevices
                });
              }
            });
            
            // Stop scanning after 10 seconds
            setTimeout(() => {
              this.stopScan();
            }, 10000);
          },
          fail: (error) => {
            console.error('Failed to start scanning:', error);
            wx.hideLoading();
            this.setData({ scanning: false });
            
            wx.showToast({
              title: 'Failed to start scan',
              icon: 'none',
              duration: 2000
            });
          }
        });
      },
      fail: (error) => {
        console.error('Failed to open Bluetooth adapter:', error);
        wx.hideLoading();
        this.setData({ scanning: false });
        
        wx.showToast({
          title: 'Please enable Bluetooth',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // Stop scanning for devices
  stopScan: function() {
    try {
      wx.stopBluetoothDevicesDiscovery({
        success: (res) => {
          console.log('Stopped scanning for devices');
        },
        complete: () => {
          // Always hide loading and update state even if stopping scan fails
          wx.hideLoading();
          this.setData({ scanning: false });
        }
      });
    } catch (error) {
      console.error('Error stopping scan:', error);
      // Make sure to hide loading and update state even if an exception occurs
      wx.hideLoading();
      this.setData({ scanning: false });
    }
  },

  // Select a device and navigate to the config page
  selectDevice: function(e) {
    const deviceId = e.currentTarget.dataset.deviceId;
    const selectedDevice = this.data.devices.find(d => d.deviceId === deviceId);
    
    if (selectedDevice) {
      // Store selected device in global data
      const pages = getCurrentPages();
      const app = getApp();
      app.globalData.selectedDevice = selectedDevice;
      
      wx.navigateTo({
        url: '/pages/config/config'
      });
    }
  },

  // Go back to the index page
  goBack: function() {
    wx.navigateBack();
  },

  // Lifecycle function - called when page loads
  onLoad: function() {
    console.log('Scan page loaded');
    this.startScan();
  },

  // Lifecycle function - called when page is initially rendered
  onReady: function() {
    console.log('Scan page ready');
  },

  // Lifecycle function - called when page show
  onShow: function() {
    console.log('Scan page shown');
  },

  // Lifecycle function - called when page hide
  onHide: function() {
    console.log('Scan page hidden');
    this.stopScan();
  },

  // Lifecycle function - called when page unload
  onUnload: function() {
    console.log('Scan page unloaded');
    this.stopScan();
  }
});
