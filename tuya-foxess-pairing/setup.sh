#!/bin/bash

# FoxESS Pairing Mini App Setup Script

echo "Setting up FoxESS Pairing Mini App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm and try again."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if Ray.js CLI is installed
if ! command -v ray &> /dev/null; then
    echo "Ray.js CLI is not installed. Installing..."
    npm install -g @ray-js/cli
fi

echo "Setup complete!"
echo "To start the development server, run: npm start"
echo "To build the app for production, run: npm run build"
