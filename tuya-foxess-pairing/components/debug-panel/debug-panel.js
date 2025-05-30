// Debug Panel Component for FoxESS Pairing
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },
  
  data: {
    logs: [],
    expanded: false,
    maxLogs: 100,
    autoScroll: true
  },
  
  methods: {
    toggleExpand() {
      this.setData({
        expanded: !this.data.expanded
      });
    },
    
    clearLogs() {
      this.setData({
        logs: []
      });
    },
    
    copyLogs() {
      const logText = this.data.logs.map(log => 
        `[${log.timestamp}] [${log.level}] ${log.message}`
      ).join('\n');
      
      wx.setClipboardData({
        data: logText,
        success: () => {
          wx.showToast({
            title: 'Logs copied',
            icon: 'success'
          });
        }
      });
    },
    
    // Add a new log entry
    addLog(level, message, data) {
      const timestamp = new Date().toISOString().substr(11, 12);
      let displayMsg = message;
      
      // If data is provided, stringify it or format it appropriately
      if (data) {
        if (typeof data === 'object') {
          try {
            // For binary data like ArrayBuffer, convert to hex string
            if (data instanceof ArrayBuffer || (data.buffer && data.buffer instanceof ArrayBuffer)) {
              displayMsg += ' ' + this.arrayBufferToHex(data);
            } else {
              displayMsg += ' ' + JSON.stringify(data);
            }
          } catch (e) {
            displayMsg += ' [Object]';
          }
        } else {
          displayMsg += ' ' + data.toString();
        }
      }
      
      // Add new log to the beginning for more recent logs at top
      let newLogs = [{
        timestamp,
        level,
        message: displayMsg,
        raw: data
      }, ...this.data.logs];
      
      // Limit number of logs
      if (newLogs.length > this.data.maxLogs) {
        newLogs = newLogs.slice(0, this.data.maxLogs);
      }
      
      this.setData({
        logs: newLogs
      });
      
      // Emit the log event for parent components
      this.triggerEvent('log', {
        level,
        message,
        data
      });
    },
    
    // Helper method to convert array buffer to hex string
    arrayBufferToHex(buffer) {
      const view = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer.buffer);
      let result = '0x';
      for (let i = 0; i < view.length; i++) {
        const value = view[i].toString(16);
        result += (value.length === 1 ? '0' + value : value);
      }
      return result;
    },
    
    // Convenience methods for different log levels
    info(message, data) {
      this.addLog('INFO', message, data);
    },
    
    debug(message, data) {
      this.addLog('DEBUG', message, data);
    },
    
    warn(message, data) {
      this.addLog('WARN', message, data);
    },
    
    error(message, data) {
      this.addLog('ERROR', message, data);
    },
    
    packet(direction, functionCode, data) {
      // Special method for logging packet information
      let message = `${direction === 'TX' ? '→' : '←'} `;
      
      // Add human-readable function code description
      switch (functionCode) {
        case 0x01: message += 'HANDSHAKE'; break;
        case 0x02: message += 'SET_WIFI'; break;
        case 0x03: message += 'GET_STATUS'; break;
        case 0x04: message += 'ACTIVATE'; break;
        case 0x3A: message += 'RESPONSE'; break;
        case 0x3B: message += 'WIFI_CONFIG'; break;
        default: message += `FUNC:0x${functionCode.toString(16)}`;
      }
      
      this.addLog('PACKET', message, data);
    }
  }
});
