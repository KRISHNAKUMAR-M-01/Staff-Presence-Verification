# File: backend/models/User.js

## Overview
The `User` model manages account information for individuals who log into the system (Admins, Staff, and Executives).

## Schema Definition
The schema contains the following fields:
- **email**: String (Required, Unique, Lowercase). The user's login email.
- **password**: String (Required). The hashed password.
- **role**: String (Required). One of: `admin`, `staff`, `principal`, `secretary`, `director`.
- **staff_id**: ObjectId. Reference to the `Staff` model. Required if the `role` is `staff`.
- **name**: String (Required). The full name of the user.
- **isActive**: Boolean (Default: `true`). Used to enable or disable accounts.

## Configuration
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.
- **Pre-save Hook**: Automatically hashes the password using `bcryptjs` if it has been modified.
- **Methods**:
  - `comparePassword(candidatePassword)`: Compares a plain-text password with the stored hash.

## Role in the System
This model is used for authentication and authorization. It links login credentials to staff profiles (via `staff_id`), allowing the system to determine what data a user can see and what actions they can perform.
