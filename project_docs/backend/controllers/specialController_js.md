# File: backend/controllers/specialController.js

## Overview
This controller implements logic for the "Executive" features of the application.

## Key Logic
- **`sendMeetingRequest(req, res)`**:
  - Validates that the requester has an executive role.
  - Checks if the target staff member is currently teaching a class (via `Timetable`).
  - If teaching, it automatically searches for "Free Staff" (those without a class at the current time) to cover the class.
  - If a substitute is found, it notifies them via in-app notification and email.
  - Notifies the target staff member of the meeting request and provides details about who is covering their class.
  - Ensures the target staff member's attendance is marked as `Present`.
- **`getAllStaffStatus(req, res)`**:
  - Aggregates data for all staff members.
  - Combines personal info, current attendance status (`Present`, `Late`, `Absent`, etc.), last seen time, current location (classroom), and active class details.
  - Used for the executive dashboard's real-time monitoring view.

## Role in the System
Provides higher-level management features that allow executives to interact with staff while maintaining classroom coverage.
