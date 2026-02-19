# File: backend/models/Leave.js

## Overview
The `Leave` model manages leave requests submitted by staff members.

## Schema Definition
The schema contains the following fields:
- **staff_id**: ObjectId (Required). Reference to the `Staff` member requesting leave.
- **start_date**: Date (Required). The first day of the leave.
- **end_date**: Date (Required). The last day of the leave.
- **reason**: String (Required). The reason for the leave request.
- **status**: String (Default: `pending`). One of: `pending`, `approved`, `rejected`.
- **leave_type**: String (Required). One of: `Personal Leave`, `Medical Leave`, `Duty Leave`.
- **approved_by**: ObjectId. Reference to the `User` (Admin) who approved or rejected the request.
- **admin_notes**: String. Optional notes added by the administrator during approval/rejection.

## Configuration
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.
- **Indexes**:
  - Index on `staff_id` and `start_date` for fetching a staff member's leave history.
  - Index on `status` for fast filtering by admins.

## Role in the System
This model facilitates the leave management workflow. When a leave is approved, the system can automatically send alerts to other staff members to cover the absent teacher's classes (Substitution Alerts).
