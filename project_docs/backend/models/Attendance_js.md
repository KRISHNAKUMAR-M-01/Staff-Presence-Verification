# File: backend/models/Attendance.js

## Overview
The `Attendance` model records the presence of staff members in specific classrooms on a daily basis.

## Schema Definition
The schema contains the following fields:
- **staff_id**: ObjectId (Required). Reference to the `Staff` model.
- **classroom_id**: ObjectId (Required). Reference to the `Classroom` model.
- **check_in_time**: Date (Required, Default: `Date.now`). The time when the staff member was first detected in the classroom.
- **last_seen_time**: Date (Default: `Date.now`). The time when the staff member was most recently detected in the classroom.
- **status**: String (Required). One of: `Present`, `Late`, `Absent`, `Tracking`. Default is `Tracking`.
- **date**: Date (Required). The date for which the attendance record applies (usually stored as 00:00:00 of that day).

## Configuration
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.
- **Indexes**:
  - Compound index on `staff_id`, `classroom_id`, and `date` for efficient lookups.
  - Index on `date` for fast report generation.

## Role in the System
This is the core record for tracking staff presence. The logic in `server.js` updates these records based on BLE detections. A status stays as `Tracking` until a minimum duration (e.g., 30 minutes) is met, at which point it's updated to `Present` or `Late`.
