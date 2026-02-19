# File: frontend/src/pages/ExecutiveDashboard.jsx

## Overview
The `ExecutiveDashboard` is a specialized interface for high-level officials (Principal, Director, etc.) to monitor staff presence and interact with them in real-time.

## Key Features
- **Real-time Staff Grid**: Displays a grid of cards for every staff member, showing their current status (`Present`, `Late`, `Absent`), location, and last seen time.
- **Search and Filter**: Allows searching for staff by name or department.
- **Meeting Requests**: Executives can request a meeting with any staff member. The dashboard handles the complex backend logic of finding substitutes if the staff member is currently teaching.
- **Status Indicators**: Uses color-coded icons (Green/Check for Present, Orange/Alert for Late, Red/X for Absent) for quick visual assessment.
- **Statistics Summary**: Top-level cards showing total counts for each attendance status.
- **Automatic Refresh**: Automatically fetches the latest staff statuses every 30 seconds.
- **Notification Integration**: Includes an alert system for executive-specific notifications.

## Role in the System
Provides an actionable high-level view of the entire campus. It empowers executives to manage the staff without disrupting the educational process by automating the substitution workflow.
