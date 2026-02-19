# File: frontend/src/pages/StaffDashboard.jsx

## Overview
The `StaffDashboard` provides staff members with access to their own attendance records, schedules, and leave requests.

## Key Features
- **Personalized Access**: Only allows the logged-in staff member to see their specific data.
- **Navigation Modules**:
  - **Overview**: Summary of recent attendance and upcoming classes.
  - **My Timetable**: Personal weekly schedule view.
  - **My Attendance**: Detailed logs of past presence detections.
  - **Leave Requests**: Interface for submitting new leave requests and checking the status of previous ones.
- **Notifications**: Notifies staff about upcoming classes (5-minute reminders) and alerts regarding lateness or absences.
- **Real-time Updates**: Refreshes unread notification counts every 30 seconds.

## Module Integration
The dashboard mounts sub-components:
- `StaffOverview`
- `MyTimetable`
- `MyAttendance`
- `MyLeaves`

## Role in the System
The primary portal for staff members to manage their professional schedule and monitor their own attendance performance.
