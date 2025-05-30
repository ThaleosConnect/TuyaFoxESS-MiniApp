import { Component } from '@ray-js/core';
import { navigateTo, showToast, showLoading, hideLoading } from '@ray-js/api';
import { View, Text, Button, Input, Form, Switch } from '@ray-js/components';
import { bleService } from '../../services/ble-service';
import { tuyaService } from '../../services/tuya-service';
import { CONNECTION_STATUS } from '../../utils/foxess-protocol';
import './config.css';

/**
 * Config page component
 */
export default class Config extends Component {
  state = {
    isConnected: false,
    isConnecting: false,
    isLoading: false,
    showPassword: false,
    ssid: '',
    password: '',
    error: null,
    connectionStatus: null,
    statusPollingInterval: null
  };

  componentDidMount() {
    // Set error callback
    bleService.setErrorCallback(this.handleError);
    
    // Get selected device from global data
    const app = getApp();
    const selectedDevice = app.globalData.selectedDevice;
    
    if (!selectedDevice) {
      // No device selected, go back to scan page
      showToast({
        title: 'No device selected',
        icon: 'none',
        duration: 2000
      });
      
      navigateTo({
        url: '/pages/scan/scan'
      });
      return;
    }
    
    // Connect to device
    this.connectToDevice(selectedDevice);
  }

  componentWillUnmount() {
    // Disconnect from device when component unmounts
    this.disconnectFromDevice();
    
    // Clear status polling interval
    if (this.state.statusPollingInterval) {
      clearInterval(this.state.statusPollingInterval);
    }
  }

  /**
   * Handle errors
   * @param {string} error - Error message
   */
  handleError = (error) => {
    this.setState({ error });
    showToast({
      title: error,
      icon: 'none',
      duration: 2000
    });
  };

  /**
   * Connect to device
   * @param {Object} device - Device to connect to
   */
  connectToDevice = async (device) => {
    try {
      this.setState({
        isConnecting: true,
        error: null
      });
      
      showLoading({
        title: 'Connecting...'
      });
      
      // Connect to device
      await bleService.connect(
        device.deviceId,
        this.handleConnectionStatusChange,
        this.handleDataReceived
      );
      
      // Start polling for connection status
      this.startStatusPolling();
      
    } catch (error) {
      this.handleError(`Failed to connect: ${error.message || error}`);
      this.setState({ isConnecting: false });
      hideLoading();
    }
  };

