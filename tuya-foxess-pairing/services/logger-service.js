// Logger Service for FoxESS Pairing Mini App
const DEFAULT_OPTIONS = {
  enabled: true,
  consoleOutput: true,
  maxLogs: 500,
  debugMode: false
};

class LoggerService {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.logs = [];
    this.listeners = [];
    this.debugPanel = null;
  }

  // Register a debug panel component
  registerDebugPanel(panel) {
    this.debugPanel = panel;
  }

  // Add a new log listener
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  // Remove a log listener
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Internal method to add a log entry
  _addLog(level, message, data) {
    if (!this.options.enabled) return;

    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, data };

    // Add to in-memory logs
    this.logs.push(entry);

    // Trim logs if over max size
    if (this.logs.length > this.options.maxLogs) {
      this.logs = this.logs.slice(-this.options.maxLogs);
    }

    // Output to console if enabled
    if (this.options.consoleOutput) {
      const consoleMethod = this._getConsoleMethod(level);
      console[consoleMethod](`[${level}] ${message}`, data || '');
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    });

    // If debug panel is registered, add log to it
    if (this.debugPanel) {
      try {
        if (level === 'PACKET') {
          const { direction, functionCode } = data || {};
          this.debugPanel.packet(direction, functionCode, data.rawData);
        } else {
          this.debugPanel[level.toLowerCase()](message, data);
        }
      } catch (err) {
        console.error('Error sending log to debug panel:', err);
      }
    }
  }

  // Helper to get appropriate console method
  _getConsoleMethod(level) {
    switch (level.toLowerCase()) {
      case 'error': return 'error';
      case 'warn': return 'warn';
      case 'info': return 'info';
      case 'debug': return 'debug';
      case 'packet': return 'debug';
      default: return 'log';
    }
  }

  // Helper for ArrayBuffer to hex string conversion
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

  // Log methods for different levels
  info(message, data) {
    this._addLog('INFO', message, data);
  }

  debug(message, data) {
    if (!this.options.debugMode) return;
    this._addLog('DEBUG', message, data);
  }

  warn(message, data) {
    this._addLog('WARN', message, data);
  }

  error(message, data) {
    this._addLog('ERROR', message, data);
  }

  // Special method for logging protocol packets
  logPacket(direction, functionCode, data) {
    // For packet logs, we structure data differently
    const packetData = {
      direction,
      functionCode,
      rawData: data
    };
    
    this._addLog('PACKET', `${direction === 'TX' ? '→' : '←'} ${this._getFunctionName(functionCode)}`, packetData);
  }

  // Get human-readable function name
  _getFunctionName(functionCode) {
    switch (functionCode) {
      case 0x01: return 'HANDSHAKE';
      case 0x02: return 'SET_WIFI';
      case 0x03: return 'GET_STATUS';
      case 0x04: return 'ACTIVATE';
      case 0x3A: return 'RESPONSE';
      case 0x3B: return 'WIFI_CONFIG';
      default: return `FUNC:0x${functionCode.toString(16)}`;
    }
  }

  // Enable/disable debug mode
  setDebugMode(enabled) {
    this.options.debugMode = !!enabled;
  }

  // Clear all logs
  clear() {
    this.logs = [];
    if (this.debugPanel) {
      this.debugPanel.clearLogs();
    }
  }

  // Get all logs
  getLogs() {
    return [...this.logs];
  }
}

// Export singleton instance
export const logger = new LoggerService();
