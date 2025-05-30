// FoxESS Protocol Implementation
import { crc16modbus } from './crc';

// Protocol constants
export const HEADER_BYTE = 0xA5;
export const FOOTER_BYTE = 0x5A;

// Function codes
export const FUNCTION_CODES = {
  HANDSHAKE: 0x01,
  SET_WIFI: 0x02,
  GET_STATUS: 0x03,
  ACTIVATE: 0x04
};

// Connection status codes
export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  FAILED: 'failed'
};

// Builds a packet to send to the FoxESS device
export function buildPacket(functionCode, data = []) {
  // Calculate packet length (header + function code + data length + data + crc + footer)
  const length = 1 + 1 + 1 + data.length + 2 + 1;
  
  // Create buffer for packet
  const packet = new Uint8Array(length);
  
  // Add header
  packet[0] = HEADER_BYTE;
  
  // Add function code
  packet[1] = functionCode;
  
  // Add data length
  packet[2] = data.length;
  
  // Add data
  for (let i = 0; i < data.length; i++) {
    packet[3 + i] = data[i];
  }
  
  // Calculate CRC
  const crcBuffer = packet.slice(1, 3 + data.length);
  const crc = crc16modbus(crcBuffer);
  
  // Add CRC (2 bytes, little-endian)
  packet[3 + data.length] = crc & 0xFF;
  packet[3 + data.length + 1] = (crc >> 8) & 0xFF;
  
  // Add footer
  packet[length - 1] = FOOTER_BYTE;
  
  return packet;
}

// Parse a packet received from the FoxESS device
export function parsePacket(packet) {
  // Check header and footer
  if (packet[0] !== HEADER_BYTE || packet[packet.length - 1] !== FOOTER_BYTE) {
    throw new Error('Invalid packet format');
  }
  
  // Get function code
  const functionCode = packet[1];
  
  // Get data length
  const dataLength = packet[2];
  
  // Get data
  const data = packet.slice(3, 3 + dataLength);
  
  // Verify CRC
  const crcBuffer = packet.slice(1, 3 + dataLength);
  const expectedCrc = crc16modbus(crcBuffer);
  
  const receivedCrc = (packet[3 + dataLength + 1] << 8) | packet[3 + dataLength];
  
  if (receivedCrc !== expectedCrc) {
    throw new Error('CRC check failed');
  }
  
  return {
    functionCode,
    data
  };
}

// Create a Wi-Fi configuration packet
export function createWifiConfigPacket(ssid, password) {
  // Convert strings to bytes
  const ssidBytes = new TextEncoder().encode(ssid);
  const passwordBytes = new TextEncoder().encode(password);
  
  // Create data array
  const data = new Uint8Array(2 + ssidBytes.length + 1 + passwordBytes.length);
  
  // Add SSID length
  data[0] = ssidBytes.length;
  
  // Add SSID
  for (let i = 0; i < ssidBytes.length; i++) {
    data[1 + i] = ssidBytes[i];
  }
  
  // Add password length
  data[1 + ssidBytes.length] = passwordBytes.length;
  
  // Add password
  for (let i = 0; i < passwordBytes.length; i++) {
    data[1 + ssidBytes.length + 1 + i] = passwordBytes[i];
  }
  
  return buildPacket(FUNCTION_CODES.SET_WIFI, data);
}

// Create a handshake packet
export function createHandshakePacket() {
  return buildPacket(FUNCTION_CODES.HANDSHAKE);
}

// Create a status request packet
export function createStatusPacket() {
  return buildPacket(FUNCTION_CODES.GET_STATUS);
}

// Create an activation packet with the Tuya token
export function createActivationPacket(token) {
  const tokenBytes = new TextEncoder().encode(token);
  return buildPacket(FUNCTION_CODES.ACTIVATE, tokenBytes);
}

// Parse a status response packet
export function parseStatusResponse(data) {
  if (data.length < 1) {
    throw new Error('Invalid status response');
  }
  
  const statusCode = data[0];
  
  return {
    connected: statusCode === 0x01,
    statusCode
  };
}
