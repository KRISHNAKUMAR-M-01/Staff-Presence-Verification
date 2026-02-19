# File: backend/middleware/auth.js

## Overview
This file contains utility functions and middleware for handling authentication and authorization using JSON Web Tokens (JWT).

## Key Functions
- **`generateToken(userId, role)`**: Generates a JWT signed with the user's ID and role. The token expires in 7 days.
- **`authenticateToken`**: Middleware that:
  - Extracts the token from the `Authorization` header.
  - Verifies the token using the `JWT_SECRET`.
  - Fetches the user from the database and attaches it to `req.user`.
  - Ensures the user is active.
- **`requireAdmin`**: Middleware that ensures the authenticated user has the `admin` role.
- **`requireStaff`**: Middleware that ensures the authenticated user has the `staff` role.
- **`requireExecutive`**: Middleware that ensures the authenticated user has one of the executive roles (`principal`, `secretary`, or `director`).

## Role in the System
Protects sensitive API endpoints by ensuring only authenticated and authorized users can access them.
