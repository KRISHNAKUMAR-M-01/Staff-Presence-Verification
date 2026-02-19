# File: backend/models/Staff.js

## Overview
The `Staff` model defines the schema for staff members in the system. 

## Schema Definition
The schema contains the following fields:
- **name**: String (Required). The full name of the staff member. Validated to contain only letters and spaces.
- **beacon_uuid**: String (Required, Unique, Uppercase). The unique identifier of the BLE beacon assigned to the staff member.
- **department**: String (Required). The department the staff member belongs to. Validated to contain only letters and spaces.
- **is_hod**: Boolean (Default: `false`). Indicates if the staff member is a Head of Department.
- **phone_number**: String. Optional. Validated for basic phone number format.

## Configuration
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.

## Role in the System
This model is essential for linking BLE beacon detections to specific staff members. It also helps in routing department-specific notifications (like HOD alerts).
