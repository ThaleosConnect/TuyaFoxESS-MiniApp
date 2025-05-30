import { Component } from '@ray-js/core';
import { navigateTo, showToast, showLoading, hideLoading } from '@ray-js/api';
import { View, Text, Button, Image } from '@ray-js/components';
import { tuyaService } from '../../services/tuya-service';
import './result.css';

/**
 * Result page component
 */
export default class Result extends Component {
  state = {
    isLoading: false,
    isCheckingStatus: false,
    pairingStatus: null,
    error: null,
    statusCheckInterval: null
  };

  componentDidMount() {
    // Get pairing status from global data
    const app = getApp();
    const pairingStatus = app.globalData.pairingStatus;
    const pairingToken = app.globalData.pairingToken;
    
    this.setState({ pairingStatus });
    
    // If we have a token, start checking activation status
    if (pairingToken) {
      this.startStatusChecking(pairingToken);
    }
  }

  componentWillUnmount() {
    // Clear status check interval
    if (this.state.statusCheckInterval) {
      clearInterval(this.state.statusCheckInterval);
    }
  }

  /**
   * Start checking activation status
   * @param {string} token - Pairing token
   */
  startStatusChecking = (token) => {
    // Clear existing interval
    if (this.state.statusCheckInterval) {
      clearInterval(this.state.statusCheckInterval);
    }
    
    // Check status immediately
    this.checkActivationStatus(token);
    
    // Then check every 10 seconds
    const statusCheckInterval = setInterval(() => {
      this.checkActivationStatus(token);
    }, 10000);
    
    this.setState({ statusCheckInterval });
  };

  /**
   * Check activation status
   * @param {string} token - Pairing token
   */
  checkActivationStatus = async (token) => {
    if (this.state.isCheckingStatus) {
      return;
    }
    
    try {
      this.setState({ isCheckingStatus: true });
      
      const status = await tuyaService.checkActivationStatus(token);
      
      if (status.activated) {
        // Device activated successfully
        this.setState({ pairingStatus: 'success' });
        
        // Clear interval
        if (this.state.statusCheckInterval) {
          clearInterval(this.state.statusCheckInterval);
          this.setState({ statusCheckInterval: null });
        }
      }
    } catch (error) {
      console.error('Failed to check activation status:', error);
    } finally {
      this.setState({ isCheckingStatus: false });
    }
  };

  /**
   * Handle retry button click
   */
  handleRetry = () => {
    // Navigate back to scan page
    navigateTo({
      url: '/pages/scan/scan'
    });
  };

  /**
   * Handle done button click
   */
  handleDone = () => {
    // Close the mini app
    tt.navigateBack({
      delta: 99 // Navigate back to the first page
    });
  };

  render() {
    const { pairingStatus, error } = this.state;
    
    const isSuccess = pairingStatus === 'success';
    
    return (
      <View className="container">
        <View className="header">
          <Text className="title">
            {isSuccess ? 'Pairing Successful' : 'Pairing Status'}
          </Text>
        </View>

        <View className="content">
          <Image
            className="result-icon"
            src={isSuccess ? '/assets/success.png' : '/assets/pending.png'}
            mode="aspectFit"
          />

          <Text className="result-title">
            {isSuccess
              ? 'Your FoxESS inverter is now connected!'
              : 'Waiting for device to connect...'}
          </Text>

          <Text className="result-description">
            {isSuccess
              ? 'The inverter has been successfully paired and is now online. You can now monitor and control your inverter from the app.'
              : 'The inverter is connecting to WiFi and activating. This may take a few minutes. Please wait...'}
          </Text>

          {error && (
            <View className="error-container">
              <Text className="error-text">{error}</Text>
            </View>
          )}
        </View>

        <View className="footer">
          {isSuccess ? (
            <Button
              className="done-button"
              type="primary"
              onClick={this.handleDone}
            >
              Done
            </Button>
          ) : (
            <Button
              className="retry-button"
              type="default"
              onClick={this.handleRetry}
            >
              Retry
            </Button>
          )}
        </View>
      </View>
    );
  }
}
