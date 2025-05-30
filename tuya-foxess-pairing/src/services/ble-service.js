import {
  openBluetoothAdapter,
  startBluetoothDevicesDiscovery,
  stopBluetoothDevicesDiscovery,
  onBluetoothDeviceFound,
  offBluetoothDeviceFound,
  onBluetoothAdapterStateChange,
  connectBLEDevice,
  getBLEDeviceServices,
  getBLEDeviceCharacteristics,
  writeBLECharacteristicValue,
  notifyBLECharacteristicValueChange,
  onBLECharacteristicValueChange,
  offBLECharacteristicValueChange,
  closeBLEConnection,
  closeBluetoothAdapter,
  arrayBufferToHex
} from '@ray-js/api';

import { 
  FOXESS_SERVICE_UUID, 
  FOXESS_CHARACTERISTIC_UUID,
  createSetWifiPacket,
  createReadStatusPacket,
  createReadSsidListPacket,
  parseResponsePacket
} from '../utils/foxess-protocol';

// BLE Service class
class BleService {
  constructor() {
    this.isScanning = false;
    this.isConnected = false;
    this.deviceId = null;
    this.serviceId = null;
    this.characteristicId = null;
    this.discoveredDevices = new Map();
    this.onDeviceFoundCallback = null;
    this.onConnectionStatusChangeCallback = null;
    this.onDataReceivedCallback = null;
    this.onErrorCallback = null;
    
    // Initialize BLE adapter state change listener
    this.initAdapterStateChangeListener();
  }
  
  /**
   * Initialize BLE adapter state change listener
   */
  initAdapterStateChangeListener() {
    onBluetoothAdapterStateChange((res) => {
      console.log('Bluetooth adapter state changed:', res);
      if (!res.available) {
        this.isScanning = false;
        this.isConnected = false;
        if (this.onErrorCallback) {
          this.onErrorCallback('Bluetooth adapter is not available');
        }
      }
    });
  }
  
  /**
   * Start scanning for FoxESS devices
   * @param {Function} onDeviceFound - Callback when a device is found
   * @returns {Promise<void>}
   */
  async startScan(onDeviceFound) {
    if (this.isScanning) {
      return;
    }
    
    this.onDeviceFoundCallback = onDeviceFound;
    this.discoveredDevices.clear();
    
    try {
      // Open Bluetooth adapter
      await openBluetoothAdapter();
      
      // Start discovery
      await startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        // Do not filter by services to discover all devices
      });
      
      this.isScanning = true;
      
