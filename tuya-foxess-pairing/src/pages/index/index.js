import { Component } from '@ray-js/core';
import { navigateTo, showToast, showLoading, hideLoading } from '@ray-js/api';
import { View, Text, Button, Image } from '@ray-js/components';
import './index.css';

/**
 * Index page component
 */
export default class Index extends Component {
  state = {
    isBluetoothAvailable: false
  };

  componentDidMount() {
    // Check if Bluetooth is available
    this.checkBluetoothAvailability();
  }

  /**
   * Check if Bluetooth is available
   */
  checkBluetoothAvailability() {
    try {
      const systemInfo = tt.getSystemInfoSync();
      this.setState({
        isBluetoothAvailable: systemInfo.bluetoothEnabled
      });
    } catch (error) {
      console.error('Failed to check Bluetooth availability:', error);
      this.setState({
        isBluetoothAvailable: false
      });
    }
  }

  /**
   * Start the pairing process
   */
  handleStartPairing = () => {
    if (!this.state.isBluetoothAvailable) {
      showToast({
        title: 'Please enable Bluetooth',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // Navigate to scan page
    navigateTo({
      url: '/pages/scan/scan'
    });
  };

  render() {
    const { isBluetoothAvailable } = this.state;

    return (
      <View className="container">
        <View className="header">
          <Text className="title">FoxESS Pairing</Text>
          <Text className="subtitle">Connect your FoxESS hybrid inverter</Text>
        </View>

        <View className="content">
          <Image
            className="logo"
            src="/assets/foxess-logo.png"
            mode="aspectFit"
          />

          <View className="instructions">
            <Text className="instruction-title">Before you begin:</Text>
            <Text className="instruction-item">1. Make sure your FoxESS inverter is powered on</Text>
            <Text className="instruction-item">2. Enable Bluetooth on your device</Text>
            <Text className="instruction-item">3. Have your Wi-Fi credentials ready</Text>
          </View>

          <View className="bluetooth-status">
            <Text className="status-text">
              Bluetooth: {isBluetoothAvailable ? 'Enabled' : 'Disabled'}
            </Text>
            {!isBluetoothAvailable && (
              <Text className="status-warning">
                Please enable Bluetooth to continue
              </Text>
            )}
          </View>
        </View>

        <View className="footer">
          <Button
            className="start-button"
            type="primary"
            disabled={!isBluetoothAvailable}
            onClick={this.handleStartPairing}
          >
            Start Pairing
          </Button>
        </View>
      </View>
    );
  }
}
