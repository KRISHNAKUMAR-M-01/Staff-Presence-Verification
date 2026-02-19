# File: backend/utils/emailService.js

## Overview
This utility handles sending email notifications using the `nodemailer` library.

## Key Components
- **Transporter Configuration**: Uses SMTP settings from environment variables (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`).
- **`sendEmail`**: An asynchronous function that:
  - Takes recipient, subject, and body (text/HTML) as arguments.
  - Constructs the mail options.
  - Sends the email using the configured transporter.
  - Logs success or failure details to the console.

## Role in the System
Used throughout the application to send alerts (lateness, absence), leave update notifications, and upcoming class reminders to staff and administrators.
