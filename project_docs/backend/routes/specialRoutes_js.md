# File: backend/routes/specialRoutes.js

## Overview
Defines routes specifically for "Executive" users (Principals, Directors, etc.).

## Defined Routes
- `GET /staff-status`: Retrieves the current status (location and timetable match) for all staff members.
- `POST /meet`: Sends a meeting request to specific staff members, automatically checking for timetable conflicts and suggesting substitutions if needed.

## Middleware
All routes in this file are protected by `authenticateToken` and `requireExecutive` middleware.
