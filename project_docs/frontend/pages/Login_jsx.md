# File: frontend/src/pages/Login.jsx

## Overview
The `Login` page provides the user interface for authenticating into the system.

## Key Features
- **Form Validation**: Checks that the email does not start with a number (as per specific project rules).
- **Authentication**: Sends a POST request to the `/auth/login` endpoint via the `api` service.
- **Context Integration**: Uses the `login` function from `AuthContext` to store the received token and user data.
- **Role-based Navigation**: Redirects users to their corresponding dashboard (`/admin`, `/staff`, or others) upon successful login.
- **UI Enhancements**:
  - Floating labels for input fields.
  - Password visibility toggle.
  - Loading states on the submit button.
  - Error message display.
  - Demo credentials listed for testing purposes.

## Dependencies
- `lucide-react`: For the eye icons.
- `AuthContext`: For managing login state.
- `api` service: For making HTTP requests.

## Role in the System
The gateway for users to enter the application. It ensures that only authorized users gain access to the system's management and tracking features.
