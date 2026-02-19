# File: frontend/src/App.jsx

## Overview
`App.jsx` is the root component of the React frontend. it sets up the application's routing, authentication context, and layout.

## Key Components
- **`App`**: The main entry component. It wraps the entire application with `AuthProvider` and `Router`.
- **`AppContent`**: Defines the application's route structure using React Router's `Routes` and `Route`. It handles redirects for the root path and login page based on the user's authentication status.
- **`ProtectedRoute`**: A wrapper component used to restrict access to certain routes based on authentication status and user roles.
- **`ScrollToTop`**: A helper component that ensures the page scrolls to the top whenever the route changes.

## Routing Logic
- `/login`: The login page (redirects to the dashboard if already logged in).
- `/admin/*`: Routes protected for the `admin` role, leading to the `AdminDashboard`.
- `/executive/*`: Routes protected for executive roles (`principal`, `secretary`, `director`), leading to the `ExecutiveDashboard`.
- `/staff/*`: Routes protected for the `staff` role, leading to the `StaffDashboard`.
- `/`: Automatically redirects to the appropriate dashboard based on the user's role.

## Role in the System
Serves as the central hub for the frontend, orchestrating navigation and enforcing security through role-based access control.
