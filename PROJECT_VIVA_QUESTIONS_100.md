# 📋 Staff Presence Verification System: 100 Viva Questions & Answers

This document contains 100 potential questions and their technical answers, based on your specific project implementation.

---

## 🏗️ 1. System Architecture & Hardware (ESP32)

1. **Explain the high-level architecture of your project.**
   *   **Answer**: It is a 3-tier architecture. 1) **Hardware Tier**: ESP32 scans for BLE signals. 2) **Backend Tier**: Node.js/Express receives detections and processes attendance logic in MongoDB. 3) **Frontend Tier**: React dashboard provides real-time monitoring and management.

2. **Why did you choose the ESP32 over other microcontrollers?**
   *   **Answer**: Unlike Arduino or Raspberry Pi, the ESP32 has integrated WiFi and a high-performance Bluetooth Low Energy (BLE) stack on a single low-cost chip, which is essential for IoT-based presence tracking.

3. **What is "Dual-Mode" as defined in your firmware?**
   *   **Answer**: It means the ESP32 acts as both a **BLE Scanner** (to find physical iBeacon tags) and a **BLE Server/GATT Service** (to accept connections from staff smartphones) simultaneously.

4. **How does the ESP32 communicate with the backend?**
   *   **Answer**: It uses the `HTTPClient.h` library to send `POST` requests containing JSON data (ESP32 ID, Beacon ID, RSSI) to the server's REST API endpoint.

5. **How does the ESP32 handle a scenario where the WiFi connection is lost?**
   *   **Answer**: I implemented an `ensureWiFi()` function that checks `WiFi.status()` before every data report. If disconnected, it triggers an automatic reconnection attempt to ensure no data is lost.

6. **Explain the role of the `classroomId` in your firmware.**
   *   **Answer**: It is a unique identifier (e.g., "COMPUTERLAB") that matches a record in our MongoDB `Classrooms` collection. It tells the backend which specific room is reporting the detection.

7. **What is the significance of the `ESP_PWR_LVL_N12` setting?**
   *   **Answer**: It reduces the transmit power of the ESP32's antenna to the lowest level (-12 dBm) to prevent the signal from "bleeding" through walls into other rooms.

8. **How does the ESP32 toggle between scanning and accepting mobile connections?**
   *   **Answer**: It doesn't strictly toggle; the BLE stack handles them concurrently. However, calling `pBLEScan->start()` briefly pauses advertising, which is why I implemented a restart command after each scan.

9. **Explain the impact of `SCAN_TIME` on responsiveness.**
   *   **Answer**: A shorter `SCAN_TIME` (2s) means faster updates on the dashboard but less time for the radio to pick up weak signals. 2-4 seconds is the "sweet spot" for reliability.

10. **What happens if multiple tags are detected at the exact same moment?**
    *   **Answer**: The BLE scanner records all unique UUIDs in a `std::map`. After the scan window finishes, it loops through the map and reports each one individually to the backend.

11. **Explain why you chose `WiFiClientSecure` with `setInsecure()`?**
    *   **Answer**: Render (our cloud host) uses HTTPS. `setInsecure()` allows the ESP32 to connect without storing a large Root CA Certificate, which saves memory on the ESP32.

12. **Why do we need a 500ms delay in the main loop?**
    *   **Answer**: It prevents the CPU from running at 100% capacity and "starving" the background WiFi and Bluetooth tasks, which can cause the chip to crash or overheat.

13. **How does the ESP32 report its data—is it JSON?**
    *   **Answer**: Yes, we manually construct a JSON string in the code (e.g., `{"esp32_id": "...", "rssi": ...}`) and set the HTTP header to `application/json`.

14. **What is the `HTTP_TIMEOUT_MS` and why is it critical on Render?**
    *   **Answer**: It prevents the ESP32 from waiting forever if the server is slow to "wake up" (cold starts). It ensures the device continues to scan even if one HTTP request fails.

15. **Could the ESP32 report directly to the frontend?**
    *   **Answer**: No. The frontend runs in a user's browser, which doesn't have a static IP or a permanent listener. A backend with a database is required to store detections and calculate attendance.

---

## 📶 2. Bluetooth Low Energy (BLE) Specifics

