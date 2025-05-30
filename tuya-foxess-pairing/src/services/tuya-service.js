import { request } from '@ray-js/api';

/**
 * Tuya cloud service for handling API operations
 */
class TuyaService {
  /**
   * Get a Bluetooth pairing token from Tuya cloud
   * @param {string} homeId - Home ID to associate the device with
   * @param {string} timeZoneId - Time zone ID (e.g., 'Asia/Singapore')
   * @returns {Promise<string>} - Pairing token
   */
  async getPairingToken(homeId, timeZoneId = 'Asia/Singapore') {
    try {
      const response = await request({
        url: '/v1.0/iot-03/device-registration/token',
        method: 'POST',
        data: {
          asset_id: String(homeId),
          pairing_type: 'Bluetooth',
          time_zone_id: timeZoneId
        }
      });
      
      if (response.data && response.data.result && response.data.result.token) {
        return response.data.result.token;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to get pairing token:', error);
      throw error;
    }
  }
  
  /**
   * Get the current user's home list
   * @returns {Promise<Array>} - List of homes
   */
  async getHomeList() {
    try {
      const response = await request({
        url: '/v1.0/homes',
        method: 'GET'
      });
      
      if (response.data && response.data.result) {
        return response.data.result;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to get home list:', error);
      throw error;
    }
  }
  
  /**
   * Get the current user's default home
   * @returns {Promise<Object>} - Default home
   */
  async getDefaultHome() {
    try {
      const homes = await this.getHomeList();
      
      if (homes && homes.length > 0) {
        return homes[0];
      } else {
        throw new Error('No homes found');
      }
    } catch (error) {
      console.error('Failed to get default home:', error);
      throw error;
    }
  }
  
  /**
   * Check device activation status
   * @param {string} token - Pairing token
   * @returns {Promise<Object>} - Activation status
   */
  async checkActivationStatus(token) {
    try {
      const response = await request({
        url: `/v1.0/iot-03/device-registration/tokens/${token}`,
        method: 'GET'
      });
      
      if (response.data && response.data.result) {
        return response.data.result;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to check activation status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tuyaService = new TuyaService();
