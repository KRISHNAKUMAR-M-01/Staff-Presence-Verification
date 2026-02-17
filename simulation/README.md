# Mobile as BLE Tag Simulation

Since you do not have a physical BLE tag yet, you can use your smartphone to simulate one.
You will also use your laptop to act as the scanner (replacing the ESP32 for now).

## 1. Setup Your Mobile Phone (The Tag)

You need an app that can broadcast as an **iBeacon**.

### For Android
1.  Download **"Beacon Simulator"** by Vincent.
2.  Open the app and tap the **+ (Plus)** button to adjust settings.
3.  Select **iBeacon**.
4.  **UUID**: Generate one or pick a simple one (e.g., `11111111-2222-3333-4444-555555555555`).
5.  **Major/Minor**: You can leave these as 0 or 1.
6.  **Tx Power**: Leave as default.
7.  **Name**: Give it a name like "MyStaffTag".
8.  Save and obtain the **UUID**.
9.  Tap the **Play/Broadcast** button to start advertising.

### For iOS
1.  Download **"Beacon Simulator"** or **"Locate Beacon"**.
2.  Set it up to broadcast as an **iBeacon**.
3.  Note the **UUID** being broadcasted.

---

## 2. Register the Tag in Your Admin Dashboard

1.  Go to your Admin Dashboard (`http://localhost:5173/admin`).
2.  Go to **Staff Management**.
3.  Edit or Create a Staff member.
4.  In the **Beacon UUID** field, enter the **UUID** from your mobile app (e.g., `11111111-2222-3333-4444-555555555555`).
    *   *Note: Ensure the case (uppercase) matches, although the system handles case-insensitivity.*

---

## 3. Register the Simulator Classroom

1.  Go to **Classroom Management**.
2.  Create a classroom named "Home Office" or "Simulation Room".
3.  Set the **ESP32 ID** to: `SIMULATED_LAPTOP_01`
    *   *This ID matches the one hardcoded in `simulation/scanner.py`. If you change it in the script, change it here too.*

---

## 4. Run the Laptop Scanner

1.  Open a terminal in the `simulation` folder.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the scanner:
    ```bash
    python scanner.py
    ```

The script will now scan **continuously**. As soon as your phone broadcasts a signal, it will be detected and sent to the backend immediately (throttled to once every 2 seconds per device to avoid spamming).
