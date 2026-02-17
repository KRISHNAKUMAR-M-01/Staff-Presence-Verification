# ESP32 Setup Guide for Staff Presence Verification System

## 📦 What You Need

1. **ESP32 Board** (you have this!)
2. **USB Cable** (micro-USB or USB-C depending on your ESP32 model)
3. **Computer** with Arduino IDE installed
4. **WiFi Network** (same network your backend server runs on)

---

## 🛠️ Step-by-Step Setup

### **1. Install Arduino IDE & ESP32 Support**

#### A. Download Arduino IDE
1. Go to https://www.arduino.cc/en/software
2. Download **Arduino IDE 2.x** (latest version recommended)
3. Install  on your Windows computer

#### B. Add ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences** (or Ctrl+Comma)
3. In **"Additional Boards Manager URLs"**, paste this URL:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**
5. Go to **Tools → Board → Boards Manager**
6. Search for **"esp32"**
7. Install **"esp32 by Espressif Systems"** (latest version)
8. Wait for installation to complete

#### C. Install USB Drivers (if needed)
- Most ESP32 boards use **CP210x** or **CH340** USB-to-Serial chips
- If Windows doesn't recognize your ESP32 when plugged in:
  - **For CP210x**: Download from https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
  - **For CH340**: Download from http://www.wch-ic.com/downloads/CH341SER_EXE.html

---

### **2. Configure Your Computer's IP Address**

The ESP32 needs to know where to send data. You need your computer's local IP address.

1. Open **Command Prompt** (Win + R, type `cmd`, press Enter)
2. Type: `ipconfig`
3. Look for **"IPv4 Address"** under your WiFi adapter
   - Example: `192.168.1.100`
4. **Write this down** - you'll need it in Step 3!

---

### **3. Configure the Firmware**

1. Open the file: **`d:\Staff-Presence-Verification\firmware\esp32_presence.ino`**
2. Edit the configuration lines (around line 20-30):

```cpp
// Replace with YOUR WiFi name
const char* ssid = "YOUR_WIFI_SSID";          

// Replace with YOUR WiFi password
const char* password = "YOUR_WIFI_PASSWORD";  

// Replace YOUR_BACKEND_IP with the IP from Step 2
// Example: "http://192.168.1.100:5000/api/ble-data"
const char* serverUrl = "http://YOUR_BACKEND_IP:5000/api/ble-data";

// Give this ESP32 a location name (e.g., "CS_LAB", "STAFF_ROOM", etc.)
const char* classroomId = "ROOM_101";
```

**⚠️ Important Notes:**
- WiFi SSID and password are **case-sensitive**
- Use your computer's **local IP** (from Step 2), not "localhost"
- Keep the port `:5000` and path `/api/ble-data` as-is
- The `classroomId` should match what you register in your backend

---

### **4. Upload Firmware to ESP32**

#### A. Connect Your ESP32
1. Plug ESP32 into your computer via USB cable
2. Wait for Windows to recognize it

#### B. Select Board and Port
1. In Arduino IDE, go to **Tools → Board → esp32**
2. Select your specific ESP32 model:
   - For generic ESP32: **"ESP32 Dev Module"**
   - For ESP32-WROOM: **"ESP32 Dev Module"**
   - For ESP32-S3: **"ESP32-S3 Dev Module"**
   - For NodeMCU-32S: **"NodeMCU-32S"**
   *(If unsure, try "ESP32 Dev Module" - it works for most boards)*

3. Go to **Tools → Port**
4. Select the COM port that appears (e.g., **COM3**, **COM4**, etc.)
   - If multiple ports appear, unplug ESP32, note which port disappears, then plug it back in
   - If NO port appears, you need USB drivers (see Step 1C)

#### C. Upload the Code
1. In Arduino IDE, open: **`d:\Staff-Presence-Verification\firmware\esp32_presence.ino`**
2. Click the **Upload** button (→ arrow icon) or press **Ctrl+U**
3. Wait for compilation and upload (this takes 1-2 minutes)
4. You should see:
   ```
   Connecting........_____.....
   Writing at 0x00008000...
   ...
   Hard resetting via RTS pin...
   ```
5. **Success!** Your ESP32 is now programmed

---

### **5. Monitor Serial Output**

1. In Arduino IDE, go to **Tools → Serial Monitor** (or Ctrl+Shift+M)
2. Set baud rate to **115200** (bottom-right dropdown)
3. You should see output like:
   ```
   Connecting to WiFi.....
   Connected to WiFi!
   Starting BLE Scan...
   Found Device: AA:BB:CC:DD:EE:FF, RSSI: -45
   HTTP Response code: 200
   Scan complete. Devices found: 3
   ```

