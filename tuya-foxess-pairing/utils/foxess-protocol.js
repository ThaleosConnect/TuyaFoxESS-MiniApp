// FoxESS Protocol Implementation - Aligned with FoxESS BLE Protocol Specification
import { crc16modbus } from './crc';

// Protocol constants
export const FOXESS_SERVICE_UUID = '00FF';
export const FOXESS_CHARACTERISTIC_UUID = 'FF01';

// Frame headers and tails (fixed values as per the protocol)
export const APP_TO_DEVICE_HEADER = new Uint8Array([0x7F, 0x7F]);
export const APP_TO_DEVICE_TAIL = new Uint8Array([0xF7, 0xF7]);
export const DEVICE_TO_APP_HEADER = new Uint8Array([0x7E, 0x7E]);
export const DEVICE_TO_APP_TAIL = new Uint8Array([0xE7, 0xE7]);

// Function codes (as specified in the protocol)
export const FUNCTION_CODES = {
  SET_WIFI: 0x3B,  // Set wifi name and password
  READ_STATUS: 0x3A  // Read network connection status
};

// Setting items (as specified in protocol table 3B-2)
export const SETTING_ITEMS = {
  SET_WIFI_CREDENTIALS: 0x02
};

// Status items (as specified in protocol)
export const STATUS_ITEMS = {
  CONNECTION_STATUS: 0x04,
  SSID_LIST: 0x06
};

// Connection status codes
export const CONNECTION_STATUS = {
  DISCONNECTED: 0x00,
  CONNECTING: 0x01,
  CONNECTED: 0x02,
  CONNECTED_TO_CLOUD: 0x03
};

/**
 * Generate current timestamp in seconds (4 bytes as per protocol)
 * @returns {Uint8Array} - 4-byte timestamp
 */
function generateTimestamp() {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  return new Uint8Array([
    now & 0xFF,
    (now >> 8) & 0xFF,
    (now >> 16) & 0xFF,
    (now >> 24) & 0xFF
  ]);
}

/**
 * Convert string to Uint8Array
 * @param {string} str - String to convert
 * @returns {Uint8Array} - Uint8Array representation of the string
 */
