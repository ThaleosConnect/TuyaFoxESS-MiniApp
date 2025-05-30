// BLE Service for FoxESS pairing
import { 
  getBLEDevices, 
  connectBLEDevice, 
  disconnectBLEDevice,
  writeBLECharacteristicValue, 
  readBLECharacteristicValue,
  onBLECharacteristicValueChange
} from '@ray-js/api';

const SERVICE_UUID = '00FF';
const CHARACTERISTIC_UUID = 'FF01';
const SCAN_TIMEOUT = 10000; // 10 seconds

class BleService {
  constructor() {
    this.device = null;
    this.isConnected = false;
    this.discoveredDevices = [];
  }

  async scanForDevices() {
    try {
      const result = await getBLEDevices({
        services: [SERVICE_UUID],
        allowDuplicatesKey: false,
        interval: 0,
        timeout: SCAN_TIMEOUT
      });
      
      this.discoveredDevices = result.devices.filter(device => {
        // Filter for FoxESS devices (can be improved with actual identifier)
        return device.name && device.name.includes('FOX');
      });
      
      return this.discoveredDevices;
    } catch (error) {
      console.error('Error scanning for BLE devices:', error);
      throw error;
    }
  }

  async connectToDevice(deviceId) {
    try {
      await connectBLEDevice({
        deviceId: deviceId
      });
      
      this.device = { deviceId };
      this.isConnected = true;
      
      // Set up notification listener
      await onBLECharacteristicValueChange(this.handleCharacteristicValueChange.bind(this));
      
      return true;
    } catch (error) {
      console.error('Error connecting to BLE device:', error);
      throw error;
    }
  }

  async disconnectFromDevice() {
    if (!this.device) return;
    
    try {
      await disconnectBLEDevice({
        deviceId: this.device.deviceId
      });
      
      this.isConnected = false;
      return true;
    } catch (error) {
      console.error('Error disconnecting from BLE device:', error);
      throw error;
    }
  }

  async writeCharacteristic(data) {
    if (!this.isConnected || !this.device) {
      throw new Error('Not connected to device');
    }
    
    try {
      await writeBLECharacteristicValue({
        deviceId: this.device.deviceId,
        serviceId: SERVICE_UUID,
        characteristicId: CHARACTERISTIC_UUID,
        value: data
      });
      
      return true;
    } catch (error) {
      console.error('Error writing to BLE characteristic:', error);
      throw error;
    }
  }

  async readCharacteristic() {
    if (!this.isConnected || !this.device) {
      throw new Error('Not connected to device');
    }
    
    try {
      const result = await readBLECharacteristicValue({
        deviceId: this.device.deviceId,
        serviceId: SERVICE_UUID,
        characteristicId: CHARACTERISTIC_UUID
      });
      
      return result.value;
    } catch (error) {
      console.error('Error reading BLE characteristic:', error);
      throw error;
    }
  }

  handleCharacteristicValueChange(result) {
    // Handle incoming data from device
    console.log('Received data from device:', result);
    
    // Emit event or call callback with the data
    // This implementation would be extended based on how you're handling events
  }
}

export const bleService = new BleService();
