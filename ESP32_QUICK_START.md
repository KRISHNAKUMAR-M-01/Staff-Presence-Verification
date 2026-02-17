# ESP32 Quick Start Card

## 🚀 30-Second Setup

1. **Install Arduino IDE** → Add ESP32 board support
2. **Edit firmware** (`firmware/esp32_presence.ino`):
   - Add your WiFi name and password
   - Add your computer's IP address
3. **Connect ESP32** → Select board + port → Click Upload
4. **Start backend** → Watch serial monitor → Done!

---

## 📝 Configuration Template

```cpp
// Copy this into your esp32_presence.ino file

const char* ssid = "YourWiFiName";              // Your WiFi SSID
const char* password = "YourWiFiPassword";       // Your WiFi Password
const char* serverUrl = "http://192.168.1.XXX:5000/api/ble-data";  // Your PC's IP
const char* classroomId = "ROOM_101";            // Location name
```

### How to find your PC's IP:
```bash
# Windows Command Prompt
ipconfig

# Look for "IPv4 Address" → Example: 192.168.1.100
```

---

## 🔌 First Upload Checklist

- [ ] ESP32 plugged into USB
- [ ] Arduino IDE open
- [ ] Tools → Board → **ESP32 Dev Module**
- [ ] Tools → Port → **COM3** (or whatever appears)
- [ ] WiFi + IP configured in code
- [ ] Click Upload (→) button
- [ ] Wait 1-2 minutes
- [ ] Look for "Hard resetting via RTS pin..." ✅

---

## 👀 What to Watch in Serial Monitor

Open **Tools → Serial Monitor**, set to **115200 baud**

### ✅ Good Output:
```
Connected to WiFi!
Starting BLE Scan...
Found Device: AA:BB:CC:DD:EE:FF, RSSI: -45
HTTP Response code: 200    ← SUCCESS!
```

### ❌ Problems:

**"WiFi Disconnected"**
→ Check WiFi name/password (case-sensitive!)

**"Error code: -1"**
→ Backend not running OR wrong IP address

**"Scan complete. Devices found: 0"**
→ No BLE devices nearby (normal if testing without tags)

---

## 🧪 Quick Test (Without BLE Tags)

**Option 1: Use Your Phone**
1. Install "nRF Connect" app (Android) or "Locate Beacon" (iOS)
2. Enable iBeacon broadcasting
3. ESP32 should detect your phone!

**Option 2: Use Simulation Script**
```bash
cd simulation
node simulate_scanner.js
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| No COM port shows | Install USB drivers (CP210x or CH340) |
| Upload timeout | Hold BOOT button during upload |
| Can't connect to WiFi | Use 2.4GHz WiFi (ESP32 doesn't support 5GHz) |
| Backend not receiving | Check firewall, verify IP address |

---

## 📍 Your System URLs

**Backend API:**
- After starting: `http://localhost:5000`
- BLE endpoint: `http://localhost:5000/api/ble-data`

**Frontend Dashboard:**
- After starting: `http://localhost:5173`

**To Start Services:**
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend  
npm run dev
```

---

## 🎯 Full Documentation

See **ESP32_SETUP_GUIDE.md** for complete detailed instructions!
