# Executive Role Implementation Summary

## Overview
Successfully implemented special permission roles (Principal, Secretary, Director of Academy) with the following capabilities:
1. View status of all staff members in real-time
2. Send meeting requests to any staff member
3. Automatic class substitution when staff has an active class

## Backend Changes

### 1. Models Updated

#### User.js
- Added three new roles to enum: `'principal'`, `'secretary'`, `'director'`
- These roles have special executive privileges

#### Notification.js
- Added new notification type: `'meeting_request'`
- Used for meeting requests and substitution alerts

### 2. New Controller: `specialController.js`
Created with two main functions:

#### `sendMeetingRequest(staffId)`
**Logic Flow:**
1. Verify requester has executive role (principal/secretary/director)
2. Find target staff member
3. Check if target staff has an active class at current time
4. If staff has a class:
   - Mark target staff as Present (override attendance)
   - Find a free staff member (not busy at this time)
   - Send notification to free staff to cover the class
5. Send meeting request notification to target staff
6. Return success with substitution info

#### `getAllStaffStatus()`
**Returns for each staff:**
- Basic info (name, department, etc.)
- Current status (Present/Late/Absent)
- Last seen time
- Current location (classroom or campus)
- Active class details (if any)

### 3. Middleware Updated: `auth.js`
- Added `requireExecutive` middleware
- Checks if user role is in `['principal', 'secretary', 'director']`
- Returns 403 error if not authorized

### 4. New Routes: `specialRoutes.js`
```
GET  /api/executive/staff-status  - View all staff status
POST /api/executive/meet          - Send meeting request
```

### 5. Server.js
- Imported and mounted special routes at `/api/executive`

## Frontend Changes

### 1. New Page: `ExecutiveDashboard.jsx`

**Features:**
- Real-time staff status overview with auto-refresh (30 seconds)
- Search functionality (by name or department)
- Statistics cards showing total/present/late/absent counts
- Staff cards displaying:
  - Name and department
  - Current status (color-coded badge)
  - Location
  - Last seen time
  - Active class details
  - "Request Meeting" button

**Meeting Request Modal:**
- Confirmation dialog
- Shows warning if staff is teaching
- Indicates automatic substitution will occur
- Displays which staff will cover the class

### 2. App.jsx Updates
- Imported `ExecutiveDashboard`
- Updated `ProtectedRoute` to accept `allowedRoles` array instead of single role
- Added executive route: `/executive/*`
- Updated navigation logic to redirect executives to `/executive`
- Added `getDefaultRoute()` helper function

### 3. CSS Styles Added to `Dashboard.css`

**New Styles:**
- `.dashboard-container` - Main container
- `.dashboard-nav` - Top navigation bar
- `.role-badge.executive` - Purple gradient badge
- `.staff-card` - Individual staff member cards
- `.staff-details` - Staff information display
- `.modal-overlay` & `.modal-content` - Meeting request modal
- `.warning-box` - Warning for class substitution
- Responsive design support

## Key Features Implemented

### 1. Real-Time Staff Tracking
- Executives can see every staff member's current status
- Location tracking (which classroom or campus)
- Last seen timestamp
- Active class information

### 2. Meeting Request System
- One-click meeting requests
- Automatic handling of class coverage
- Smart substitution logic:
  - Finds staff who are free at that time
  - Excludes staff who have classes
  - Randomly selects from available staff
  - Sends notifications to both parties

### 3. Notifications
- Target staff receives meeting request notification
- Free staff receives class coverage request
- Notifications include all relevant details (room, time, subject)

### 4. Attendance Override
- When executive requests a meeting with teaching staff
- System automatically marks them as Present
- Ensures no attendance penalties for meeting with executives

## Usage Flow

### For Executives:
1. Log in with executive credentials (principal/secretary/director)
2. View dashboard showing all staff status
3. Search for specific staff member
4. Click "Request Meeting" button
5. Confirm in modal dialog
6. System handles:
   - Sending notification to target staff
   - Finding free staff for substitution
   - Sending notification to substitute
   - Marking attendance appropriately

### For Staff Members:
1. Receive notification: "Executive requests meeting"
2. If teaching, notification includes substitution info
3. Can proceed to meeting knowing class is covered
4. Attendance is marked as Present automatically

## Database Considerations

### Attendance Logic:
- Checks for existing attendance record for the day
- Updates status to 'Present' if exists
- Creates new record if doesn't exist
- Uses classroom from active class

### Timetable Queries:
- Finds overlapping time slots
- Uses day of week and time range matching
- Efficiently identifies busy vs. free staff

## Security

### Authorization:
- All executive endpoints protected by `authenticateToken` middleware
- Additional `requireExecutive` middleware checks role
- Returns 403 Forbidden if user is not executive

### Validation:
- Verifies staff member exists before processing
- Checks for valid classroom assignments
- Ensures proper date/time handling

## Future Enhancements (Suggestions)

1. **Meeting History**: Track all meeting requests and outcomes
2. **Priority Levels**: Different urgency levels for meetings
3. **Scheduling**: Allow scheduling meetings in advance
4. **Substitute Preferences**: Let staff set substitution preferences
5. **Analytics**: Dashboard showing meeting patterns and statistics
6. **Mobile App**: Native mobile app for on-the-go access
7. **Calendar Integration**: Sync with Google Calendar/Outlook

## Testing Checklist

- [ ] Executive can log in successfully
- [ ] Dashboard displays all staff correctly
- [ ] Search functionality works
- [ ] Statistics are accurate
- [ ] Meeting request sends notifications
- [ ] Substitution logic finds free staff
- [ ] Attendance is updated correctly
- [ ] Modal displays properly
- [ ] Unauthorized users cannot access executive routes
- [ ] Real-time updates work (30-second refresh)

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/executive/staff-status` | Executive | Get all staff status |
| POST | `/api/executive/meet` | Executive | Send meeting request |
| GET | `/api/staff/notifications` | Any | Get user notifications |
| GET | `/api/staff/notifications/unread-count` | Any | Get unread count |

## Files Modified/Created

### Backend:
- ✅ `models/User.js` - Added executive roles
- ✅ `models/Notification.js` - Added meeting_request type
- ✅ `controllers/specialController.js` - NEW
- ✅ `middleware/auth.js` - Added requireExecutive
- ✅ `routes/specialRoutes.js` - NEW
- ✅ `server.js` - Mounted executive routes

### Frontend:
- ✅ `pages/ExecutiveDashboard.jsx` - NEW
- ✅ `App.jsx` - Added executive routing
- ✅ `styles/Dashboard.css` - Added executive styles

## Notes

- The system uses current time to determine active classes
- Free staff selection is random from available pool
- Notifications are stored in database for persistence
- All times use 24-hour HH:MM format
- System assumes one staff can only be in one place at a time
