# File: backend/models/Notification.js

## Overview
The `Notification` model represents in-app notifications sent to users (both Staff and Administrators).

## Schema Definition
The schema contains the following fields:
- **recipient_id**: ObjectId (Required). Reference to the `User` who should receive the notification.
- **title**: String (Required). A short title for the notification.
- **message**: String (Required). The full content of the notification.
- **type**: String (Required). Categorizes the notification. Examples include: `late_alert`, `leave_update`, `substitution_alert`, `upcoming_class`, `absence_warning`, etc.
- **is_read**: Boolean (Default: `false`). Tracks whether the user has seen the notification.
- **related_data**: Mixed. Flexible field for storing any data relevant to the notification (e.g., a relevant ID).

## Configuration
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.
- **Indexes**: Compound index on `recipient_id`, `is_read`, and `createdAt` for fast fetching of unread notifications.

## Role in the System
Notifications keep users informed about real-time events. Staff receive alerts for lateness or upcoming classes, while admins receive alerts for new leave requests or staff absences.
