# File: backend/config/database.js

## Overview
This file handles the connection to the MongoDB database using Mongoose.

## Key Logic
- **`connectDB`**: An asynchronous function that:
  - Retrieves the MongoDB URI from the `MONGODB_URI` environment variable, defaulting to a local instance if not provided.
  - Calls `mongoose.connect()` to establish the connection.
  - Logs a success message or exits the process with an error code if the connection fails.
- **Event Listeners**: Listens for `disconnected` and `error` events on the Mongoose connection to provide visibility into database status issues.

## Role in the System
Ensures that the backend server is correctly connected to the database before processing any requests.