16. **Difference between Bluetooth Classic and BLE?**
    *   **Answer**: BLE is designed for very low power consumption and small data bursts, making it perfect for battery-powered tags and phones to transmit location data for months.

17. **What is an iBeacon? Explain the 4-byte Apple prefix.**
    *   **Answer**: iBeacon is a protocol by Apple. The prefix `4C 00 02 15` identifies the broadcast as a standard proximity beacon, allowing us to parse the UUID, Major, and Minor values.

18. **What is UUID, Major, and Minor?**
    *   **Answer**: **UUID**: Unique ID for the project or organization. **Major**: Identifies a group (e.g., a building). **Minor**: Identifies an individual (the specific staff member).

19. **Explain RSSI. What does `-75 dBm` signify compared to `-40 dBm`?**
    *   **Answer**: RSSI is the signal strength. It is a negative number; `-40 dBm` is a very strong signal (very close), while `-75 dBm` is a weaker signal (further away).

20. **Why did you choose an `RSSI_THRESHOLD`?**
    *   **Answer**: To define the "boundary" of the room. If we don't have a threshold, a teacher in the hallway or the next room might be marked as "Present" in the wrong class.

21. **What is a "GATT Server"?**
    *   **Answer**: It stands for Generic Attribute Profile. The ESP32 acts as a server that "hosts" a piece of data (Staff UUID). When a phone "connects" and writes to it, the ESP32 knows exactly who is in the room.

22. **Explain the `SERVICE_UUID` and `CHARACTERISTIC_UUID`.**
    *   **Answer**: The **Service** is like a folder, and the **Characteristic** is like a file. Our phone app writes the staff member's ID into that "file" to verify their presence.

23. **How does the phone "check in" via GATT Write?**
    *   **Answer**: The staff phone app scans for the Room ESP32, connects to it, and performs a "Direct Write" of the staff's unique ID to the ESP32’s memory.

24. **Why doesn't the library restart advertising automatically?**
    *   **Answer**: This is a hardware limitation of the ESP32 BLE stack (Bluedroid). Any scan operation overrides the advertiser. We manually restart it in the `loop()` after every scan.

25. **Is it possible to track someone without them pairing?**
    *   **Answer**: Yes, if they are carrying a physical iBeacon hardware tag. The ESP32 can passively scan for those without any pairing process.

26. **What is the role of the `BLE2902` descriptor?**
    *   **Answer**: It is used to handle "Notifications" and "Indications" between the server and the client, though we primarily use it here for standard GATT protocol compliance.

27. **How do you prevent a phone from "holding" a connection from far away?**
    *   **Answer**: We implement an RSSI check in the `onWrite` callback. If the connection is established but the RSSI is weaker than our threshold (e.g., -75), we ignore the request.

28. **What is a "Soft Beacon"?**
    *   **Answer**: It is a software-based solution where a smartphone mimics an iBeacon, allowing the user to be verified without needing separate hardware.

29. **Max number of tags detectable?**
    *   **Answer**: Theoretically hundreds, but practically limited by the ESP32’s RAM. Our system processes detections in batches, so 20-30 tags per room is easily handled.

30. **How do you differentiate staff in the same room?**
    *   **Answer**: Every staff member has a globally unique `beacon_uuid` assigned to them in the database. The system uses this ID as the primary key for tracking.

---

## 💻 3. Backend & Database (Node.js/Express/MongoDB)

31. **Why MongoDB?**
    *   **Answer**: Flexibility. Our attendance records and timetable structures often change, and MongoDB's document-based structure allows us to store complex data without rigid table constraints.

32. **Explain the Attendance model.**
    *   **Answer**: It stores `staff_id`, `classroom_id`, `date`, `check_in_time`, `last_seen_time`, and a `status` (Present, Late, Absent, or Tracking).

33. **Role of the Timetable model?**
    *   **Answer**: It defines the "Permissions." A staff member is only marked as Present if the current time matches a slot in the Timetable assigned to them for that specific room.

34. **Purpose of `/api/ble-data`?**
    *   **Answer**: It is the "bridge" between hardware and software. It takes raw signal data from the ESP32 and converts it into a "Presence Event" in the database.

