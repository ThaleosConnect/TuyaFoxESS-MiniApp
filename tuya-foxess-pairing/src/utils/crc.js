/**
 * Calculate CRC-16 MODBUS checksum
 * @param {Uint8Array} data - Data to calculate checksum for
 * @returns {Uint8Array} - 2-byte CRC checksum (low byte first, high byte second)
 */
export function calculateCRC16MODBUS(data) {
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) !== 0) {
        crc >>= 1;
        crc ^= 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  
  // Return as Uint8Array with low byte first, high byte second
  return new Uint8Array([crc & 0xFF, (crc >> 8) & 0xFF]);
}

/**
 * Verify CRC-16 MODBUS checksum
 * @param {Uint8Array} data - Data to verify (excluding header and tail)
 * @param {Uint8Array} checksum - 2-byte CRC checksum to verify against
 * @returns {boolean} - True if checksum is valid, false otherwise
 */
export function verifyCRC16MODBUS(data, checksum) {
  const calculatedChecksum = calculateCRC16MODBUS(data);
  return calculatedChecksum[0] === checksum[0] && calculatedChecksum[1] === checksum[1];
}