**What the messages mean:**
- **"Connecting to WiFi"** - ESP32 is trying to connect to your WiFi
- **"Connected to WiFi!"** - ✅ WiFi connection successful
- **"Starting BLE Scan"** - ESP32 is scanning for Bluetooth devices
- **"Found Device"** - Detected a BLE beacon/device
- **"HTTP Response code: 200"** - ✅ Successfully sent data to backend
- **"Error code: -1"** - ❌ Can't reach backend server (check IP address)

---

### **6. Verify Backend Connection**

#### A. Start Your Backend Server
```bash
cd d:\Staff-Presence-Verification\backend
npm start
```

You should see your backend logs showing incoming BLE data:
```
POST /api/ble-data 200
Received BLE data: { esp32_id: 'ROOM_101', beacon_uuid: 'AA:BB:CC:DD:EE:FF', rssi: -45 }
```

#### B. Check Your Admin Dashboard
1. Start frontend:
   ```bash
   cd d:\Staff-Presence-Verification\frontend
   npm run dev
   ```
2. Open browser: http://localhost:5173
3. Login as admin
4. You should see real-time updates when staff BLE tags are detected!

---

## 🔧 Troubleshooting

### **Problem: "WiFi Disconnected" keeps appearing**
**Solution:** 
- Double-check WiFi SSID and password (case-sensitive!)
- Make sure ESP32 is within WiFi range
- Try 2.4GHz WiFi (ESP32 doesn't support 5GHz)

### **Problem: "Error code: -1" when sending data**
**Solution:**
- Verify your computer's IP address hasn't changed
- Make sure backend server is running (`npm start` in backend folder)
- Check if firewall is blocking port 5000
- Ping your backend: Open CMD and type `ping YOUR_IP`

### **Problem: No COM port appears**
**Solution:**
- Install USB drivers (Step 1C)
- Try a different USB cable (some cables are power-only)
- Try a different USB port on your computer

### **Problem: Upload fails with "timeout" error**
**Solution:**
- Hold the **BOOT** button on ESP32 while clicking Upload
- Release BOOT button when you see "Connecting..." message
- Some ESP32 boards require this for first-time upload

### **Problem: Scan finds 0 devices**
**Solution:**
- BLE tags need to be powered on and nearby
- For testing, use the simulation: `d:\Staff-Presence-Verification\simulation\`
- Or use your smartphone with a BLE beacon app like "nRF Connect" or "Beacon Simulator"

---

## 📱 Testing with Your Phone (Quick Test)

Before getting actual BLE tags, test with your phone:

1. **Install a BLE Beacon App**:
   - Android: "nRF Connect" or "Beacon Simulator"
   - iOS: "Locate Beacon"

2. **Configure as iBeacon**:
   - Set transmission power to maximum
   - Start broadcasting

3. **Watch Serial Monitor**:
   - You should see your phone's MAC address appear
   - Backend should receive the data

---

## 🎯 Next Steps After ESP32 is Working

1. **Register ESP32 in Database**:
   - Add the `classroomId` to your database's classrooms/locations table
   - Link it to specific departments/subjects

2. **Deploy Multiple ESP32s**:
   - Flash same firmware to multiple boards
   - Change `classroomId` for each location
   - Place one ESP32 per classroom/area

3. **Get BLE Tags**:
   - Order NRF51822 BLE tags or iBeacon tags
   - Assign each tag to a staff member
   - Register tag UUIDs in your database

4. **Fine-tune RSSI Threshold**:
   - Adjust in backend `.env` file (`RSSI_THRESHOLD`)
   - Typical indoor range: -60 to -80 dBm

---

## 📚 Useful Commands Reference

**Find your IP:**
```bash
ipconfig
```

**Start Backend:**
```bash
cd d:\Staff-Presence-Verification\backend
npm start
```

**Start Frontend:**
```bash
cd d:\Staff-Presence-Verification\frontend
npm run dev
```

**Run Simulation (for testing without real hardware):**
```bash
cd d:\Staff-Presence-Verification\simulation
node simulate_scanner.js
```

---

## ⚡ Quick Checklist

- [ ] Arduino IDE installed
- [ ] ESP32 board support installed
- [ ] USB drivers installed (if needed)
- [ ] Firmware configured with WiFi credentials
- [ ] Firmware configured with backend IP address
- [ ] ESP32 connected to computer
- [ ] Correct board and port selected
- [ ] Firmware uploaded successfully
- [ ] Serial monitor shows WiFi connection
- [ ] Backend server is running
- [ ] Serial monitor shows "HTTP Response code: 200"
- [ ] Dashboard shows real-time updates

---

**Need help?** Check the troubleshooting section or review the serial monitor output for specific error messages!