      // Set up device found listener
      onBluetoothDeviceFound((res) => {
        res.devices.forEach((device) => {
          // Check if it's a FoxESS device
          const isFoxEssDevice = this.isFoxEssDevice(device);
          
          if (isFoxEssDevice) {
            // Add to discovered devices map
            this.discoveredDevices.set(device.deviceId, device);
            
            // Call callback
            if (this.onDeviceFoundCallback) {
              this.onDeviceFoundCallback(device);
            }
          }
        });
      });
    } catch (error) {
      console.error('Failed to start scanning:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to start scanning: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  /**
   * Stop scanning for devices
   * @returns {Promise<void>}
   */
  async stopScan() {
    if (!this.isScanning) {
      return;
    }
    
    try {
      await stopBluetoothDevicesDiscovery();
      offBluetoothDeviceFound();
      this.isScanning = false;
    } catch (error) {
      console.error('Failed to stop scanning:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to stop scanning: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  /**
   * Check if a device is a FoxESS device
   * @param {Object} device - Device object
   * @returns {boolean} - True if it's a FoxESS device
   */
  isFoxEssDevice(device) {
    // Check device name
    if (device.name && device.name.startsWith('DL_')) {
      return true;
    }
    
    // Check advertised data for service UUID 0x00FF
    if (device.advertisData) {
      const advertHex = arrayBufferToHex(device.advertisData);
      if (advertHex && advertHex.toLowerCase().includes('00ff')) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Connect to a FoxESS device
   * @param {string} deviceId - Device ID to connect to
   * @param {Function} onConnectionStatusChange - Callback when connection status changes
   * @param {Function} onDataReceived - Callback when data is received
   * @returns {Promise<Object>} - Connection info
   */
  async connect(deviceId, onConnectionStatusChange, onDataReceived) {
    if (this.isConnected) {
      await this.disconnect();
    }
    
    this.onConnectionStatusChangeCallback = onConnectionStatusChange;
    this.onDataReceivedCallback = onDataReceived;
    
    try {
      // Connect to device
      await connectBLEDevice({
        deviceId,
        timeout: 10000
      });
      
      // Get services
      const servicesRes = await getBLEDeviceServices({ deviceId });
      
      // Find FoxESS service
      const service = servicesRes.services.find(s => 
        s.uuid.toLowerCase().endsWith(FOXESS_SERVICE_UUID.toLowerCase())
      );
      
      if (!service) {
        throw new Error('FoxESS service not found');
      }
      
      // Get characteristics
      const charsRes = await getBLEDeviceCharacteristics({
        deviceId,
        serviceId: service.uuid
      });
      
      // Find FoxESS characteristic
      const characteristic = charsRes.characteristics.find(c => 
        c.uuid.toLowerCase().endsWith(FOXESS_CHARACTERISTIC_UUID.toLowerCase())
      );
      
      if (!characteristic) {
        throw new Error('FoxESS characteristic not found');
      }
      
      // Save connection info
      this.deviceId = deviceId;
      this.serviceId = service.uuid;
      this.characteristicId = characteristic.uuid;
      this.isConnected = true;
      
      // Enable notifications
      await notifyBLECharacteristicValueChange({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId,
        state: true
      });
      
      // Set up characteristic value change listener
      onBLECharacteristicValueChange((res) => {
        if (res.characteristicId.toLowerCase().endsWith(FOXESS_CHARACTERISTIC_UUID.toLowerCase())) {
          const data = new Uint8Array(res.value);
          const parsedData = parseResponsePacket(data);
          
          if (parsedData && this.onDataReceivedCallback) {
            this.onDataReceivedCallback(parsedData);
          }
        }
      });
      
      // Call connection status change callback
      if (this.onConnectionStatusChangeCallback) {
        this.onConnectionStatusChangeCallback(true);
      }
      
      return {
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.isConnected = false;
      
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to connect: ${error.message || error}`);
      }
      
      // Call connection status change callback
      if (this.onConnectionStatusChangeCallback) {
        this.onConnectionStatusChangeCallback(false);
      }
      
      throw error;
    }
  }
  
  /**
   * Disconnect from the current device
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }
    
    try {
      // Remove characteristic value change listener
      offBLECharacteristicValueChange();
      
      // Close connection
      await closeBLEConnection({ deviceId: this.deviceId });
      
      this.isConnected = false;
      this.deviceId = null;
      this.serviceId = null;
      this.characteristicId = null;
      
      // Call connection status change callback
      if (this.onConnectionStatusChangeCallback) {
        this.onConnectionStatusChangeCallback(false);
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to disconnect: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  /**
   * Close Bluetooth adapter
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.isConnected) {
        await this.disconnect();
      }
      
      if (this.isScanning) {
        await this.stopScan();
      }
      
      await closeBluetoothAdapter();
    } catch (error) {
      console.error('Failed to close Bluetooth adapter:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to close Bluetooth adapter: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  /**
   * Set WiFi credentials
   * @param {string} ssid - WiFi SSID
   * @param {string} password - WiFi password
   * @param {string} token - Tuya pairing token
   * @returns {Promise<void>}
   */
  async setWifiCredentials(ssid, password, token) {
    if (!this.isConnected) {
      throw new Error('Not connected to a device');
    }
    
    try {
      const packet = createSetWifiPacket(ssid, password, token);
      
      await writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId,
        value: packet.buffer
      });
    } catch (error) {
      console.error('Failed to set WiFi credentials:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to set WiFi credentials: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  /**
   * Read network status
   * @returns {Promise<void>}
   */
  async readNetworkStatus() {
    if (!this.isConnected) {
      throw new Error('Not connected to a device');
    }
    
    try {
      const packet = createReadStatusPacket();
      
      await writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId,
        value: packet.buffer
      });
    } catch (error) {
      console.error('Failed to read network status:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to read network status: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  /**
   * Read SSID list
   * @returns {Promise<void>}
   */
  async readSsidList() {
    if (!this.isConnected) {
      throw new Error('Not connected to a device');
    }
    
    try {
      const packet = createReadSsidListPacket();
      
      await writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId,
        value: packet.buffer
      });
    } catch (error) {
      console.error('Failed to read SSID list:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Failed to read SSID list: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  /**
   * Set error callback
   * @param {Function} callback - Error callback
   */
  setErrorCallback(callback) {
    this.onErrorCallback = callback;
  }
  
  /**
   * Get discovered devices
   * @returns {Array} - Array of discovered devices
   */
  getDiscoveredDevices() {
    return Array.from(this.discoveredDevices.values());
  }
}

// Export singleton instance
export const bleService = new BleService();
