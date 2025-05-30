import { Component } from '@ray-js/core';
import { navigateTo, showToast, showLoading, hideLoading } from '@ray-js/api';
import { View, Text, Button, Image, ScrollView } from '@ray-js/components';
import { bleService } from '../../services/ble-service';
import './scan.css';

/**
 * Scan page component
 */
export default class Scan extends Component {
  state = {
    isScanning: false,
    devices: [],
    error: null
  };

  componentDidMount() {
    // Set error callback
    bleService.setErrorCallback(this.handleError);
  }

  componentWillUnmount() {
    // Stop scanning when component unmounts
    this.stopScan();
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
   * Start scanning for devices
   */
  startScan = async () => {
    try {
      this.setState({
        isScanning: true,
        devices: [],
        error: null
      });

      showLoading({
        title: 'Scanning...'
      });

      await bleService.startScan(this.handleDeviceFound);

      // Auto-stop scanning after 30 seconds
      this.scanTimeout = setTimeout(() => {
        this.stopScan();
      }, 30000);
    } catch (error) {
      this.handleError(`Failed to start scanning: ${error.message || error}`);
      this.setState({ isScanning: false });
      hideLoading();
    }
  };

  /**
   * Stop scanning for devices
   */
  stopScan = async () => {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    if (this.state.isScanning) {
      try {
        await bleService.stopScan();
      } catch (error) {
        console.error('Failed to stop scanning:', error);
      } finally {
        this.setState({ isScanning: false });
        hideLoading();
      }
    }
  };

  /**
   * Handle device found
   * @param {Object} device - Device object
   */
  handleDeviceFound = (device) => {
    const { devices } = this.state;
    
    // Check if device already exists in the list
    const existingDeviceIndex = devices.findIndex(d => d.deviceId === device.deviceId);
    
    if (existingDeviceIndex >= 0) {
      // Update existing device
      const updatedDevices = [...devices];
      updatedDevices[existingDeviceIndex] = device;
      this.setState({ devices: updatedDevices });
    } else {
      // Add new device
      this.setState({ devices: [...devices, device] });
    }
  };

  /**
   * Handle device selection
   * @param {Object} device - Selected device
   */
  handleDeviceSelect = async (device) => {
    // Stop scanning
    await this.stopScan();

    // Store selected device in global data
    const app = getApp();
    app.globalData.selectedDevice = device;

    // Navigate to config page
    navigateTo({
      url: '/pages/config/config'
    });
  };

  /**
   * Get signal strength icon based on RSSI
   * @param {number} rssi - RSSI value
   * @returns {string} - Icon name
   */
  getSignalIcon(rssi) {
    if (rssi >= -60) {
      return '/assets/signal-strong.png';
    } else if (rssi >= -75) {
      return '/assets/signal-medium.png';
    } else {
      return '/assets/signal-weak.png';
    }
  }

  render() {
    const { isScanning, devices, error } = this.state;

    return (
      <View className="container">
        <View className="header">
          <Text className="title">Select Device</Text>
          <Text className="subtitle">
            Select your FoxESS inverter from the list below
          </Text>
        </View>

        <View className="content">
          {devices.length === 0 ? (
            <View className="empty-state">
              <Image
                className="empty-icon"
                src="/assets/bluetooth-search.png"
                mode="aspectFit"
              />
              <Text className="empty-text">
                {isScanning
                  ? 'Searching for devices...'
                  : 'No devices found. Tap the button below to start scanning.'}
              </Text>
            </View>
          ) : (
            <ScrollView className="device-list" scrollY>
              {devices.map((device) => (
                <View
                  key={device.deviceId}
                  className="device-item"
                  onClick={() => this.handleDeviceSelect(device)}
                >
                  <View className="device-info">
                    <Text className="device-name">
                      {device.name || 'Unknown Device'}
                    </Text>
                    <Text className="device-id">{device.deviceId}</Text>
                  </View>
                  <View className="device-signal">
                    <Image
                      className="signal-icon"
                      src={this.getSignalIcon(device.RSSI)}
                      mode="aspectFit"
                    />
                    <Text className="signal-text">{device.RSSI} dBm</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {error && (
            <View className="error-container">
              <Text className="error-text">{error}</Text>
            </View>
          )}
        </View>

        <View className="footer">
          <Button
            className="scan-button"
            type="primary"
            loading={isScanning}
            onClick={isScanning ? this.stopScan : this.startScan}
          >
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </Button>
        </View>
      </View>
    );
  }
}