35. **How does the backend calculate "Last Seen"?**
    *   **Answer**: Every time the ESP32 detects a staff member, it sends a heartbeat. The backend updates the `last_seen_time` field in the Staff collection with the current timestamp.

36. **Explain the 25-minute duration logic.**
    *   **Answer**: To prevent "Proxy Attendance" (where someone just walks in and out), we only change the status from "Tracking" to "Present" if the difference between `check_in_time` and `last_seen_time` is at least 25 minutes.

37. **How do you handle Timezone on Render?**
    *   **Answer**: Render servers use UTC. I created a `getISTDateInfo` helper that uses `Intl.DateTimeFormat` to force the time into 'Asia/Kolkata' regardless of where the server is hosted.

38. **Explain the role of staffCache.**
    *   **Answer**: To stop our server from overloading MongoDB. We store UUID-to-Staff mappings in RAM so we don't have to query the database 10 times every second.

39. **What is "Throttling"?**
    *   **Answer**: A single ESP32 might report the same teacher 5 times in 1 second. Throttling ensures we only process one report every 10 seconds to save server bandwidth.

40. **How does the system handle "overlaps"?**
    *   **Answer**: The logic always looks for the *currently active* slot for the specific `classroom_id`. If two classes overlap, the system checks which one the staff is assigned to.

41. **How is "Late" calculated?**
    *   **Answer**: If a teacher arrives 15 minutes after the `start_time` assigned in the Timetable, their status is automatically changed from "Present" to "Late" and an alert is sent.

42. **What is `isStaffPermitted`?**
    *   **Answer**: It is a security function that checks three things: 1) Is there a scheduled class? 2) Is there an approved Substitution? 3) Is there an approved Swap? Attendance is only marked if one of these is true.

43. **Explain `.populate()` usage.**
    *   **Answer**: It allows us to retrieve full objects (like a Staff Member’s Name and Department) even though our Attendance record only stores their ID. It is like a "JOIN" in SQL.

44. **Storing profile pictures?**
    *   **Answer**: We use Cloudinary. Instead of saving heavy image files on our server, we upload them to Cloudinary and store only the secure URL in our MongoDB.

45. **What three Cron jobs are running?**
    *   **Answer**: 1) **Upcoming Class Notice**: Alerts staff 5m before class. 2) **Absence Warning**: Alerts HOD if a teacher is missing 15m after start. 3) **Cleanup**: Finalizes attendance for classes that have ended.

---

## 🖥️ 4. Frontend & User Interface (React)

46. **Why React?**
    *   **Answer**: Its component-based architecture makes it easy to build a complex, real-time dashboard. React's "State" management ensures the UI updates instantly without reloading the page.

47. **Admin vs Staff Dashboard?**
    *   **Answer**: **Admin**: Views all staff, manages timetable, and sees alerts. **Staff**: Only sees their own attendance, timetable, and leave requests.

48. **How does the dashboard update in real-time?**
    *   **Answer**: For this version, we use "Live Polling" (fetching data every 15 seconds) to ensure the presence table is always current.

49. **Explain Presence Status colors.**
    *   **Answer**: **Green (Live)**: Currently in range. **Blue (Present)**: Attended the class for 25+ mins. **Red (Absent)**: Missing from class. **Yellow (Tracking)**: In the room but hasn't reached 25 mins yet.

50. **How does UI handle "Approved Leave"?**
    *   **Answer**: The system checks the `Leave` collection. If a staff member is on leave, their dashboard status changes to "On Leave" and they are exempted from absence alerts.

51. **How does the "Soft Beacon" button work?**
    *   **Answer**: It allows a staff member to manually "Check In" via the web app if their smartphone Bluetooth is malfunctioning. It still checks permissions before marking attendance.

52. **Responsive Design?**
    *   **Answer**: I used CSS Media Queries and a Flexbox/Grid layout to ensure the dashboard works on iPhones, Androids, and Desktop computers.

53. **Role of JWT?**
    *   **Answer**: JSON Web Token. When a user logs in, the server gives them a token. Browsers send this token with every request to prove who they are.

54. **Meeting Request handling?**
    *   **Answer**: The Principal sends a "Special Request." It triggers a high-priority notification to the staff member's phone and their dashboard shows an urgent red alert.

