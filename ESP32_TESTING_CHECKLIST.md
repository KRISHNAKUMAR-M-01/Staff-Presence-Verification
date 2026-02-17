# ESP32 Testing & Verification Checklist

## 🎯 Complete Testing Flow

Follow this checklist to verify your ESP32 is working correctly with your Staff Presence Verification system.

---

## **Phase 1: Hardware Setup** ✓

- [ ] ESP32 board received and unpacked
- [ ] USB cable available (correct type for your ESP32)
- [ ] Arduino IDE installed on Windows
- [ ] ESP32 board support added to Arduino IDE
- [ ] USB drivers installed (if needed - CP210x or CH340)

---

## **Phase 2: Firmware Configuration** ✓

### Get Your Computer's IP Address
```bash
# Open Command Prompt and run:
ipconfig

# Note down your IPv4 Address (e.g., 192.168.1.100)
```

### Edit `firmware/esp32_presence.ino`
- [ ] WiFi SSID set (line ~21)
- [ ] WiFi password set (line ~22)
- [ ] Backend server URL set with YOUR computer's IP (line ~27)
  - Format: `"http://192.168.1.XXX:5000/api/ble-data"`
- [ ] Classroom ID set (give your ESP32 a location name) (line ~31)

**Example Config:**
```cpp
const char* ssid = "MyHomeWiFi";
const char* password = "MyPassword123";
const char* serverUrl = "http://192.168.1.100:5000/api/ble-data";
const char* classroomId = "CS_LAB";
```

---

## **Phase 3: Upload Firmware** ✓

### In Arduino IDE:
- [ ] ESP32 connected via USB
- [ ] Correct board selected: `Tools → Board → ESP32 Dev Module`
- [ ] Correct COM port selected: `Tools → Port → COM3` (or whichever appears)
- [ ] Upload speed: `Tools → Upload Speed → 115200`
- [ ] Firmware uploaded successfully (Click Upload button)
- [ ] See message: "Hard resetting via RTS pin..."

### If Upload Fails:
- [ ] Hold BOOT button on ESP32 while clicking Upload
- [ ] Try different USB cable
- [ ] Check USB drivers are installed

---

## **Phase 4: Serial Monitor Check** ✓

### Open Serial Monitor:
`Tools → Serial Monitor` (or Ctrl+Shift+M)

### Set Baud Rate:
- [ ] Baud rate set to **115200** (bottom-right dropdown)

### Expected Output:
```
Connecting to WiFi.....
Connected to WiFi!
Starting BLE Scan...
Scan complete. Devices found: 0
Starting BLE Scan...
```

### Verify Each Message:
- [ ] "Connecting to WiFi" appears
- [ ] "Connected to WiFi!" appears (WiFi success!)
- [ ] "Starting BLE Scan..." appears repeatedly
- [ ] No "WiFi Disconnected" errors
- [ ] No "Error code: -1" messages

### Troubleshoot if Needed:
**If "WiFi Disconnected" keeps appearing:**
- Double-check SSID and password (case-sensitive!)
- Make sure you're using 2.4GHz WiFi (ESP32 doesn't support 5GHz)

---

## **Phase 5: Backend Integration Test** ✓

### Start Backend Server:
```bash
cd d:\Staff-Presence-Verification\backend
npm start
```

### Expected Backend Output:
```
Server running on port 5000
MongoDB connected successfully
```

### Register Classroom in Database:
You need to register your ESP32's `classroomId` in the database.

**Option 1: Via Frontend Admin Dashboard**
1. Start frontend: `cd d:\Staff-Presence-Verification\frontend && npm run dev`
2. Open: http://localhost:5173
3. Login as admin
4. Go to: "Classroom Management" (or similar)
5. Add classroom:
   - Room Name: "Computer Science Lab" (or any name)
   - ESP32 ID: **"CS_LAB"** (MUST match `classroomId` in firmware - uppercase!)

**Option 2: Via MongoDB Directly**
```json
{
  "room_name": "Computer Science Lab",
  "esp32_id": "CS_LAB"
}
```

