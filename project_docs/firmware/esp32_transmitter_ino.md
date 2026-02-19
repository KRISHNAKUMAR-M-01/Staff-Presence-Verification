# File: firmware/esp32_transmitter.ino

## Overview
This Arduino sketch configures an ESP32 to act as a **Transmitter (Tag)**. It broadcasts a unique iBeacon signal that the system's scanners (Receiver ESP32s or the simulation script) can detect.

## Key Components
- **BLE Initialization**: Sets up the ESP32 BLE hardware in "Advertising" mode.
- **`setBeacon`**: Constructs a standard iBeacon payload.
  - **UUID**: A unique 16-byte identifier. **This must match the UUID stored in the database for the staff member.**
  - **Manufacturer ID**: Set to `0x4C00` (Apple) to comply with the iBeacon standard.
  - **Major/Minor**: Set to 1/1 (standard default values).
- **Advertisement Data**: Packages the iBeacon data into a BLE advertisement packet.
- **Low Power Logic**: While the current code runs continuously, this device's primary job is simply to broadcast its presence.

## How to Use
1. Open this file in the Arduino IDE.
2. Change the `BEACON_UUID` at the top to match the ID you've assigned to a staff member in your database.
3. Upload to the ESP32 that the staff member will carry.

## Role in the System
The "Tag" carried by the staff. It is the object being tracked. Without this transmitter, the scanners would have nothing to detect.
