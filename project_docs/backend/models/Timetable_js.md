# File: backend/models/Timetable.js

## Overview
The `Timetable` model stores the schedule for each staff member, specifying which classroom they should be in at any given time.

## Schema Definition
The schema contains the following fields:
- **staff_id**: ObjectId (Required). Reference to the `Staff` model.
- **classroom_id**: ObjectId (Required). Reference to the `Classroom` model.
- **day_of_week**: String (Required). One of: `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`.
- **start_time**: String (Required). The start time of the class in HH:MM format (e.g., "09:00").
- **end_time**: String (Required). The end time of the class in HH:MM format (e.g., "10:00").
- **subject**: String. Optional. The name of the subject being taught.

## Configuration
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.
- **Indexes**: Compound index on `staff_id`, `classroom_id`, and `day_of_week` for fast schedule checks.

## Role in the System
The timetable is the "source of truth" for where a staff member *should* be. The system compares real-time BLE detection data against these entries to determine attendace status (Present vs. Absent vs. Late).
