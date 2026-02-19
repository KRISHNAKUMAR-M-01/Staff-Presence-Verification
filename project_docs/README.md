# Project Documentation: Staff Presence Verification System

This folder contains a comprehensive breakdown of all source files in the system, explaining their logic and roles end-to-end.

## Documentation Structure

### Backend
- [server.js](./backend/server_js.md): The main entry point and API handler.
- **Models**:
  - [Staff.js](./backend/models/Staff_js.md)
  - [Attendance.js](./backend/models/Attendance_js.md)
  - [Classroom.js](./backend/models/Classroom_js.md)
  - [User.js](./backend/models/User_js.md)
  - [Timetable.js](./backend/models/Timetable_js.md)
  - [Alert.js](./backend/models/Alert_js.md)
  - [Leave.js](./backend/models/Leave_js.md)
  - [Notification.js](./backend/models/Notification_js.md)
- **Other Core Files**:
  - [Database Config](./backend/config/database_js.md)
  - [Auth Middleware](./backend/middleware/auth_js.md)
  - [Email Utility](./backend/utils/emailService_js.md)
  - [Executive Routes](./backend/routes/specialRoutes_md)
  - [Executive Controller](./backend/controllers/specialController_js.md)

### Frontend
- [App.jsx](./frontend/App_jsx.md): Routing and core layout.
- [main.jsx](./frontend/main_jsx.md): Entry point.
- [AuthContext.jsx](./frontend/context/AuthContext_jsx.md): Global auth state.
- **Dashboards & Pages**:
  - [Login.jsx](./frontend/pages/Login_jsx.md)
  - [AdminDashboard.jsx](./frontend/pages/AdminDashboard_jsx.md)
  - [StaffDashboard.jsx](./frontend/pages/StaffDashboard_jsx.md)
  - [ExecutiveDashboard.jsx](./frontend/pages/ExecutiveDashboard_jsx.md)
- [Vite Config](./frontend/vite_config_js.md)

### Systems & Simulation
- [scanner.py](./simulation/scanner_py.md): BLE scanner simulation script.
- [esp32_presence.ino](./firmware/esp32_presence_ino.md): ESP32 receiver/scanner firmware source.
- [esp32_transmitter.ino](./firmware/esp32_transmitter_ino.md): ESP32 transmitter/tag firmware source.

## System Architecture Overview
The system follows a typical MERN (with MySQL-like logic in MongoDB) architecture, integrated with external BLE scanning hardware (ESP32).
1. **ESP32/Simulation** detects BLE iBeacons and sends the data to the **Node.js/Express Backend**.
2. The **Backend** processes this data against a **Timetable** saved in **MongoDB**.
3. **Attendance** records are updated and **Alerts/Notifications** are triggered for lateness or absence.
4. The **React Frontend** provides specialized dashboards for Admins, Staff, and Executives to monitor and interact with the data.
