// Simple debugging utilities for FoxESS pairing
const DEBUG_UTILS = {
  // Whether debug mode is enabled
  debugMode: false,
  
  // Debug logs storage
  logs: [],
  
  // Maximum number of logs to keep
  maxLogs: 100,
  
  // Enable/disable debug mode
  setDebugMode(enabled) {
    this.debugMode = !!enabled;
    console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
    return this.debugMode;
  },
  
  // Add a debug log
  log(level, message, data) {
    // Always log to console
    if (level === 'error') {
      console.error(`[${level.toUpperCase()}] ${message}`, data || '');
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    }
    
    // Only store in memory if debug mode is enabled
    if (this.debugMode) {
      const timestamp = new Date().toISOString().substring(11, 23);
      
      let displayData = '';
      if (data) {
        if (typeof data === 'object') {
          try {
            if (data instanceof ArrayBuffer || (data.buffer && data.buffer instanceof ArrayBuffer)) {
              displayData = this.arrayBufferToHex(data);
            } else {
              displayData = JSON.stringify(data);
            }
          } catch (e) {
            displayData = '[Object]';
          }
        } else {
          displayData = String(data);
        }
      }
      
      // Add to logs (at beginning for most recent first)
      this.logs.unshift({
        timestamp,
        level,
        message,
        data: displayData
      });
      
      // Trim logs if over max size
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }
    }
  },
  
  // Clear all logs
  clear() {
    this.logs = [];
    console.log('Debug logs cleared');
  },
  
  // Get all logs
  getLogs() {
    return [...this.logs];
  },
  
  // Convenience methods for different log levels
  info(message, data) {
    this.log('info', message, data);
  },
  
  debug(message, data) {
    this.log('debug', message, data);
  },
  
  warn(message, data) {
    this.log('warn', message, data);
  },
  
  error(message, data) {
    this.log('error', message, data);
  },
  
  // Log BLE packet
  logPacket(direction, data) {
    let message = `${direction === 'tx' ? '→' : '←'} BLE Packet`;
    this.log('packet', message, data);
  },
  
  // Helper to convert array buffer to hex string
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
};

// Export the singleton
export const DebugUtils = DEBUG_UTILS;
