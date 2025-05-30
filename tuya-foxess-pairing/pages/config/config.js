// Config page for FoxESS Pairing Mini App
import { crc16 } from '../../utils/crc16';
import { DebugUtils } from '../../utils/debug-utils';

// Constants
const SERVICE_UUID = '00FF';
const CHARACTERISTIC_UUID = 'FF01';

Page({
  data: {
    ssid: '',
    password: '',
    connecting: false,
    connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected', 'failed'
    statusMessage: 'Please enter your Wi-Fi details',
    debugMode: false,
    debugLogs: [],
    showPacketDetails: false,
    currentPacket: null,
    stepProgress: {
      scanning: 'pending',    // 'pending', 'in_progress', 'completed', 'failed'
      connecting: 'pending',
      services: 'pending',
      characteristics: 'pending',
      sending: 'pending',
      receiving: 'pending'
    }
  },
  
  // On page load
  onLoad() {
    // Enable debug mode for development
    this.setData({
      debugMode: true
    });
    
    // Initialize DebugUtils
    DebugUtils.setDebugMode(true);
    
    // Add initial debug log
    this.addDebugLog('info', 'Config page loaded');
  },
  
  // Input handlers for SSID and password
  onSsidInput(e) {
    this.setData({
      ssid: e.detail.value
    });
  },
  
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },
  
  // Submit form to configure Wi-Fi on the device
  submitForm(e) {
    const { ssid, password } = e.detail.value;
    
    if (!ssid) {
      wx.showToast({
        title: 'Please enter SSID',
        icon: 'none'
      });
      return;
    }
    
    this.addDebugLog('info', 'Starting WiFi configuration', { ssid });
    
    // Connect to device and send Wi-Fi config
    this.connectDevice(ssid, password);
  },
  
  // Toggle debug mode
  toggleDebugMode() {
    const newDebugMode = !this.data.debugMode;
    this.setData({
      debugMode: newDebugMode
    });
    
    DebugUtils.setDebugMode(newDebugMode);
    this.addDebugLog('info', newDebugMode ? 'Debug mode enabled' : 'Debug mode disabled');
  },
  
  // Clear debug logs
  clearDebugLogs() {
    this.setData({
      debugLogs: []
    });
    
    DebugUtils.clear();
    this.addDebugLog('info', 'Debug logs cleared');
  },
  
  // View packet details
  viewPacketDetails(e) {
    const index = e.currentTarget.dataset.index;
    const log = this.data.debugLogs[index];
    
    if (log && log.data && log.data.hexData) {
      this.setData({
        showPacketDetails: true,
        currentPacket: log
      });
    }
  },
  
  // Hide packet details
  hidePacketDetails() {
    this.setData({
      showPacketDetails: false
    });
  },
  
  // Add debug log entry
  addDebugLog(level, message, data) {
    const timestamp = new Date().toISOString().substring(11, 23);
    const logEntry = {
      timestamp,
      level,
      message,
      data: data || null
    };
    
    // Add to beginning of array for newest first
    const newLogs = [logEntry, ...this.data.debugLogs];
    // Cap logs at 100
    const cappedLogs = newLogs.slice(0, 100);
    
    this.setData({
      debugLogs: cappedLogs
    });
    
    // Also log to DebugUtils
    DebugUtils.log(level, message, data);
    
    return logEntry;
  },
  
  // Connect to the selected device and configure Wi-Fi
  connectDevice(ssid, password) {
    const app = getApp();
    const selectedDevice = app.globalData.selectedDevice;
    
    if (!selectedDevice) {
      this.addDebugLog('error', 'No device selected for connection');
      
      // Update step progress
      this.setData({
        'stepProgress.scanning': 'failed'
      });
      
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
    
    this.addDebugLog('info', 'Starting device connection process', { 
      deviceId: selectedDevice.deviceId,
      deviceName: selectedDevice.name
    });

    this.setData({
      connecting: true,
      statusMessage: 'Connecting to device...',
      connectionStatus: 'connecting',
      'stepProgress.scanning': 'completed',
      'stepProgress.connecting': 'in_progress'
    });

    wx.showLoading({
      title: 'Connecting...',
      mask: true
    });

    // Connect to the BLE device
    wx.createBLEConnection({
      deviceId: selectedDevice.deviceId,
      success: (res) => {
        this.addDebugLog('info', 'Connected to device successfully');
        
        this.setData({
          statusMessage: 'Connected to device. Configuring Wi-Fi...',
          connectionStatus: 'connected',
          'stepProgress.connecting': 'completed',
          'stepProgress.services': 'in_progress'
        });

        // Get services for the device
        wx.getBLEDeviceServices({
          deviceId: selectedDevice.deviceId,
          success: (res) => {
            this.addDebugLog('debug', 'Device services discovered', { 
              services: res.services && res.services.length ? res.services.map(s => s.uuid) : []
            });
            
            const foxessService = res.services && res.services.length ? res.services.find(s => 
              s.uuid && s.uuid.toLowerCase().includes('00ff')
            ) : null;
            
            if (foxessService) {
              // Get characteristics for the service
              wx.getBLEDeviceCharacteristics({
                deviceId: selectedDevice.deviceId,
                serviceId: foxessService.uuid,
                success: (res) => {
                  this.addDebugLog('debug', 'Service characteristics discovered', { 
                    characteristics: res.characteristics && res.characteristics.length ? res.characteristics.map(c => ({ 
                      uuid: c.uuid, 
                      properties: c.properties 
                    })) : []
                  });
                  
                  this.setData({
                    'stepProgress.services': 'completed',
                    'stepProgress.characteristics': 'in_progress'
                  });
                  
                  const writeCharacteristic = res.characteristics && res.characteristics.length ? res.characteristics.find(c => 
                    c.uuid && c.uuid.toLowerCase().includes('ff01') && 
                    c.properties && c.properties.write
                  ) : null;
                  
                  if (writeCharacteristic) {
                    this.setData({
                      'stepProgress.characteristics': 'completed',
                      'stepProgress.sending': 'in_progress'
                    });
                    
                    // Send Wi-Fi configuration
                    this.sendWifiConfig(
                      selectedDevice.deviceId, 
                      foxessService.uuid, 
                      writeCharacteristic.uuid, 
                      ssid, 
                      password
                    );
                  } else {
                    this.addDebugLog('error', 'Write characteristic not found in service');
                    this.setData({
                      'stepProgress.characteristics': 'failed'
                    });
                    this.handleConnectionError('Write characteristic not found');
                  }
                },
                fail: (error) => {
                  this.addDebugLog('error', 'Failed to get characteristics', { error });
                  this.handleConnectionError('Failed to get characteristics');
                }
              });
            } else {
              this.handleConnectionError('FoxESS service not found');
            }
          },
          fail: (error) => {
            this.addDebugLog('error', 'Failed to get services', { error });
            this.handleConnectionError('Failed to get services');
          }
        });
      },
      fail: (error) => {
        this.addDebugLog('error', 'Failed to connect to device', { error });
        this.handleConnectionError('Failed to connect to device');
      }
    });
  },
  
  // Handle connection errors
  handleConnectionError(message) {
    this.addDebugLog('error', 'Connection error', { message });
    
    this.setData({
      connectionStatus: 'failed',
      statusMessage: `Error: ${message}`,
      connecting: false
    });
    
    wx.hideLoading();
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },
  
  // Build FoxESS WiFi configuration packet (command 0x3B)
  buildFoxWifiFrame(ssid, password) {
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
    
    // Add CRC-16 at the end
    const crcValue = crc16(packet);
    packet.push(crcValue & 0xFF);  // Take lower byte of CRC
    
    // Convert to ArrayBuffer for BLE transmission
    const buffer = new ArrayBuffer(packet.length);
    const dataView = new Uint8Array(buffer);
    
    for (let i = 0; i < packet.length; i++) {
      dataView[i] = packet[i];
    }
    
    // Log the packet for debugging
    let hexString = '';
    for (let i = 0; i < dataView.length; i++) {
      hexString += dataView[i].toString(16).padStart(2, '0') + ' ';
    }
    
    this.addDebugLog('debug', 'Built WiFi config packet', { 
      command: '0x3B',
      ssidLength: ssidBytes.length,
      passwordLength: passwordBytes.length,
      totalLength: packet.length,
      hexData: hexString.trim()
    });
    
    return buffer;
  },
  
  // Send WiFi configuration to the device
  sendWifiConfig(deviceId, serviceId, characteristicId, ssid, password) {
    this.addDebugLog('info', 'Sending WiFi configuration', { 
      ssid, 
      serviceId, 
      characteristicId 
    });
    
    const wifiConfigPacket = this.buildFoxWifiFrame(ssid, password);
    
    // Enable notifications for response
    wx.notifyBLECharacteristicValueChange({
      deviceId,
      serviceId,
      characteristicId,
      state: true,
      success: () => {
        this.addDebugLog('debug', 'Enabled notifications for characteristic');
        
        // Write the configuration packet
        wx.writeBLECharacteristicValue({
          deviceId,
          serviceId,
          characteristicId,
          value: wifiConfigPacket,
          success: () => {
            this.addDebugLog('info', 'WiFi configuration sent successfully');
            this.setData({
              'stepProgress.sending': 'completed',
              'stepProgress.receiving': 'in_progress',
              statusMessage: 'Sent Wi-Fi config, waiting for response...'
            });
          },
          fail: (error) => {
            this.addDebugLog('error', 'Failed to send WiFi configuration', { error });
            this.setData({
              'stepProgress.sending': 'failed'
            });
            this.handleConnectionError('Failed to send WiFi configuration');
          }
        });
      },
      fail: (error) => {
        this.addDebugLog('error', 'Failed to enable notifications', { error });
        this.handleConnectionError('Failed to enable notifications');
      }
    });
    
    // Set up notification handler
    wx.onBLECharacteristicValueChange(result => {
      this.parseFoxReply(result.value);
    });
  },
  
  // Parse FoxESS reply packet
  parseFoxReply(data) {
    try {
      // First convert ArrayBuffer to Uint8Array
      const dataView = new Uint8Array(data);
      
      // Log the raw hex data
      let hexString = '';
      for (let i = 0; i < dataView.length; i++) {
        hexString += dataView[i].toString(16).padStart(2, '0') + ' ';
      }
      
      this.addDebugLog('debug', 'Received data from device', { hexData: hexString.trim() });
      
      // FoxESS response packet structure:
      // 55 AA <cmd> <status> <data...> <crc>
      if (dataView.length < 5) { // Minimum valid length (header + cmd + status + crc)
        this.addDebugLog('error', 'Response packet too short', { length: dataView.length });
        return;
      }
      
      // Check packet header (55 AA)
      if (dataView[0] !== 0x55 || dataView[1] !== 0xAA) {
        this.addDebugLog('error', 'Invalid packet header', { 
          header: `${dataView[0].toString(16)} ${dataView[1].toString(16)}`
        });
        return;
      }
      
      const command = dataView[2];
      const status = dataView[3];
      
      // Extract the payload (everything between status and CRC)
      const payloadLength = dataView.length - 5; // Subtract header(2) + cmd(1) + status(1) + crc(1)
      const payload = dataView.slice(4, 4 + payloadLength);
      
      // Verify CRC
      const calculatedCrc = crc16(dataView.slice(0, dataView.length - 1));
      const receivedCrc = dataView[dataView.length - 1];
      
      const crcValid = (calculatedCrc & 0xFF) === receivedCrc;
      
      this.addDebugLog('info', 'Parsed response packet', {
        command: `0x${command.toString(16)}`,
        status: status,
        payloadLength: payloadLength,
        crcValid: crcValid
      });
      
      this.setData({
        'stepProgress.receiving': 'completed'
      });
      
      // Process based on command
      if (command === 0x3B) { // WiFi config response
        this.processWifiConfigResponse(status, payload);
      } else {
        this.addDebugLog('debug', 'Unknown command in response', { command: `0x${command.toString(16)}` });
      }
    } catch (error) {
      this.addDebugLog('error', 'Failed to parse response', { error: error.message });
      this.setData({
        'stepProgress.receiving': 'failed'
      });
    }
  },
  
  // Process WiFi configuration response
  processWifiConfigResponse(status, payload) {
    wx.hideLoading();
    
    if (status === 0) {
      this.addDebugLog('info', 'WiFi configuration successful');
      
      this.setData({
        connectionStatus: 'connected',
        statusMessage: 'Wi-Fi configuration successful!',
        connecting: false
      });
      
      wx.showToast({
        title: 'Configuration successful',
        icon: 'success',
        duration: 2000
      });
      
      // Close BLE connection after successful config
      this.closeBleConnection();
      
      // Navigate back after delay
      setTimeout(() => {
        wx.navigateBack();
      }, 3000);
    } else {
      this.addDebugLog('error', 'WiFi configuration failed', { status });
      
      this.setData({
        connectionStatus: 'failed',
        statusMessage: 'Wi-Fi configuration failed',
        connecting: false
      });
      
      wx.showToast({
        title: 'Configuration failed',
        icon: 'none',
        duration: 2000
      });
    }
  },
  
  // Close BLE connection
  closeBleConnection() {
    const app = getApp();
    const selectedDevice = app.globalData.selectedDevice;
    
    if (selectedDevice) {
      this.addDebugLog('debug', 'Closing BLE connection');
      
      wx.closeBLEConnection({
        deviceId: selectedDevice.deviceId,
        success: (res) => {
          this.addDebugLog('debug', 'BLE connection closed');
        },
        fail: (error) => {
          this.addDebugLog('error', 'Failed to close BLE connection', { error });
        },
        complete: () => {
          // Reset device selection
          app.globalData.selectedDevice = null;
        }
      });
    } else {
      // Still try to stop discovery even if no device is connected
      wx.stopBluetoothDevicesDiscovery();
    }
  },
  
  // Navigate back
  goBack() {
    wx.navigateBack();
  },
  
  // Clean up when leaving the page
  onUnload() {
    this.closeBleConnection();
  }
});
