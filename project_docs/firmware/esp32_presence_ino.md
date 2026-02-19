# File: firmware/esp32_presence.ino

## Overview
This Arduino sketch is designed for an ESP32 microcontroller to act as a fixed presence scanner in a classroom. it connects to Wi-Fi, scans for BLE iBeacons, and reports detections to the backend.

## Key Components
- **Wi-Fi Connectivity**: Connects to the local network using the provided `ssid` and `password`.
- **BLE Initialization**: Sets up the ESP32's BLE hardware to perform active scanning.
- **`MyAdvertisedDeviceCallbacks`**: A custom callback class that is triggered for every detected BLE device.
  - **iBeacon Detection**: It manually parses the BLE payload searching for the iBeacon pattern (`0x4C 0x00 0x02 0x15`).
  - **UUID Extraction**: Once an iBeacon is found, it extracts the 16-byte UUID and converts it to a hex string.
- **`sendDataToBackend`**: Uses the `HTTPClient` library to send detected UUIDs and their signal strength (RSSI) to the backend API via a JSON POST request.
- **Main Loop**: Continuously performs a 5-second scan, waits for another 5 seconds, and repeats.

## Configuration
- `ssid` / `password`: Wi-Fi credentials.
- `serverUrl`: The endpoint on the backend server (`/api/ble-data`).
- `classroomId`: An identifier for this specific ESP32 node (e.g., "ROOM_101"), which map to a classroom in the database.

## Role in the System
The physical hardware component responsible for capturing presence data in the real world. It bridges the gap between physical BLE beacons (held by staff) and the digital tracking system.
