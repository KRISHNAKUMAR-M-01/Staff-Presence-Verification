# File: package.json (Root)

## Overview
The root `package.json` file serves as a task runner and dependency manager for the entire workspace (Backend and Frontend).

## Key Scripts
- **`install-all`**: Installs dependencies for the root, backend, and frontend directories in one command.
- **`server`**: Runs the backend development server.
- **`client`**: Runs the frontend development server.
- **`dev`**: Uses `concurrently` to run both the backend and frontend servers simultaneously for development.
- **`seed`**: Runs the database seeding script located in the backend.
- **`start`**: Starts the production backend server.

## DevDependencies
- **`concurrently`**: Allows running multiple NPM scripts in parallel.

## Role in the System
Simplifies the development workflow by providing unified commands to manage both the client and server components of the application.
