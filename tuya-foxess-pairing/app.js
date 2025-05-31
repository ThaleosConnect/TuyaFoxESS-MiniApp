// Create global E object for direct mapping to Tuya APIs BEFORE App initialization
// This ensures it's available immediately when the app starts
globalThis.E = {};

// Basic Bluetooth operations
E.openBluetoothAdapter = function(options) {
  console.log('Calling ty.openBluetoothAdapter');
  return ty.openBluetoothAdapter(options);
};

E.startBluetoothDevicesDiscovery = function(options) {
  return ty.startBluetoothDevicesDiscovery(options);
};

E.stopBluetoothDevicesDiscovery = function(options) {
  return ty.stopBluetoothDevicesDiscovery(options);
};

E.onBluetoothDeviceFound = function(callback) {
  return ty.onBluetoothDeviceFound(callback);
};

// BLE device operations
E.connectBLEDevice = function(options) {
  return ty.connectBLEDevice(options);
};

E.getBLEDeviceServices = function(options) {
  return ty.getBLEDeviceServices(options);
};

E.getBLEDeviceCharacteristics = function(options) {
  return ty.getBLEDeviceCharacteristics(options);
};

E.writeBLECharacteristicValue = function(options) {
  return ty.writeBLECharacteristicValue(options);
};

E.readBLECharacteristicValue = function(options) {
  return ty.readBLECharacteristicValue(options);
};

E.notifyBLECharacteristicValueChange = function(options) {
  return ty.notifyBLECharacteristicValueChange(options);
};

E.onBLECharacteristicValueChange = function(callback) {
  return ty.onBLECharacteristicValueChange(callback);
};

E.closeBLEConnection = function(options) {
  return ty.closeBLEConnection(options);
};

E.closeBluetoothAdapter = function(options) {
  return ty.closeBluetoothAdapter(options);
};

// UI functions
E.showLoading = function(options) {
  return ty.showLoading(options);
};

E.hideLoading = function(options) {
  return ty.hideLoading(options);
};

E.showToast = function(options) {
  return ty.showToast(options);
};

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

  // Verify compatibility layer is available
  verifyBluetoothLayer: function() {
    // Just a verification function - we already initialized the E object outside
    console.log('Verifying Bluetooth compatibility layer');
    if (typeof E === 'undefined' || !E.openBluetoothAdapter) {
      console.error('E object not properly initialized');
    } else {
      console.log('E compatibility layer is ready');
    }
  },

  // App lifecycle - called when app launches
  onLaunch: function() {
    console.log('App launched');
    
    // Verify Tuya BLE compatibility layer is set up
    this.verifyBluetoothLayer();
    
    // Check Bluetooth capability
    try {
      ty.bluetoothCapabilityIsSupport({
        success: (res) => {
          if (res.isSupport) {
            console.log('Bluetooth is supported on this device');
            
            // Initialize Bluetooth adapter
            ty.openBluetoothAdapter({
              success: (res) => {
                console.log('Bluetooth adapter opened successfully');
              },
              fail: (err) => {
                console.error('Failed to open Bluetooth adapter:', err);
              }
            });
          } else {
            console.error('Bluetooth is not supported on this device');
          }
        },
        fail: (err) => {
          console.error('Failed to check Bluetooth capability:', err);
        }
      });
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
    }
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
