import { calculateCRC16MODBUS, verifyCRC16MODBUS } from './crc';

// Constants
export const FOXESS_SERVICE_UUID = '00FF';
export const FOXESS_CHARACTERISTIC_UUID = 'FF01';

// Frame headers and tails
const APP_TO_MODULE_HEADER = new Uint8Array([0x7F, 0x7F]);
const APP_TO_MODULE_TAIL = new Uint8Array([0xF7, 0xF7]);
const MODULE_TO_APP_HEADER = new Uint8Array([0x7E, 0x7E]);
const MODULE_TO_APP_TAIL = new Uint8Array([0xE7, 0xE7]);

// Function codes
export const FUNCTION_CODES = {
  SET_WIFI: 0x3B,
  READ_STATUS: 0x3A
};

// Setting items
export const SETTING_ITEMS = {
  SET_WIFI_CREDENTIALS: 0x02
};

// Status items
export const STATUS_ITEMS = {
  CONNECTION_STATUS: 0x04,
  SSID_LIST: 0x06
};

// Connection status codes
export const CONNECTION_STATUS = {
  DISCONNECTED: 0x00,
  CONNECTING: 0x01,
  CONNECTED: 0x02,
  ONLINE: 0x03
};

/**
 * Generate a random 4-byte timestamp
 * @returns {Uint8Array} - 4-byte timestamp
 */
