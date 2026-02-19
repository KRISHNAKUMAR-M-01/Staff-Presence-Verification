# File: backend/models/Classroom.js

## Overview
The `Classroom` model represents the physical locations (classrooms or labs) where presence is tracked.

## Schema Definition
The schema contains the following fields:
- **room_name**: String (Required). The human-readable name of the classroom (e.g., "Room 101", "Computer Lab").
- **esp32_id**: String (Required, Unique, Uppercase). The unique identifier of the ESP32 device installed in this classroom.

## Configuration
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.

## Role in the System
This model links physical scanning hardware (ESP32) to a logical location (Classroom). When an ESP32 reports a detection, its `esp32_id` is used to look up the corresponding classroom.
