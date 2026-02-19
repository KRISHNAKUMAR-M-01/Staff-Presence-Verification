# File: frontend/src/pages/AdminDashboard.jsx

## Overview
The `AdminDashboard` is the primary interface for system administrators. It uses a consistent layout and provides navigation to all administrative modules.

## Key Features
- **Dashboard Layout**: Uses the `DashboardLayout` component for consistent sidebar navigation and header.
- **Role-based Navigation**: Provides access to:
  - **Overview**: High-level statistics and real-time summaries.
  - **Staff Management**: CRUD operations for staff records.
  - **User Management**: Managing login accounts for staff and executives.
  - **Staff Locations**: Real-time tracking of staff presence across classrooms.
  - **Classroom Management**: Managing physical room records and their associated ESP32 devices.
  - **Timetable Management**: Setting up and modifying the weekly schedule.
  - **Attendance Reports**: Viewing and filtering historical attendance data.
  - **Leave Management**: Reviewing and approving/rejecting leave requests.
  - **System Alerts**: Viewing logs of lateness and absences.
- **Notifications**: Includes a bell icon in the header to view and mark alerts as read.
- **Real-time Updates**: Periodically refreshes unread notification counts and pending leave counts every 30 seconds.

## Module Integration
The dashboard acts as a router, mounting different sub-components based on the URL path:
- `AdminOverview`
- `StaffManagement`
- `UserManagement`
- `StaffLocations`
- `ClassroomManagement`
- `TimetableManagement`
- `AttendanceReports`
- `LeaveManagement`
- `SystemAlerts`

## Role in the System
The central command center for managing all aspects of the Staff Presence Verification system.
