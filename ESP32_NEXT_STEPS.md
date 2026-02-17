# 🚀 ESP32 Setup - Next Steps

Congratulations on getting your ESP32! Here's everything you need to get it working with your Staff Presence Verification System.

---

## 📚 **Documentation Index**

We've created comprehensive guides for you:

### **1. Quick Start (Start Here!)**
📄 **`ESP32_QUICK_START.md`**
- 30-second overview
- Configuration template
- Common issues reference card
- **Perfect for: Getting up and running fast**

### **2. Complete Setup Guide**
📄 **`ESP32_SETUP_GUIDE.md`**
- Detailed step-by-step instructions
- Arduino IDE installation
- Firmware configuration
- USB driver setup
- Troubleshooting section
- **Perfect for: First-time ESP32 users**

### **3. Testing Checklist**
📄 **`ESP32_TESTING_CHECKLIST.md`**
- Phase-by-phase verification
- Complete integration testing
- Success criteria
- Quality assurance checklist
- **Perfect for: Ensuring everything works correctly**

---

## ⚡ **Super Quick Start (5 Steps)**

### **Step 1: Install Arduino IDE**
Download from: https://www.arduino.cc/en/software

### **Step 2: Add ESP32 Support**
In Arduino IDE:
- File → Preferences
- Add this URL to "Additional Boards Manager URLs":
  ```
  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
  ```
- Tools → Board → Boards Manager → Search "esp32" → Install

### **Step 3: Configure Firmware**
Edit `firmware/esp32_presence.ino` (around line 20):

```cpp
// YOUR WiFi credentials
const char* ssid = "YourWiFiName";
const char* password = "YourWiFiPassword";

// YOUR computer's IP (find with: ipconfig in CMD)
const char* serverUrl = "http://192.168.1.XXX:5000/api/ble-data";

// Location name for this ESP32
const char* classroomId = "ROOM_101";
```

### **Step 4: Upload to ESP32**
1. Connect ESP32 via USB
2. In Arduino IDE:
   - Tools → Board → **ESP32 Dev Module**
   - Tools → Port → **COM3** (or whichever appears)
3. Click **Upload** (→ button)
4. Wait 1-2 minutes

### **Step 5: Verify**
Open Serial Monitor (`Tools → Serial Monitor`, set to 115200 baud):

✅ **Success looks like:**
```
Connected to WiFi!
Starting BLE Scan...
Scan complete. Devices found: 0
```

❌ **Problem looks like:**
```
WiFi Disconnected    ← Check WiFi credentials
Error code: -1       ← Backend not running or wrong IP
```

---

## 🧪 **Testing Without Real BLE Tags**

### **Option 1: Use Your Smartphone**
1. Install a BLE beacon app:
   - **Android**: "nRF Connect" or "Beacon Simulator"
   - **iOS**: "Locate Beacon"
2. Enable iBeacon broadcasting
3. ESP32 should detect your phone!

### **Option 2: Use Python Simulation**
```bash
cd simulation
pip install -r requirements.txt
python scanner.py
```

---

## 📋 **Before You Start - Checklist**

- [ ] ESP32 board (you have this!)
- [ ] USB cable (micro-USB or USB-C depending on model)
- [ ] WiFi network (2.4GHz - ESP32 doesn't support 5GHz!)
- [ ] Computer with Arduino IDE
- [ ] Backend running (`cd backend && npm start`)
- [ ] Know your computer's IP address (`ipconfig` in CMD)

---

## 🔧 **Quick Troubleshooting**

### **Can't find ESP32 COM port?**
→ Install USB drivers:
- **CP210x**: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- **CH340**: http://www.wch-ic.com/downloads/CH341SER_EXE.html

### **Upload fails?**
→ Hold **BOOT** button on ESP32 while clicking Upload

### **ESP32 can't connect to WiFi?**
→ Make sure you're using **2.4GHz WiFi** (not 5GHz)
→ Check WiFi name and password are correct (case-sensitive!)

### **Backend not receiving data?**
→ Verify your computer's IP hasn't changed: `ipconfig`
→ Make sure backend is running: `cd backend && npm start`
→ Check Windows Firewall allows port 5000

---

## 🎯 **What Happens Next?**

Once your ESP32 is set up:

1. **It scans for BLE devices every 10 seconds**
2. **Detects staff BLE tags when they enter the room**
3. **Sends data to your backend server**
4. **Backend logs attendance automatically**
5. **Admin dashboard updates in real-time**
6. **Alerts sent for late arrivals**

---

## 🆘 **Need More Help?**

1. **Read the guides** (see Documentation Index above)
2. **Check the testing checklist** for systematic verification
3. **Review backend logs** for error messages
4. **Check Serial Monitor** for ESP32 status messages

---

## 📁 **Project Structure**

```
Staff-Presence-Verification/
├── firmware/
│   └── esp32_presence.ino        ← ESP32 code (edit this!)
├── backend/
│   ├── server.js                  ← BLE endpoint at line 729
│   └── .env                       ← RSSI threshold config
├── frontend/
│   └── ...                        ← Admin dashboard
├── simulation/
│   └── scanner.py                 ← Test without real hardware
├── ESP32_QUICK_START.md          ← Start here!
├── ESP32_SETUP_GUIDE.md          ← Complete guide
└── ESP32_TESTING_CHECKLIST.md    ← Verification steps
```

---

## 🎓 **Learning Resources**

- **ESP32 Official Docs**: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/
- **Arduino ESP32 Library**: https://github.com/espressif/arduino-esp32
- **BLE on ESP32**: https://randomnerdtutorials.com/esp32-bluetooth-low-energy-ble-arduino-ide/

---

## 🌟 **Good Luck!**

You're all set! Follow the Quick Start guide, and you'll have your ESP32 scanning for staff presence in no time.

**First step:** Open `ESP32_QUICK_START.md` and follow the 30-second setup!

---

*Questions? Check the troubleshooting sections in the guides or review the Serial Monitor output for specific error messages.*