55. **Staff Search in Swap?**
    *   **Answer**: It allows a teacher to find free colleagues. It filters the staff list by department and availability based on the current Timetable.

56. **Expected Class vs Current Location.**
    *   **Answer**: **Expected**: Where the timetable says you should be. **Current**: Where the ESP32 actually detects you. If they don't match, an alert is triggered.

57. **StatusModal component?**
    *   **Answer**: It’s a reusable pop-up that summarizes a staff member’s daily performance, including arrival time, departure time, and total duration in class.

58. **Why Outfit font?**
    *   **Answer**: It gives the application a modern, professional, and "premium" aesthetic that matches the high-tech nature of the project.

59. **Email validation logic?**
    *   **Answer**: I used a Regular Expression (Regex) that prevents numbers from being the first character to ensure consistency with college email standards.

60. **What is `localStorage` used for?**
    *   **Answer**: It stores the login token and user role so that the staff member doesn't have to log in again every time they close their browser tab.

---

## 🔄 5. Substitution & Staff Swap Logic

61. **substitution workflow?**
    *   **Answer**: Staff A requests a swap -> Admin approves -> Staff B accepts the request -> Staff B is now authorized to check into Staff A’s classroom.

62. **Why need Admin approval?**
    *   **Answer**: To maintain institutional discipline and ensure that substitutions are valid and official before attendance permissions are granted.

63. **What happens to original teacher's attendance?**
    *   **Answer**: Once a swap is accepted, the original teacher is "Off the Hook." Their expected class for that hour is cleared so they aren't marked as Absent.

64. **Can a staff check into a random room?**
    *   **Answer**: They can be "seen" in any room (for the admin to see where they are), but their **Attendance** will not be marked unless they have a permit or a class there.

65. **How are staff notified of swaps?**
    *   **Answer**: Immediately via Push Notification and an in-app "Substitution Request" alert in their notification center.

66. **Dynamic Expected Class update.**
    *   **Answer**: The backend looks at the `SwapRequest` collection. If an accepted swap exists for the current time, it overrides the standard Timetable display for that staff member.

67. **Substitute conflict handling?**
    *   **Answer**: The system prevents a staff member from accepting a swap if the Timetable shows they already have their own class at that time.

68. **Wait, why `substitute_staff_id`?**
    *   **Answer**: It stores the reference to the teacher who is "covering" the class, so we know who to give the attendance credit to.

69. **HOD Notification logic?**
    *   **Answer**: If a teacher is marked "Late" or "Absent," the system finds the HOD of that teacher's specific department and sends them an automated email.

70. **Automatic vs Manual swaps?**
    *   **Answer**: "Automatic" refers to substitutions assigned by Admin for an absent teacher, while "Manual" is a Peer-to-Peer request made by one teacher to another.

---

## ✉️ 6. Notifications & Alerts

71. **Push vs Email?**
    *   **Answer**: **Push**: High speed, for urgent classroom updates. **Email**: Formal record, used for leave approvals and summaries.

72. **Gmail App Passwords?**
    *   **Answer**: Node.js cannot use standard login due to Google's 2FA security. An App Password creates a secure bypass for our server to send automated emails.

73. **What is Cloudinary?**
    *   **Answer**: A cloud image management service. It optimizes and serves staff profile pictures much faster than our own backend could.

74. **5-minute class alert logic?**
    *   **Answer**: A cron job runs every minute, checks the Timetable for any class starting exactly 5 minutes from now, and triggers notifications to those staff members.

75. **What triggers Dept. Absence Warning?**
    *   **Answer**: If a class started 15 minutes ago and the `Attendance` record for that room and staff is still missing, the backend sends an emergency email to the HOD.

76. **Principal meeting request?**
    *   **Answer**: The Principal clicks a button on the special dashboard. This triggers the `sendMeetingRequest` controller which notifies the staff member via all channels.

77. **What if a staff rejects a meeting?**
    *   **Answer**: The Principal is notified immediately on their dashboard, allowing them to follow up or choose a different time.

78. **Are notifications persistent?**
    *   **Answer**: Yes. We store them in MongoDB so the user can look at their "Notification History" later to see past swap requests or alerts.