function generateTimestamp() {
  const timestamp = new Uint8Array(4);
  crypto.getRandomValues(timestamp);
  // Ensure non-zero
  if (timestamp[0] === 0 && timestamp[1] === 0 && timestamp[2] === 0 && timestamp[3] === 0) {
    timestamp[0] = 1;
  }
  return timestamp;
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
 * @param {string} token - Tuya pairing token
 * @returns {Uint8Array} - Complete packet
 */
export function createSetWifiPacket(ssid, password, token) {
  // Convert strings to Uint8Arrays
  const ssidBytes = stringToUint8Array(ssid);
  const passwordBytes = stringToUint8Array(password);
  const tokenBytes = stringToUint8Array(token);
  
  // Create user data
  const userData = new Uint8Array(3 + ssidBytes.length + passwordBytes.length + tokenBytes.length);
  userData[0] = SETTING_ITEMS.SET_WIFI_CREDENTIALS;
  userData[1] = ssidBytes.length;
  userData.set(ssidBytes, 2);
  userData[2 + ssidBytes.length] = passwordBytes.length;
  userData.set(passwordBytes, 3 + ssidBytes.length);
  // Token is appended after password
  userData.set(tokenBytes, 3 + ssidBytes.length + passwordBytes.length);
  
  // Create function code and timestamp
  const functionCode = new Uint8Array([FUNCTION_CODES.SET_WIFI]);
  const timestamp = generateTimestamp();
  
  // Calculate data length (function code + timestamp + user data)
  const dataLength = 1 + 4 + userData.length;
  const dataLengthBytes = new Uint8Array([dataLength & 0xFF, (dataLength >> 8) & 0xFF]);
  
  // Combine function code, timestamp, and user data for CRC calculation
  const dataForCrc = new Uint8Array(1 + 4 + userData.length);
  dataForCrc.set(functionCode, 0);
  dataForCrc.set(timestamp, 1);
  dataForCrc.set(userData, 5);
  
  // Calculate CRC
  const crc = calculateCRC16MODBUS(dataForCrc);
  
  // Assemble complete packet
  const packet = new Uint8Array(
    APP_TO_MODULE_HEADER.length +
    dataLengthBytes.length +
    functionCode.length +
    timestamp.length +
    userData.length +
    crc.length +
    APP_TO_MODULE_TAIL.length
  );
  
  let offset = 0;
  packet.set(APP_TO_MODULE_HEADER, offset);
  offset += APP_TO_MODULE_HEADER.length;
  packet.set(dataLengthBytes, offset);
  offset += dataLengthBytes.length;
  packet.set(functionCode, offset);
  offset += functionCode.length;
  packet.set(timestamp, offset);
  offset += timestamp.length;
  packet.set(userData, offset);
  offset += userData.length;
  packet.set(crc, offset);
  offset += crc.length;
  packet.set(APP_TO_MODULE_TAIL, offset);
  
  return packet;
}

/**
 * Create a packet for reading network status
 * @returns {Uint8Array} - Complete packet
 */
export function createReadStatusPacket() {
  // Create user data
  const userData = new Uint8Array([STATUS_ITEMS.CONNECTION_STATUS]);
  
  // Create function code and timestamp
  const functionCode = new Uint8Array([FUNCTION_CODES.READ_STATUS]);
  const timestamp = generateTimestamp();
  
  // Calculate data length (function code + timestamp + user data)
  const dataLength = 1 + 4 + userData.length;
  const dataLengthBytes = new Uint8Array([dataLength & 0xFF, (dataLength >> 8) & 0xFF]);
  
  // Combine function code, timestamp, and user data for CRC calculation
  const dataForCrc = new Uint8Array(1 + 4 + userData.length);
  dataForCrc.set(functionCode, 0);
  dataForCrc.set(timestamp, 1);
  dataForCrc.set(userData, 5);
  
  // Calculate CRC
  const crc = calculateCRC16MODBUS(dataForCrc);
  
  // Assemble complete packet
  const packet = new Uint8Array(
    APP_TO_MODULE_HEADER.length +
    dataLengthBytes.length +
    functionCode.length +
    timestamp.length +
    userData.length +
    crc.length +
    APP_TO_MODULE_TAIL.length
  );
  
  let offset = 0;
  packet.set(APP_TO_MODULE_HEADER, offset);
  offset += APP_TO_MODULE_HEADER.length;
  packet.set(dataLengthBytes, offset);
  offset += dataLengthBytes.length;
  packet.set(functionCode, offset);
  offset += functionCode.length;
  packet.set(timestamp, offset);
  offset += timestamp.length;
  packet.set(userData, offset);
  offset += userData.length;
  packet.set(crc, offset);
  offset += crc.length;
  packet.set(APP_TO_MODULE_TAIL, offset);
  
  return packet;
}

/**
 * Create a packet for reading SSID list
 * @returns {Uint8Array} - Complete packet
 */
export function createReadSsidListPacket() {
  // Create user data
  const userData = new Uint8Array([STATUS_ITEMS.SSID_LIST]);
  
  // Create function code and timestamp
  const functionCode = new Uint8Array([FUNCTION_CODES.READ_STATUS]);
  const timestamp = generateTimestamp();
  
  // Calculate data length (function code + timestamp + user data)
  const dataLength = 1 + 4 + userData.length;
  const dataLengthBytes = new Uint8Array([dataLength & 0xFF, (dataLength >> 8) & 0xFF]);
  
  // Combine function code, timestamp, and user data for CRC calculation
  const dataForCrc = new Uint8Array(1 + 4 + userData.length);
  dataForCrc.set(functionCode, 0);
  dataForCrc.set(timestamp, 1);
  dataForCrc.set(userData, 5);
  
  // Calculate CRC
  const crc = calculateCRC16MODBUS(dataForCrc);
  
  // Assemble complete packet
  const packet = new Uint8Array(
    APP_TO_MODULE_HEADER.length +
    dataLengthBytes.length +
    functionCode.length +
    timestamp.length +
    userData.length +
    crc.length +
    APP_TO_MODULE_TAIL.length
  );
  
  let offset = 0;
  packet.set(APP_TO_MODULE_HEADER, offset);
  offset += APP_TO_MODULE_HEADER.length;
  packet.set(dataLengthBytes, offset);
  offset += dataLengthBytes.length;
  packet.set(functionCode, offset);
  offset += functionCode.length;
  packet.set(timestamp, offset);
  offset += timestamp.length;
  packet.set(userData, offset);
  offset += userData.length;
  packet.set(crc, offset);
  offset += crc.length;
  packet.set(APP_TO_MODULE_TAIL, offset);
  
  return packet;
}

/**
 * Parse a response packet from the module
 * @param {Uint8Array} packet - Response packet
 * @returns {Object|null} - Parsed response or null if invalid
 */
export function parseResponsePacket(packet) {
  // Check header and tail
  if (packet.length < 10) {
    return null; // Packet too short
  }
  
  const headerMatch = packet[0] === MODULE_TO_APP_HEADER[0] && packet[1] === MODULE_TO_APP_HEADER[1];
  const tailMatch = packet[packet.length - 2] === MODULE_TO_APP_TAIL[0] && packet[packet.length - 1] === MODULE_TO_APP_TAIL[1];
  
  if (!headerMatch || !tailMatch) {
    return null; // Invalid header or tail
  }
  
  // Extract data length
  const dataLength = packet[2] | (packet[3] << 8);
  
  // Extract function code
  const functionCode = packet[4];
  
  // Extract timestamp
  const timestamp = packet.slice(5, 9);
  
  // Extract user data
  const userData = packet.slice(9, packet.length - 4);
  
  // Extract CRC
  const crc = packet.slice(packet.length - 4, packet.length - 2);
  
  // Verify CRC
  const dataForCrc = packet.slice(4, packet.length - 4);
  if (!verifyCRC16MODBUS(dataForCrc, crc)) {
    return null; // Invalid CRC
  }
  
  // Parse based on function code
  switch (functionCode) {
    case FUNCTION_CODES.READ_STATUS:
      return parseStatusResponse(userData);
    case FUNCTION_CODES.SET_WIFI:
      return parseWifiResponse(userData);
    default:
      return null; // Unknown function code
  }
}

/**
 * Parse a status response
 * @param {Uint8Array} userData - User data from response packet
 * @returns {Object} - Parsed status response
 */
function parseStatusResponse(userData) {
  if (userData.length < 1) {
    return null; // Invalid user data
  }
  
  const statusItem = userData[0];
  
  switch (statusItem) {
    case STATUS_ITEMS.CONNECTION_STATUS:
      if (userData.length < 2) {
        return null; // Invalid user data
      }
      return {
        type: 'connectionStatus',
        status: userData[1]
      };
    case STATUS_ITEMS.SSID_LIST:
      return parseSsidList(userData.slice(1));
    default:
      return null; // Unknown status item
  }
}

/**
 * Parse an SSID list response
 * @param {Uint8Array} userData - User data from response packet
 * @returns {Object} - Parsed SSID list
 */
function parseSsidList(userData) {
  const ssidList = [];
  let offset = 0;
  
  while (offset < userData.length) {
    const ssidLength = userData[offset];
    offset += 1;
    
    if (offset + ssidLength > userData.length) {
      break; // Invalid SSID length
    }
    
    const ssid = uint8ArrayToString(userData.slice(offset, offset + ssidLength));
    offset += ssidLength;
    
    if (offset >= userData.length) {
      break; // No signal strength
    }
    
    const signalStrength = userData[offset];
    offset += 1;
    
    ssidList.push({
      ssid,
      signalStrength
    });
  }
  
  return {
    type: 'ssidList',
    ssidList
  };
}

/**
 * Parse a WiFi response
 * @param {Uint8Array} userData - User data from response packet
 * @returns {Object} - Parsed WiFi response
 */
function parseWifiResponse(userData) {
  if (userData.length < 2) {
    return null; // Invalid user data
  }
  
  const settingItem = userData[0];
  const result = userData[1];
  
  return {
    type: 'wifiResponse',
    settingItem,
    success: result === 0x01
  };
}
