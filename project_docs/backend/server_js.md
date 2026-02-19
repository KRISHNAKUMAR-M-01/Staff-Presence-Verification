# File: backend/server.js

## Overview
`server.js` is the main entry point for the backend application. it is an Express-based server that handles API requests, database connections, and background tasks (cron jobs).

## Key Responsibilities
- **Express App Initialization**: Sets up the Express application with middleware like `cors`, `morgan`, and `body-parser`.
- **Database Connection**: Establishes a connection to MongoDB using the `connectDB()` utility from `./config/database`.
- **Authentication Routes**:
  - `POST /api/auth/login`: Handles user login, password verification, and JWT token generation.
  - `GET /api/auth/me`: Retrieves current user information based on the JWT token.
- **Admin Endpoints**: Provides various administrative functionalities (protected by `authenticateToken` and `requireAdmin` middleware):
  - User Registration
  - Staff Management (CRUD)
  - Classroom Management (CRUD)
  - Timetable Management (CRUD, including bulk insertion)
  - Real-time Staff Locations tracking
  - Attendance Reports and Alerts retrieval
  - Dashboard Statistics calculation
- **Staff Endpoints**: Provides functionalities for staff members (protected by `authenticateToken` and `requireStaff` middleware):
  - Retreiving own attendance records
  - Viewing personal timetable
  - Submitting and viewing leave requests
  - Managing notifications (reading, unread count)
- **BLE Data Endpoint**:
  - `POST /api/ble-data`: A public endpoint used by ESP32 devices to report detected BLE beacons. This is the core of the presence verification system. It handles:
    - RSSI threshold filtering.
    - Staff and Classroom identification.
    - Attendance tracking logic (status: 'Tracking' -> 'Present'/'Late' based on a 30-minute duration requirement).
    - Triggering alerts and notifications when staff are late.
- **Cron Jobs**:
  - **Job 1**: Runs every minute to notify staff members 5 minutes before their scheduled class starts. It also notifies HODs.
  - **Job 2**: Runs every minute to check if staff are absent 15 minutes after their class starts. It creates system alerts and notifies admins, HODs, and the staff member.
- **Server Startup**: Listens on the specified port (default 5000).

## Dependencies
- `express`: Web framework.
- `mongoose`: ODM for MongoDB.
- `node-cron`: For scheduled tasks.
- `jsonwebtoken`: For authentication.
- `dotenv`: For environment variable management.
- `cors`, `morgan`, `body-parser`: Standard Express middleware.
- `./utils/emailService`: For sending email notifications.

## Logical Flow for Presence Verification
1. ESP32 sends a beacon UUID to `/api/ble-data`.
2. The server verifies the staff (via UUID) and classroom (via ESP32 ID).
3. It checks the timetable for the current day and time.
4. If an attendance record for today and this classroom doesn't exist, it starts 'Tracking'.
5. If it exists, it updates `last_seen_time`.
6. Once the staff has been present for 30 minutes, their status is updated to 'Present' or 'Late' (depending on arrival time relative to class start).
7. Notifications and alerts are triggered for 'Late' statuses.