function stringToUint8Array(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert Uint8Array to string
 * @param {Uint8Array} uint8Array - Uint8Array to convert
 * @returns {string} - String representation of the Uint8Array
 */
function uint8ArrayToString(uint8Array) {
  const decoder = new TextDecoder();
  return decoder.decode(uint8Array);
}

/**
 * Create a packet for setting WiFi credentials
 * @param {string} ssid - WiFi SSID
 * @param {string} password - WiFi password
 * @returns {Uint8Array} - Complete packet
 */
export function createSetWifiPacket(ssid, password) {
  // Convert strings to Uint8Arrays
  const ssidBytes = stringToUint8Array(ssid);
  const passwordBytes = stringToUint8Array(password);
  
  // User data starts with setting item (0x02) as per protocol table 3B-2
  const userData = new Uint8Array(1 + 1 + ssidBytes.length + 1 + passwordBytes.length);
  let offset = 0;
  
  // Setting item (0x02 for WiFi credentials)
  userData[offset++] = SETTING_ITEMS.SET_WIFI_CREDENTIALS;
  
  // SSID length
  userData[offset++] = ssidBytes.length;
  
  // SSID data
  userData.set(ssidBytes, offset);
  offset += ssidBytes.length;
  
  // Password length
  userData[offset++] = passwordBytes.length;
  
  // Password data
  userData.set(passwordBytes, offset);
  
  return buildPacket(FUNCTION_CODES.SET_WIFI, userData);
}

/**
 * Create a packet for reading network status
 * @returns {Uint8Array} - Complete packet
 */
export function createStatusPacket() {
  // User data is just the status item code
  const userData = new Uint8Array([STATUS_ITEMS.CONNECTION_STATUS]);
  return buildPacket(FUNCTION_CODES.READ_STATUS, userData);
}

/**
 * Create a packet for reading SSID list
 * @returns {Uint8Array} - Complete packet
 */
export function createReadSsidListPacket() {
  // User data is just the SSID list item code
  const userData = new Uint8Array([STATUS_ITEMS.SSID_LIST]);
  return buildPacket(FUNCTION_CODES.READ_STATUS, userData);
}

/**
 * Builds a complete packet according to the FoxESS protocol specification
 * @param {number} functionCode - Function code
 * @param {Uint8Array} userData - User data
 * @returns {Uint8Array} - Complete packet
 */
export function buildPacket(functionCode, userData) {
  // 1. Create timestamp (4 bytes)
  const timestamp = generateTimestamp();
  
  // 2. Create data length (2 bytes) - this is the length of user data only
  const dataLength = new Uint8Array([
    userData.length & 0xFF,
    (userData.length >> 8) & 0xFF
  ]);
  
  // 3. Function code as single byte
  const functionCodeByte = new Uint8Array([functionCode]);
  
  // 4. Data for CRC calculation (function code + timestamp + user data)
  // CRC excludes header but includes function code, timestamp, and user data
  const dataForCrc = new Uint8Array(functionCodeByte.length + timestamp.length + dataLength.length + userData.length);
  let offset = 0;
  dataForCrc.set(functionCodeByte, offset);
  offset += functionCodeByte.length;
  dataForCrc.set(timestamp, offset);
  offset += timestamp.length;
  dataForCrc.set(dataLength, offset);
  offset += dataLength.length;
  dataForCrc.set(userData, offset);
  
  // 5. Calculate CRC-16 MODBUS
  const crc = crc16modbus(dataForCrc);
  const crcBytes = new Uint8Array([crc & 0xFF, (crc >> 8) & 0xFF]); // Low byte first, high byte second
  
  // 6. Assemble complete packet
  const packet = new Uint8Array(
    APP_TO_DEVICE_HEADER.length +
    functionCodeByte.length +
    timestamp.length +
    dataLength.length +
    userData.length +
    crcBytes.length +
    APP_TO_DEVICE_TAIL.length
  );
  
  // Add all components to the packet
  offset = 0;
  packet.set(APP_TO_DEVICE_HEADER, offset);
  offset += APP_TO_DEVICE_HEADER.length;
  packet.set(functionCodeByte, offset);
  offset += functionCodeByte.length;
  packet.set(timestamp, offset);
  offset += timestamp.length;
  packet.set(dataLength, offset);
  offset += dataLength.length;
  packet.set(userData, offset);
  offset += userData.length;
  packet.set(crcBytes, offset);
  offset += crcBytes.length;
  packet.set(APP_TO_DEVICE_TAIL, offset);
  
  return packet;
}

/**
 * Parse a response packet from the device
 * @param {Uint8Array} packet - Response packet
 * @returns {Object|null} - Parsed response or null if invalid
 */
export function parseResponsePacket(packet) {
  // 1. Check header and footer
  if (packet.length < 9) { // Minimum packet size
    console.error('Packet too short');
    return null;
  }
  
  // 2. Check for valid header and footer
  const headerMatch = packet[0] === DEVICE_TO_APP_HEADER[0] && packet[1] === DEVICE_TO_APP_HEADER[1];
  const footerMatch = packet[packet.length - 2] === DEVICE_TO_APP_TAIL[0] && 
                     packet[packet.length - 1] === DEVICE_TO_APP_TAIL[1];
  
  if (!headerMatch || !footerMatch) {
    console.error('Invalid header or footer');
    return null;
  }
  
  // 3. Extract function code
  const functionCode = packet[2];
  
  // 4. Extract timestamp (4 bytes)
  const timestamp = (packet[6] << 24) | (packet[5] << 16) | (packet[4] << 8) | packet[3];
  
  // 5. Extract data length (2 bytes)
  const dataLength = (packet[8] << 8) | packet[7];
  
  // 6. Extract user data
  const userData = packet.slice(9, 9 + dataLength);
  
  // 7. Extract CRC (2 bytes)
  const crcBytes = packet.slice(9 + dataLength, 9 + dataLength + 2);
  const receivedCrc = (crcBytes[1] << 8) | crcBytes[0]; // Low byte first
  
  // 8. Calculate expected CRC
  const dataForCrc = packet.slice(2, 9 + dataLength); // From function code through user data
  const expectedCrc = crc16modbus(dataForCrc);
  
  // 9. Verify CRC
  if (receivedCrc !== expectedCrc) {
    console.error('CRC check failed');
    return null;
  }
  
  // 10. Return parsed packet
  return {
    functionCode,
    timestamp,
    dataLength,
    userData,
    crc: receivedCrc
  };
}

/**
 * Parse a connection status response
 * @param {Uint8Array} userData - User data from response packet
 * @returns {Object} - Parsed status response
 */
export function parseStatusResponse(userData) {
  if (userData.length < 1) {
    console.error('Invalid status response data');
    return { status: CONNECTION_STATUS.DISCONNECTED };
  }
  
  const statusCode = userData[0];
  
  return {
    status: statusCode,
    isConnected: statusCode >= CONNECTION_STATUS.CONNECTED,
    statusText: getStatusText(statusCode)
  };
}

/**
 * Get status text from status code
 * @param {number} statusCode - Status code
 * @returns {string} - Status text
 */
function getStatusText(statusCode) {
  switch (statusCode) {
    case CONNECTION_STATUS.DISCONNECTED:
      return 'Disconnected';
    case CONNECTION_STATUS.CONNECTING:
      return 'Connecting';
    case CONNECTION_STATUS.CONNECTED:
      return 'Connected to WiFi';
    case CONNECTION_STATUS.CONNECTED_TO_CLOUD:
      return 'Connected to Cloud';
    default:
      return 'Unknown Status';
  }
}
