# File: simulation/scanner.py

## Overview
`scanner.py` is a Python script that uses a laptop's Bluetooth adapter to simulate an ESP32 scanner. it detects nearby iBeacon devices and reports them to the backend.

## Key Components
- **BleakScanner**: Uses the `bleak` library to perform active BLE scanning.
- **`parse_ibeacon`**: A utility function that extracts the iBeacon UUID from raw manufacturer data.
- **`detection_callback`**: Called whenever a BLE advertisement is detected. It filters for iBeacons and pushes valid detections to an internal queue.
- **`worker`**: Processes the detection queue asynchronously. It implements throttling (`SEND_INTERVAL`) to avoid overwhelming the backend with redundant requests for the same device.
- **`send_data`**: Uses `aiohttp` to send a POST request with the detected `beacon_uuid`, `rssi`, and `esp32_id` to the backend's `/api/ble-data` endpoint.

## Configuration
- `BACKEND_URL`: The URL of the backend API.
- `ESP32_ID`: An identifier that represents the simulated location (e.g., "SIMULATED_LAPTOP_01").
- `RSSI_THRESHOLD`: Signals weaker than this value are ignored.
- `SEND_INTERVAL`: How often to send updates for a specific device to the backend.

## Role in the System
Allows for development and testing of the presence verification logic without requiring physical ESP32 hardware. It turns a computer into a functional node in the tracking network.
