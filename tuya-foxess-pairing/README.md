# FoxESS Pairing Mini App

A Tuya mini app for pairing with FoxESS hybrid inverters using the FoxESS Bluetooth pairing protocol.

## Overview

This mini app enables users to connect their FoxESS hybrid inverters to the Tuya IoT platform. It implements the FoxESS Bluetooth pairing protocol to establish a connection with the inverter and configure its Wi-Fi settings.

## Features

- Scan for FoxESS inverters using Bluetooth
- Connect to FoxESS inverters via BLE
- Configure Wi-Fi settings for the inverter
- Monitor connection status
- Integrate with Tuya cloud for device activation

## Technical Details

### FoxESS Protocol Implementation

The mini app implements the FoxESS Bluetooth pairing protocol, which includes:

- Service UUID: 0x00FF
- Characteristic UUID: 0xFF01
- Custom packet format with headers, function codes, and CRC-16 MODBUS checksum

### Tuya Integration

The mini app integrates with the Tuya cloud to:

- Obtain a Bluetooth pairing token
- Activate the device on the Tuya IoT platform

## Project Structure

```
tuya-foxess-pairing/
├── src/
│   ├── assets/           # Static assets (images, etc.)
│   ├── components/       # Reusable UI components
│   ├── pages/            # App pages
│   │   ├── index/        # Home page
│   │   ├── scan/         # Device scanning page
│   │   ├── config/       # Wi-Fi configuration page
│   │   └── result/       # Pairing result page
│   ├── services/         # Service modules
│   │   ├── ble-service.js    # Bluetooth service
│   │   └── tuya-service.js   # Tuya cloud service
│   ├── utils/            # Utility functions
│   │   ├── crc.js            # CRC-16 MODBUS implementation
│   │   └── foxess-protocol.js # FoxESS protocol implementation
│   └── app.js            # App entry point
├── ray.config.js         # Ray.js configuration
└── package.json          # Project dependencies
```

## Development

### Prerequisites

- Node.js (v12 or later)
- npm or yarn
- Ray.js CLI

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

### Building for Production

```
npm run build
```

## Deployment

To deploy the mini app to the Tuya Mini App Store:

1. Build the project
2. Upload the build to the Tuya Mini App Developer Center
3. Submit for review

## License

This project is licensed under the MIT License - see the LICENSE file for details.
