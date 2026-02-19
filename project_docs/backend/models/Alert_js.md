# File: backend/models/Alert.js

## Overview
The `Alert` model stores system-generated alerts regarding staff presence (e.g., when a staff member is late or absent).

## Schema Definition
The schema contains the following fields:
- **staff_id**: ObjectId (Required). Reference to the `Staff` member involved in the alert.
- **classroom_id**: ObjectId (Required). Reference to the `Classroom` where the incident occurred.
- **message**: String (Required). A description of the alert (e.g., "John Doe marked Late for class in Room 101").
- **timestamp**: Date (Default: `Date.now`). The time the alert was generated.

## Configuration
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.
- **Indexes**: Index on `timestamp` (descending) to quickly fetch the most recent alerts.

## Role in the System
Alerts provide a permanent record of issues that require attention from administrators or HODs. They are displayed on the admin dashboard.
