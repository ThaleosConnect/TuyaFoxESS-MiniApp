// Config page for FoxESS Pairing Mini App
import { crc16 } from '../../utils/crc16';

Page({
  data: {
    ssid: '',
    password: '',
    connecting: false,
    statusMessage: 'Ready to connect',
    connectionStatus: 'disconnected'
  },

  // Input handlers for SSID and password
  onSsidInput: function(e) {
    this.setData({
      ssid: e.detail.value
    });
  },

  onPasswordInput: function(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // Submit form to configure Wi-Fi on the device
  submitForm: function(e) {
    const { ssid, password } = e.detail.value;
    
    if (!ssid || !password) {
      wx.showToast({
        title: 'Please enter both SSID and password',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.connectDevice(ssid, password);
  },

  // Connect to the selected device and configure Wi-Fi
  connectDevice: function(ssid, password) {
    const app = getApp();
    const selectedDevice = app.globalData.selectedDevice;
    
    if (!selectedDevice) {
      wx.showToast({
        title: 'No device selected',
        icon: 'none',
        duration: 2000
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
      
      return;
    }

    this.setData({
      connecting: true,
      statusMessage: 'Connecting to device...',
      connectionStatus: 'connecting'
    });

    wx.showLoading({
      title: 'Connecting...',
      mask: true
    });

    // Connect to the BLE device
    wx.createBLEConnection({
      deviceId: selectedDevice.deviceId,
      success: (res) => {
        console.log('Connected to device:', res);
        this.setData({
          statusMessage: 'Connected to device. Configuring Wi-Fi...',
          connectionStatus: 'connected'
        });

        // Get services for the device
        wx.getBLEDeviceServices({
          deviceId: selectedDevice.deviceId,
          success: (res) => {
            console.log('Device services:', res.services);
            
            const foxessService = res.services.find(s => s.uuid.toLowerCase().includes('00ff'));
            
            if (foxessService) {
              // Get characteristics for the service
              wx.getBLEDeviceCharacteristics({
                deviceId: selectedDevice.deviceId,
                serviceId: foxessService.uuid,
                success: (res) => {
                  console.log('Service characteristics:', res.characteristics);
                  
                  const writeCharacteristic = res.characteristics.find(c => 
                    c.uuid.toLowerCase().includes('ff01') && 
                    c.properties.write
                  );
                  
                  if (writeCharacteristic) {
                    // Send Wi-Fi configuration
                    this.sendWifiConfig(
                      selectedDevice.deviceId, 
                      foxessService.uuid, 
                      writeCharacteristic.uuid, 
                      ssid, 
                      password
                    );
                  } else {
                    this.handleConnectionError('Write characteristic not found');
                  }
                },
                fail: (error) => {
                  console.error('Failed to get characteristics:', error);
                  this.handleConnectionError('Failed to get characteristics');
                }
              });
            } else {
              this.handleConnectionError('FoxESS service not found');
            }
          },
          fail: (error) => {
            console.error('Failed to get services:', error);
            this.handleConnectionError('Failed to get services');
          }
        });
      },
      fail: (error) => {
        console.error('Failed to connect to device:', error);
        this.handleConnectionError('Failed to connect to device');
      }
    });
  },

  // Build FoxESS WiFi configuration packet (command 0x3B)
  buildFoxWifiFrame: function(ssid, password) {
    // FoxESS protocol requires:
    // 55 AA 3B <len> SSID\0 PASS\0 CRC16
    
    // Use ArrayBuffer/Uint8Array since TextEncoder might not be available
    const ssidBytes = [];
    for (let i = 0; i < ssid.length; i++) {
      ssidBytes.push(ssid.charCodeAt(i));
    }
    ssidBytes.push(0); // Null terminator
    
    const passwordBytes = [];
    for (let i = 0; i < password.length; i++) {
      passwordBytes.push(password.charCodeAt(i));
    }
    passwordBytes.push(0); // Null terminator
    
    // Body: ssid + null + password + null
    const body = [...ssidBytes, ...passwordBytes];
    const len = body.length;
    
    // Full packet: header (55 AA) + command (3B) + length + body
    const packet = [0x55, 0xAA, 0x3B, len, ...body];
    
    // Calculate CRC-16 and append
    const crcValue = crc16(packet);
    packet.push(crcValue & 0xFF); // Low byte
    packet.push((crcValue >> 8) & 0xFF); // High byte
    
    return new Uint8Array(packet);
  },

  // Write frame to BLE characteristic in chunks (max 20 bytes per write)
  writeChunkedFrame: async function(deviceId, serviceId, characteristicId, frame) {
    const chunkSize = 20; // BLE standard MTU size
    let success = true;
    
    try {
      // Write in chunks
      for (let i = 0; i < frame.length; i += chunkSize) {
        const chunk = frame.slice(i, Math.min(i + chunkSize, frame.length));
        
        // Create buffer for this chunk
        const buffer = new ArrayBuffer(chunk.length);
        const dataView = new DataView(buffer);
        
        for (let j = 0; j < chunk.length; j++) {
          dataView.setUint8(j, chunk[j]);
        }
        
        // Use await with a Promise wrapper to handle BLE operations sequentially
        await new Promise((resolve, reject) => {
          wx.writeBLECharacteristicValue({
            deviceId: deviceId,
            serviceId: serviceId,
            characteristicId: characteristicId,
            value: buffer,
            success: resolve,
            fail: (err) => {
              console.error(`Failed to write chunk at offset ${i}:`, err);
              success = false;
              reject(err);
            }
          });
        });
        
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      return success;
    } catch (error) {
      console.error('Error in chunked write:', error);
      return false;
    }
  },

  // Parse FoxESS response frame (command 0x3A)
  parseFoxReply: function(value) {
    try {
      const data = new Uint8Array(value);
      console.log('Received response:', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Check if this is a valid FoxESS frame: 55 AA 3A ...
      if (data.length >= 7 && data[0] === 0x55 && data[1] === 0xAA && data[2] === 0x3A) {
        // Status codes in bytes 5-7
        // 04 01 01 03 = Online and connected to WiFi
        if (data[5] === 0x01 && data[6] === 0x03) {
          console.log('Device is connected to WiFi and online!');
          this.setData({
            statusMessage: 'Device connected to WiFi successfully!',
            connectionStatus: 'success'
          });
          
          // Navigate to result page
          wx.hideLoading();
          const app = getApp();
          app.globalData.connectionInfo = {
            deviceId: this.data.deviceId,
            ssid: this.data.ssid
          };
          
          wx.navigateTo({
            url: '/pages/result/result?success=true'
          });
          
          // Stop listening for notifications
          wx.notifyBLECharacteristicValueChange({
            deviceId: this.data.deviceId,
            serviceId: this.data.serviceId,
            characteristicId: this.data.characteristicId,
            state: false
          });
        } else if (data[5] === 0x01 && data[6] === 0x02) {
          // Connecting to WiFi
          this.setData({
            statusMessage: 'Device is connecting to WiFi...',
            connectionStatus: 'connecting'
          });
        } else if (data[5] === 0x01 && data[6] === 0x01) {
          // Got WiFi settings
          this.setData({
            statusMessage: 'Device received WiFi settings...',
            connectionStatus: 'connecting'
          });
        } else {
          console.log('Device status update:', data[5], data[6]);
        }
      }
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  },

  // Send Wi-Fi configuration to the device
  sendWifiConfig: async function(deviceId, serviceId, characteristicId, ssid, password) {
    try {
      this.setData({
        deviceId: deviceId,
        serviceId: serviceId,
        characteristicId: characteristicId,
        ssid: ssid
      });
      
      // 1. Enable notifications to receive status updates
      await new Promise((resolve, reject) => {
        wx.notifyBLECharacteristicValueChange({
          deviceId: deviceId,
          serviceId: serviceId,
          characteristicId: characteristicId,
          state: true,
          success: resolve,
          fail: reject
        });
      });
      
      // Set up notification handler
      wx.onBLECharacteristicValueChange(result => {
        this.parseFoxReply(result.value);
      });
      
      // 2. Build the FoxESS WiFi frame
      const wifiFrame = this.buildFoxWifiFrame(ssid, password);
      console.log('WiFi frame:', Array.from(wifiFrame).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // 3. Send the frame in chunks
      this.setData({
        statusMessage: 'Sending WiFi configuration...',
        connectionStatus: 'configuring'
      });
      
      const success = await this.writeChunkedFrame(deviceId, serviceId, characteristicId, wifiFrame);
      
      if (success) {
        this.setData({
          statusMessage: 'WiFi configuration sent. Waiting for device to connect...',
          connectionStatus: 'waiting'
        });
        
        // Set a timeout to handle cases where the device doesn't respond
        this.connectionTimeout = setTimeout(() => {
          wx.hideLoading();
          if (this.data.connectionStatus !== 'success') {
            this.handleConnectionError('Connection timeout. Device did not confirm WiFi connection.');
          }
        }, 30000); // 30 seconds timeout
      } else {
        this.handleConnectionError('Failed to send WiFi configuration');
      }
    } catch (error) {
      console.error('Error in sendWifiConfig:', error);
      this.handleConnectionError('Error configuring WiFi: ' + error.message);
    }
  },

  // Handle connection errors
  handleConnectionError: function(message) {
    wx.hideLoading();
    
    this.setData({
      connecting: false,
      statusMessage: message,
      connectionStatus: 'failed'
    });
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  // Go back to the scan page
  goBack: function() {
    wx.navigateBack();
  },

  // Lifecycle function - called when page loads
  onLoad: function(options) {
    console.log('Config page loaded');
    
    // Get selected device from global data
    const app = getApp();
    const selectedDevice = app.globalData.selectedDevice;
    
    if (!selectedDevice) {
      wx.showToast({
        title: 'No device selected',
        icon: 'none',
        duration: 2000
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  // Lifecycle function - called when page is initially rendered
  onReady: function() {
    console.log('Config page ready');
  },

  // Lifecycle function - called when page show
  onShow: function() {
    console.log('Config page shown');
  },

  // Lifecycle function - called when page hide
  onHide: function() {
    console.log('Config page hidden');
  },

  // Lifecycle function - called when page unload
  onUnload: function() {
    console.log('Config page unloaded');
    
    // Clear any pending timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    // Remove BLE notification listener
    wx.offBLECharacteristicValueChange();
    
    // Disable notifications if active
    if (this.data.deviceId && this.data.serviceId && this.data.characteristicId) {
      wx.notifyBLECharacteristicValueChange({
        deviceId: this.data.deviceId,
        serviceId: this.data.serviceId,
        characteristicId: this.data.characteristicId,
        state: false,
        complete: () => {
          console.log('Notifications disabled');
        }
      });
    }
    
    // Close any BLE connection when navigating away
    const app = getApp();
    const selectedDevice = app.globalData.selectedDevice;
    
    if (selectedDevice && selectedDevice.deviceId) {
      wx.closeBLEConnection({
        deviceId: selectedDevice.deviceId,
        success: (res) => {
          console.log('BLE connection closed');
        },
        fail: (error) => {
          console.error('Failed to close BLE connection:', error);
        },
        complete: () => {
          // Always try to stop discovery when leaving the page
          wx.stopBluetoothDevicesDiscovery();
        }
      });
    } else {
      // Still try to stop discovery even if no device is connected
      wx.stopBluetoothDevicesDiscovery();
    }
  }
});