79. **Unread Count badge?**
    *   **Answer**: A simple query `Notification.countDocuments({ is_read: false })` that updates whenever the user opens their dashboard.

80. **How do Push Notifications reach the phone?**
    *   **Answer**: We use "Web Push" (VAPID). When the user visits the dashboard, their browser generates a unique "Subscription" which our server uses to send messages even if the tab is closed.

---

## 🔐 7. Security, Privacy & Performance

81. **Securing API endpoints?**
    *   **Answer**: We use `authenticateToken` middleware. It checks the JWT header. If the token is missing or forged, the server rejects the request with a **401 Unauthorized** error.

82. **What is bcrypt?**
    *   **Answer**: A hashing algorithm. We never store original passwords; we store a "non-reversible hash." Even if the database is leaked, passwords remain safe.

83. **Faking Soft Beacon?**
    *   **Answer**: The system primarily relies on the **ESP32** (hardware) detection. The Soft Beacon is a backup. We have "Rate Limiting" to prevent people from checking in from home.

84. **Replay Attacks?**
    *   **Answer**: This is where someone records a BLE packet and plays it back. Our 10-second throttle and timestamp verification in MongoDB help mitigate these basic attacks.

85. **Environment Variables?**
    *   **Answer**: We use a `.env` file for secrets. This ensures sensitive keys are never hardcoded in the source code or pushed to GitHub.

86. **Why clear bleThrottle every hour?**
    *   **Answer**: To keep the server memory (RAM) clean. If we tracked 1,000 staff forever, the Map would grow too large and crash the server.

87. **Scaling to 50 classrooms?**
    *   **Answer**: We would use **Redis** for caching instead of a local Map, and we would move to a **Microservices** architecture where one server only handles BLE data.

88. **What is CORS?**
    *   **Answer**: Cross-Origin Resource Sharing. It prevents a random malicious website from trying to talk to our backend. We only allow requests from our specific Vercel URL.

89. **Database Indexes?**
    *   **Answer**: We created an index on `beacon_uuid`. This allows MongoDB to find a staff member in 1ms instead of scanning through all 500 records every time.

90. **Two ESP32s detect same staff?**
    *   **Answer**: The system compares the RSSI. The ESP32 with the *stronger* signal is considered the true location, and the weaker detection is discarded as "bleeding" signal.

---

## 🚀 8. Design Rationale & Future Work

91. **Biggest technical challenge?**
    *   **Answer**: Balancing the BLE Radio. Getting the ESP32 to scan for tags while remaining visible to phones without it disappearing from the Bluetooth list was the hardest problem.

92. **How did you test the range?**
    *   **Answer**: I used the "nRF Connect" app to measure the RSSI at different distances and adjusted the `RSSI_THRESHOLD` until it matched the average room size (approx 5-7 meters).

93. **If you had more time, what feature?**
    *   **Answer**: **Indoor Navigation**. Using the ESP32 signals to show a "live dot" on a map, showing exactly where a teacher is inside the building in real-time.

94. **Use for students?**
    *   **Answer**: Yes. However, scanning 40-50 students at once would require multiple ESP32s per room and a very high-speed database to handle the massive heartbeat traffic.

95. **Does ESP32 require constant internet?**
    *   **Answer**: Yes, in this version it does. A future version could store detections locally on an SD card and upload them once the WiFi is restored.

96. **Staff leaving mid-class?**
    *   **Answer**: If the `last_seen_time` stops updating for more than 5 minutes while the class is still on, the system triggers a "Premature Departure" alert.

97. **End of semester changes?**
    *   **Answer**: The admin has a "Clear Timetable" button and a CVS/Excel Import feature to quickly upload the new schedule into the MongoDB system.

98. **Why not QR codes?**
    *   **Answer**: QR codes are easily faked (one student can photo the code and send it to their friend). BLE is "Zero-Interaction"—it happens automatically without the teacher ever touching their phone.

99. **Battery life of a tag?**
    *   **Answer**: Because iBeacons use CR2032 button cells and the BLE "Low Energy" standard, a single tag can last between 12 and 18 months.

100. **Thesis Statement / Core Value?**
    *   **Answer**: To replace manual, error-prone attendance with a **silent, automated, and verification-driven** system that ensures staff presence without interrupting the educational workflow.
