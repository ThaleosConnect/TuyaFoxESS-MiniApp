import { createApp } from '@ray-js/core';

// App configuration
const app = createApp({
  // App lifecycle hooks
  onLaunch() {
    console.log('App launched');
  },
  onShow() {
    console.log('App shown');
  },
  onHide() {
    console.log('App hidden');
  },
  onError(error) {
    console.error('App error:', error);
  },
  // Global data
  globalData: {
    selectedDevice: null,
    connectionInfo: null,
    wifiCredentials: null,
    pairingToken: null,
    pairingStatus: null
  }
});

app.run();
