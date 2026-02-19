# File: frontend/src/context/AuthContext.jsx

## Overview
This file implements the authentication context for the React application, providing a way to manage and access user authentication state across all components.

## Key Exports
- **`AuthContext`**: The raw React context object.
- **`AuthProvider`**: A provider component that wraps the application and maintains the authentication state (`user`, `token`).
- **`useAuth`**: A custom hook that allows components to easily access the authentication state and methods.

## Functionality
- **Persistence**: On initialization, the context checks `localStorage` for a saved `token` and `user` data to persist the session after page refreshes.
- **`login(userData, userToken)`**: Sets the user data and token in both the state and `localStorage`.
- **`logout()`**: Clears the state and `localStorage`, effectively logging the user out.
- **`isAuthenticated`**: A derived boolean indicating if a valid token exists.

## Role in the System
Centralizes authentication logic, making it easy to protect routes and display user-specific information throughout the frontend.
