# FoxESS Pairing Mini App

A mini app for pairing FoxESS hybrid inverters with local WiFi networks using the FoxESS Bluetooth protocol.

## Overview

This mini app enables users to connect their FoxESS hybrid inverters to their local WiFi network. It implements the FoxESS Bluetooth pairing protocol to establish a connection with the inverter and configure its Wi-Fi settings, allowing the inverter to connect to the internet.

## Features

- Scan for FoxESS inverters using enhanced Bluetooth discovery
- Connect to FoxESS inverters via BLE with improved device detection
- Configure Wi-Fi settings for the inverter using the proper FoxESS protocol
- Real-time monitoring of connection status with protocol-compliant response parsing
- Correct implementation of chunked BLE writes for reliability

## Technical Details

### FoxESS Protocol Implementation

The mini app implements the FoxESS Bluetooth pairing protocol with precise adherence to the specification:

- **Service UUID**: 0x00FF (FoxESS proprietary service)
- **Characteristic UUID**: 0xFF01 (Used for both reading and writing)
- **WiFi Configuration Command (0x3B)**: 
  ```
  55 AA 3B <len> SSID\0 PASS\0 CRC16
  ```
- **Status Response Command (0x3A)**:
  ```
  55 AA 3A <len> <status> CRC16
  ```
- **CRC-16 MODBUS** checksum calculation for data integrity
- **Chunked BLE writes** (20-byte max per packet) for reliable transmission

### Key Protocol Features

- **Enhanced device discovery** that looks beyond service UUID to find all FoxESS devices
- **Notification handling** to receive real-time status updates from the inverter
- **Proper packet framing** with 0x55AA headers and command codes
- **Status monitoring** to confirm successful WiFi connection

## Project Structure

```
tuya-foxess-pairing/
├── pages/                # App pages
│   ├── index/            # Home page - entry point for the app
│   ├── scan/             # Device scanning page - finds FoxESS inverters
│   ├── config/           # Wi-Fi configuration page - sends WiFi settings
│   └── result/           # Pairing result page - shows connection status
├── services/             # Service modules
│   └── tuya-service.js   # Service API (minimal implementation)
├── utils/                # Utility functions
│   └── crc16.js          # CRC-16 MODBUS implementation for packet integrity
├── app.js                # App entry point
├── app.json              # App configuration
└── esbuild.config.js     # Build configuration
```

## Development

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- WeChat DevTools (for testing in wx environment) or Tuya MiniApp DevTools

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server with either:
   ```
   # For WeChat environment
   npm run dev:wx
   
   # For Tuya MiniApp environment
   npm run dev:tuya
   ```

### Key Implementation Notes

- The BLE scanning implementation has been improved to find all FoxESS devices regardless of how they advertise
- WiFi configuration uses the proper FoxESS protocol format with 0x55AA header and 0x3B command
- All BLE writes are chunked to 20-byte segments for maximum compatibility
- Real-time status updates are received via notifications on the same characteristic
- The app listens for the specific 0x3A response that indicates successful WiFi connection

### Building for Deployment

```
npm run build
```

## Testing

To test the app with a real inverter:

1. Make sure your Bluetooth is enabled
2. Launch the app and tap "Start Pairing"
3. Select your FoxESS inverter from the list
4. Enter your WiFi SSID and password
5. The app will send the configuration and monitor for connection success

## License

This project is licensed under the MIT License - see the LICENSE file for details.
