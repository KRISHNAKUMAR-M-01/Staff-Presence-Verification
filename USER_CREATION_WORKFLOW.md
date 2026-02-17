# User Creation Workflow - Clear Separation

## The Problem (Before)
There was confusion because password/user account creation appeared in two places:
1. **Manage Staff** - Created staff members AND their user accounts
2. **User Accounts** - Also had option to create staff users

This was redundant and confusing! ❌

## The Solution (Now)
We've separated the workflows clearly:

### 📋 **Manage Staff** (for Teaching Staff)
**Location:** Admin Dashboard → Manage Staff

**Purpose:** Create regular teaching staff members

**What it does:**
1. Creates staff member record (name, beacon UUID, department, phone, HOD status)
2. **Automatically creates user account** with role='staff'
3. Links the user account to the staff member

**Use this for:** All regular teaching staff who need to:
- Track attendance via BLE
- View their own timetable
- Submit leave requests

**Example:**
```
Name: Jane Doe
Beacon UUID: AA:BB:CC:DD:EE:FF
Department: Mathematics
Email: jane.doe@school.com
Password: Teacher@123
Is HOD: ✓
```
Result: Creates both staff member AND user account in one step! ✅

---

### 👔 **Admin/Executive Users** (for Administrators & Executives)
**Location:** Admin Dashboard → Admin/Executive Users

**Purpose:** Create admin and executive user accounts ONLY

**Available Roles:**
- **Admin** - Full system access
- **Principal** - Executive with special permissions
- **Secretary** - Executive with special permissions
- **Director** - Executive with special permissions

**What it does:**
- Creates user account ONLY (no staff member record)
- These users don't need BLE tracking
- They have administrative/executive permissions

**Use this for:** 
- System administrators
- Principal, Secretary, Director who need to:
  - View all staff status
  - Send meeting requests
  - Manage the system

**Example:**
```
Role: Principal
Name: Dr. John Smith
Email: principal@school.com
Password: Principal@2024
```
Result: Creates principal user account with executive permissions! ✅

---

## Quick Reference Table

| User Type | Where to Create | What Gets Created | BLE Tracking | Permissions |
|-----------|----------------|-------------------|--------------|-------------|
| **Teaching Staff** | Manage Staff | Staff Member + User Account | ✅ Yes | View own data, submit leaves |
| **Admin** | Admin/Executive Users | User Account only | ❌ No | Full system access |
| **Principal** | Admin/Executive Users | User Account only | ❌ No | View all staff, send meetings |
| **Secretary** | Admin/Executive Users | User Account only | ❌ No | View all staff, send meetings |
| **Director** | Admin/Executive Users | User Account only | ❌ No | View all staff, send meetings |

## Visual Workflow

```
┌─────────────────────────────────────────────────────────┐
│           NEED TO CREATE A USER?                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  What type of user?   │
              └───────────────────────┘
                     │           │
        ┌────────────┘           └────────────┐
        ▼                                     ▼
┌──────────────────┐                 ┌──────────────────┐
│ Teaching Staff   │                 │ Admin/Executive  │
│ (with BLE tag)   │                 │ (no BLE tag)     │
└──────────────────┘                 └──────────────────┘
        │                                     │
        ▼                                     ▼
┌──────────────────┐                 ┌──────────────────┐
│  Manage Staff    │                 │ Admin/Executive  │
│                  │                 │     Users        │
│ • Name           │                 │                  │
│ • Beacon UUID    │                 │ • Select Role    │
│ • Department     │                 │   (Admin/Prin/   │
│ • Email          │                 │    Sec/Dir)      │
│ • Password       │                 │ • Name           │
│ • Phone          │                 │ • Email          │
│ • Is HOD?        │                 │ • Password       │
└──────────────────┘                 └──────────────────┘
        │                                     │
        ▼                                     ▼
┌──────────────────┐                 ┌──────────────────┐
│ Creates BOTH:    │                 │ Creates:         │
│ 1. Staff Member  │                 │ • User Account   │
│ 2. User Account  │                 │   ONLY           │
└──────────────────┘                 └──────────────────┘
```

## Why This Separation?

### Teaching Staff Need:
1. **Staff Member Record** - For BLE tracking, timetable assignment, attendance
2. **User Account** - To login and view their data
3. **Link between them** - So the system knows which BLE tag belongs to which user

### Admin/Executives Need:
1. **User Account** - To login with elevated permissions
2. **NO Staff Member Record** - They don't carry BLE tags or teach classes
3. **Special Permissions** - To manage system or view all staff

## Common Scenarios

### Scenario 1: New Math Teacher Joins
**Action:** Go to **Manage Staff**
1. Fill in teacher details + beacon UUID
2. Create email and password
3. Submit form
4. ✅ Done! Teacher can login and their BLE tag is tracked

### Scenario 2: New Principal Appointed
**Action:** Go to **Admin/Executive Users**
1. Select "Principal" role
2. Fill in name, email, password
3. Submit form
4. ✅ Done! Principal can login and view all staff status

### Scenario 3: IT Admin Needs Access
**Action:** Go to **Admin/Executive Users**
1. Select "Admin" role
2. Fill in details
3. Submit form
4. ✅ Done! Admin has full system access

## Important Notes

⚠️ **Do NOT use "Admin/Executive Users" for teaching staff**
- Teaching staff MUST be created in "Manage Staff"
- This ensures their BLE tracking works correctly

⚠️ **Do NOT create staff members for admins/executives**
- They don't need BLE tracking
- They don't teach classes
- Creating a staff member for them would be unnecessary

✅ **The system prevents confusion**
- "Admin/Executive Users" page shows a warning
- It only offers Admin/Principal/Secretary/Director roles
- Staff role is NOT available there

## Summary

**Simple Rule:**
- 👨‍🏫 **Teaching staff?** → Use **Manage Staff**
- 👔 **Admin/Executive?** → Use **Admin/Executive Users**

This keeps everything organized and prevents duplicate/redundant user creation! 🎯
