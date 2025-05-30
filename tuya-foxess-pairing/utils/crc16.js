// CRC-16-MODBUS implementation for FoxESS protocol
export function crc16(buf) {
  let crc = 0xFFFF;
  buf.forEach(b => {
    crc ^= b;
    for (let i = 0; i < 8; i++)
      crc = (crc & 1) ? (crc >> 1) ^ 0xA001 : crc >> 1;
  });
  return crc;
}

// Helper to convert hex string to byte array
export function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}
