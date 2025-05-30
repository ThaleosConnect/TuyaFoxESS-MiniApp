// BLE Service for FoxESS pairing
import { 
  getBLEDevices, 
  connectBLEDevice, 
  disconnectBLEDevice,
  writeBLECharacteristicValue, 
  readBLECharacteristicValue,
  onBLECharacteristicValueChange
} from '@ray-js/api';
import { DebugUtils } from '../utils/debug-utils';


import { logger } from './logger-service';

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
    DebugUtils.info('Starting BLE device scan', { timeout: SCAN_TIMEOUT });
    try {
      const result = await getBLEDevices({
        services: [SERVICE_UUID],
        allowDuplicatesKey: false,
        interval: 0,
        timeout: SCAN_TIMEOUT
      });
      
      DebugUtils.debug('BLE scan complete', { deviceCount: result.devices.length });
      
      this.discoveredDevices = result.devices.filter(device => {
        // Filter for FoxESS devices (can be improved with actual identifier)
        return device.name && device.name.includes('FOX');
      });
      
      DebugUtils.info('FoxESS devices found', { count: this.discoveredDevices.length });
      this.discoveredDevices.forEach((device, index) => {
        DebugUtils.debug(`Device ${index + 1}:`, { 
          name: device.name, 
          id: device.deviceId,
          rssi: device.RSSI
        });
      });
      
      return this.discoveredDevices;
    } catch (error) {
      DebugUtils.error('Error scanning for BLE devices:', error);
      console.error('Error scanning for BLE devices:', error);
      throw error;
    }
  }

  async connectToDevice(deviceId) {
    DebugUtils.info('Connecting to BLE device', { deviceId });
    try {
      await connectBLEDevice({
        deviceId: deviceId
      });
      
      this.device = { deviceId };
      this.isConnected = true;
      DebugUtils.info('Connected to device successfully');
      
      // Set up notification listener
      DebugUtils.debug('Setting up characteristic notification handler');
      await onBLECharacteristicValueChange(this.handleCharacteristicValueChange.bind(this));
      
      return true;
    } catch (error) {
      DebugUtils.error('Error connecting to BLE device:', error);
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
      DebugUtils.error('Error disconnecting from BLE device:', error);
      console.error('Error disconnecting from BLE device:', error);
      throw error;
    }
  }

  async writeCharacteristic(data) {
    if (!this.isConnected || !this.device) {
      DebugUtils.error('Cannot write characteristic: not connected');
      throw new Error('Not connected to device');
    }
    
    try {
      DebugUtils.debug('Writing to BLE characteristic', { 
        serviceId: SERVICE_UUID,
        characteristicId: CHARACTERISTIC_UUID,
        dataLength: data.byteLength
      });
      
      // Log the packet with direction TX (transmit)
      DebugUtils.logPacket('tx', data);
      
      await writeBLECharacteristicValue({
        deviceId: this.device.deviceId,
        serviceId: SERVICE_UUID,
        characteristicId: CHARACTERISTIC_UUID,
        value: data
      });
      
      DebugUtils.debug('Write to characteristic successful');
      return true;
    } catch (error) {
      DebugUtils.error('Error writing to BLE characteristic:', error);
      console.error('Error writing to BLE characteristic:', error);
      throw error;
    }
  }

  async readCharacteristic() {
    if (!this.isConnected || !this.device) {
      DebugUtils.error('Cannot read characteristic: not connected');
      throw new Error('Not connected to device');
    }
    
    try {
      DebugUtils.debug('Reading from BLE characteristic', { 
        serviceId: SERVICE_UUID,
        characteristicId: CHARACTERISTIC_UUID
      });
      
      const result = await readBLECharacteristicValue({
        deviceId: this.device.deviceId,
        serviceId: SERVICE_UUID,
        characteristicId: CHARACTERISTIC_UUID
      });
      
      // Log the received data
      if (result && result.value) {
        DebugUtils.logPacket('rx', result.value);
      }
      
      DebugUtils.debug('Read from characteristic successful');
      return result.value;
    } catch (error) {
      DebugUtils.error('Error reading BLE characteristic:', error);
      console.error('Error reading BLE characteristic:', error);
      throw error;
    }
  }

  handleCharacteristicValueChange(result) {
    // Handle incoming data from device
    DebugUtils.debug('Received data change notification from device');
    
    try {
      if (result && result.value) {
        DebugUtils.logPacket('rx', result.value);
        console.log('Received data from device:', DebugUtils.arrayBufferToHex(result.value));
      } else {
        DebugUtils.warn('Received empty characteristic change notification');
      }
    } catch (error) {
      DebugUtils.error('Error handling characteristic value change', error);
      console.error('Error handling characteristic value change', error);
    }
  }
  
  // Helper method to convert array buffer to hex string
  arrayBufferToHex(buffer) {
    if (!buffer) return 'null';
    
    const view = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer.buffer);
    let hexStr = '';
    
    for (let i = 0; i < view.length; i++) {
      const hex = view[i].toString(16).padStart(2, '0');
      hexStr += hex + ' ';
    }
    
    return hexStr.trim();
  }
}

export const bleService = new BleService();