  /**
   * Disconnect from device
   */
  disconnectFromDevice = async () => {
    try {
      await bleService.disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  /**
   * Handle connection status change
   * @param {boolean} isConnected - Whether device is connected
   */
  handleConnectionStatusChange = (isConnected) => {
    this.setState({
      isConnected,
      isConnecting: false
    });
    
    hideLoading();
    
    if (isConnected) {
      showToast({
        title: 'Connected',
        icon: 'success',
        duration: 2000
      });
    } else {
      showToast({
        title: 'Disconnected',
        icon: 'none',
        duration: 2000
      });
    }
  };

  /**
   * Handle data received from device
   * @param {Object} data - Parsed data
   */
  handleDataReceived = (data) => {
    console.log('Data received:', data);
    
    if (data.type === 'connectionStatus') {
      this.setState({ connectionStatus: data.status });
      
      // If device is online, navigate to result page
      if (data.status === CONNECTION_STATUS.ONLINE) {
        const app = getApp();
        app.globalData.pairingStatus = 'success';
        
        navigateTo({
          url: '/pages/result/result'
        });
      }
    }
  };

  /**
   * Start polling for connection status
   */
  startStatusPolling = () => {
    // Clear existing interval
    if (this.state.statusPollingInterval) {
      clearInterval(this.state.statusPollingInterval);
    }
    
    // Poll for connection status every 5 seconds
    const statusPollingInterval = setInterval(() => {
      if (this.state.isConnected) {
        bleService.readNetworkStatus().catch(error => {
          console.error('Failed to read network status:', error);
        });
      }
    }, 5000);
    
    this.setState({ statusPollingInterval });
  };

  /**
   * Handle form submit
   */
  handleSubmit = async () => {
    const { ssid, password, isConnected } = this.state;
    
    if (!ssid) {
      this.handleError('Please enter WiFi SSID');
      return;
    }
    
    if (!isConnected) {
      this.handleError('Not connected to device');
      return;
    }
    
    try {
      this.setState({ isLoading: true });
      
      showLoading({
        title: 'Configuring...'
      });
      
      // Get default home
      const home = await tuyaService.getDefaultHome();
      
      if (!home) {
        throw new Error('Failed to get home');
      }
      
      // Get pairing token
      const token = await tuyaService.getPairingToken(home.homeId);
      
      if (!token) {
        throw new Error('Failed to get pairing token');
      }
      
      // Store token in global data
      const app = getApp();
      app.globalData.pairingToken = token;
      
      // Set WiFi credentials
      await bleService.setWifiCredentials(ssid, password, token);
      
      // Store WiFi credentials in global data
      app.globalData.wifiCredentials = { ssid, password };
      
      // Show success toast
      showToast({
        title: 'WiFi credentials sent',
        icon: 'success',
        duration: 2000
      });
      
      // Continue polling for connection status
      this.startStatusPolling();
      
    } catch (error) {
      this.handleError(`Failed to configure WiFi: ${error.message || error}`);
    } finally {
      this.setState({ isLoading: false });
      hideLoading();
    }
  };

  /**
   * Handle SSID change
   * @param {Object} e - Event object
   */
  handleSsidChange = (e) => {
    this.setState({ ssid: e.detail.value });
  };

  /**
   * Handle password change
   * @param {Object} e - Event object
   */
  handlePasswordChange = (e) => {
    this.setState({ password: e.detail.value });
  };

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility = () => {
    this.setState(prevState => ({
      showPassword: !prevState.showPassword
    }));
  };

  /**
   * Get connection status text
   * @returns {string} - Status text
   */
  getConnectionStatusText() {
    const { connectionStatus } = this.state;
    
    if (connectionStatus === null) {
      return 'Unknown';
    }
    
    switch (connectionStatus) {
      case CONNECTION_STATUS.DISCONNECTED:
        return 'Disconnected';
      case CONNECTION_STATUS.CONNECTING:
        return 'Connecting to WiFi...';
      case CONNECTION_STATUS.CONNECTED:
        return 'Connected to WiFi';
      case CONNECTION_STATUS.ONLINE:
        return 'Online';
      default:
        return 'Unknown';
    }
  }

  render() {
    const {
      isConnected,
      isConnecting,
      isLoading,
      showPassword,
      ssid,
      password,
      error,
      connectionStatus
    } = this.state;

    return (
      <View className="container">
        <View className="header">
          <Text className="title">WiFi Configuration</Text>
          <Text className="subtitle">
            Configure WiFi settings for your FoxESS inverter
          </Text>
        </View>

        <View className="content">
          <View className="connection-status">
            <Text className="status-label">Connection Status:</Text>
            <Text className={`status-value ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>

          {connectionStatus !== null && (
            <View className="network-status">
              <Text className="status-label">Network Status:</Text>
              <Text className="status-value">
                {this.getConnectionStatusText()}
              </Text>
            </View>
          )}

          <Form className="wifi-form">
            <View className="form-item">
              <Text className="form-label">WiFi SSID</Text>
              <Input
                className="form-input"
                value={ssid}
                placeholder="Enter WiFi SSID"
                onInput={this.handleSsidChange}
                disabled={!isConnected || isLoading}
              />
            </View>

            <View className="form-item">
              <Text className="form-label">WiFi Password</Text>
              <View className="password-input-container">
                <Input
                  className="form-input password-input"
                  value={password}
                  placeholder="Enter WiFi Password"
                  password={!showPassword}
                  onInput={this.handlePasswordChange}
                  disabled={!isConnected || isLoading}
                />
                <View
                  className="password-toggle"
                  onClick={this.togglePasswordVisibility}
                >
                  <Text className="password-toggle-text">
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </View>
              </View>
            </View>
          </Form>

          {error && (
            <View className="error-container">
              <Text className="error-text">{error}</Text>
            </View>
          )}
        </View>

        <View className="footer">
          <Button
            className="submit-button"
            type="primary"
            loading={isLoading}
            disabled={!isConnected || isLoading || !ssid}
            onClick={this.handleSubmit}
          >
            Configure WiFi
          </Button>
        </View>
      </View>
    );
  }
}