### Register Staff with BLE Tag:
**Via Frontend:**
1. Go to "Staff Management"
2. Add staff:
   - Name: "Test Staff"
   - Beacon UUID: "**AA:BB:CC:DD:EE:FF**" (use your BLE tag's MAC address)
   - Department: "Computer Science"
   - Phone: "+1234567890"

---

## **Phase 6: Live BLE Detection Test** ✓

### Method 1: Use Your Phone (Easiest)

1. **Install BLE Beacon App:**
   - Android: "nRF Connect" or "Beacon Simulator"
   - iOS: "Locate Beacon"

2. **Start Broadcasting:**
   - Open app
   - Enable iBeacon/BLE advertising
   - Set transmission power to maximum
   - Start broadcasting

3. **Check Serial Monitor:**
   - [ ] ESP32 detects your phone
   - [ ] See: `Found Device: XX:XX:XX:XX:XX:XX, RSSI: -45`
   - [ ] See: `HTTP Response code: 200` (SUCCESS!)

4. **Check Backend Logs:**
   - [ ] Backend receives BLE data
   - [ ] See: `Received BLE scan: ESP32=CS_LAB, UUID=...`

### Method 2: Use Simulation Script

```bash
cd d:\Staff-Presence-Verification\simulation
node simulate_scanner.js
```

- [ ] Simulation sends test BLE data
- [ ] Backend receives and processes it
- [ ] Dashboard updates in real-time

---

## **Phase 7: End-to-End Verification** ✓

### Complete Flow Test:

1. **Create Timetable Entry:**
   - Staff: "Test Staff"
   - Classroom: "CS_LAB"
   - Day: Today's day (e.g., "Monday")
   - Time: Current time to 1 hour from now

2. **Simulate Staff Presence:**
   - Register Test Staff's beacon UUID in database
   - Start BLE broadcasting (phone or real BLE tag)
   - ESP32 should detect it

3. **Verify Serial Monitor:**
   ```
   Found Device: AA:BB:CC:DD:EE:FF, RSSI: -55
   HTTP Response code: 200
   ```

4. **Verify Backend Logs:**
   ```
   POST /api/ble-data 200
   Attendance tracking started
   ```

5. **Check Admin Dashboard:**
   - [ ] Open: http://localhost:5173
   - [ ] Login as admin
   - [ ] Go to "Real-time Staff Locations" or "Attendance"
   - [ ] See Test Staff marked as "Tracking" → "Present" (after 30 min)

6. **Wait 30 Minutes:**
   - [ ] Keep BLE broadcasting
   - [ ] ESP32 continues scanning
   - [ ] After 30 mins, staff status changes to "Present" or "Late"

---

## **Common Issues & Solutions**

### ❌ ESP32 Not Detecting BLE Devices
**Solutions:**
- Move BLE device closer to ESP32 (within 5 meters)
- Increase BLE transmission power on phone app
- Check BLE device is actually broadcasting
- Verify ESP32 scan is running (Serial Monitor shows "Starting BLE Scan...")

### ❌ "HTTP Response code: -1"
**Solutions:**
- Backend not running → Start it: `cd backend && npm start`
- Wrong IP address → Verify your computer's IP hasn't changed: `ipconfig`
- Firewall blocking → Allow port 5000 in Windows Firewall
- ESP32 and computer on different WiFi networks

### ❌ "Staff not found" Error
**Solutions:**
- Register staff with exact beacon UUID in database
- Ensure UUID is uppercase in database
- Check beacon UUID format (MAC address: `AA:BB:CC:DD:EE:FF`)

### ❌ "Classroom not found" Error
**Solutions:**
- Register classroom with exact ESP32 ID in database
- Ensure `esp32_id` matches `classroomId` in firmware (case-sensitive!)
- Check `esp32_id` is uppercase in database

### ❌ "No scheduled class" Message
**Solutions:**
- Create timetable entry for current day/time
- Check timetable day matches today (e.g., "Monday")
- Verify time slot includes current time
- Ensure staff and classroom IDs match

---

## **🎯 Success Criteria**

Your ESP32 setup is COMPLETE when:

✅ **Hardware:**
- ESP32 connects to WiFi successfully
- BLE scans run every 10 seconds
- Serial Monitor shows clean output (no errors)

✅ **Backend:**
- Backend receives BLE data with HTTP 200 response
- Staff and classrooms are registered correctly
- Timetable entries exist

✅ **Dashboard:**
- Real-time staff locations update
- Attendance records are created
- Status changes from "Tracking" → "Present"

✅ **Alerts:**
- Late arrivals trigger alerts
- SMS notifications sent (mock or real)
- In-app notifications appear

---

## **Next Steps After Successful Test**

1. **Deploy Multiple ESP32s:**
   - Flash firmware to additional boards
   - Change `classroomId` for each location
   - Register each in database

2. **Get Real BLE Tags:**
   - Order NRF51822 BLE beacons or iBeacon tags
   - Configure each with unique UUID
   - Assign to staff members
   - Register in database

3. **Fine-Tune Settings:**
   - Adjust `RSSI_THRESHOLD` in backend `.env` (default: -75)
   - Adjust `TIME_WINDOW_MINUTES` for late detection (default: 15)
   - Modify scan interval in firmware if needed

4. **Physical Installation:**
   - Mount ESP32s in each classroom/location
   - Provide power (USB power adapter, 5V 1A minimum)
   - Position for optimal BLE coverage (central, elevated)

5. **User Training:**
   - Train staff on how BLE tags work
   - Explain check-in/check-out process
   - Demonstrate dashboard for admins

---

## **Quick Command Reference**

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

**View Serial Monitor:**
- Arduino IDE → Tools → Serial Monitor (115200 baud)

**Get Your IP:**
```bash
ipconfig
```

**Test Simulation:**
```bash
cd d:\Staff-Presence-Verification\simulation
node simulate_scanner.js
```

---

## **Support Resources**

- **Full Setup Guide:** `ESP32_SETUP_GUIDE.md`
- **Quick Start:** `ESP32_QUICK_START.md`
- **Firmware File:** `firmware/esp32_presence.ino`
- **Backend API:** `backend/server.js` (line 729 - BLE endpoint)

---

**🎉 Congratulations!** If you've completed all checklist items, your ESP32 is fully operational and integrated with your Staff Presence Verification System!
