# How to Create Executive Users (Principal, Secretary, Director)

## Overview
The system now has a dedicated **User Accounts** section in the Admin Dashboard where you can create users with different roles including executive roles.

## Steps to Create Executive Users

### 1. Login as Admin
- Navigate to the login page
- Login with your admin credentials

### 2. Navigate to User Accounts
- In the Admin Dashboard sidebar, click on **"User Accounts"**
- This is located below "Manage Staff" with a UserCog icon (⚙️👤)

### 3. Select User Role
You'll see 5 role options:
- **Admin** - Full system access
- **Staff** - Regular teaching staff (requires linking to staff member)
- **Principal** - Executive role with special permissions
- **Secretary** - Executive role with special permissions  
- **Director** - Executive role with special permissions

Click on the role card you want to create.

### 4. Fill in User Details
Required fields:
- **Full Name**: The user's full name
- **Email Address**: Must not start with a number
- **Initial Password**: Minimum 8 characters with:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (@$!%*?&#)

**Note:** For "Staff" role, you also need to select which staff member to link the account to.

### 5. Create User
Click the **"Create [Role] User"** button at the bottom of the form.

## Important Notes

### Staff vs Executive Roles

**Staff Role:**
- Requires a staff member to be created first in "Manage Staff"
- Links the user account to a specific staff member
- Used for regular teaching staff

**Executive Roles (Principal/Secretary/Director):**
- Do NOT require a staff member link
- Can be created directly
- Have special permissions to:
  - View all staff status in real-time
  - Send meeting requests to any staff
  - Automatic class substitution when requesting meetings

### Password Requirements
Example valid passwords:
- `Welcome@2024`
- `Admin#Pass123`
- `Secure$Pass1`

Example invalid passwords:
- `password` (no uppercase, number, or special char)
- `Pass123` (no special character)
- `Pass@` (less than 8 characters)

## Workflow Example

### Creating a Principal Account:

1. Go to Admin Dashboard → User Accounts
2. Select **"PRINCIPAL"** role card
3. Fill in:
   - Name: `Dr. John Smith`
   - Email: `principal@school.com`
   - Password: `Principal@2024`
4. Click "Create Principal User"
5. Success! The principal can now login at `/login`

### Creating a Staff Account:

1. **First**, create the staff member in "Manage Staff":
   - Name: `Jane Doe`
   - Beacon UUID: `AA:BB:CC:DD:EE:FF`
   - Department: `Mathematics`
   - etc.

2. **Then**, create user account in "User Accounts":
   - Select **"STAFF"** role
   - Name: `Jane Doe`
   - Email: `jane.doe@school.com`
   - Password: `Teacher@123`
   - Link to Staff Member: Select "Jane Doe - Mathematics"
   - Click "Create Staff User"

## After Creating Executive Users

Once created, executive users can:

1. **Login** at the login page with their credentials
2. **Access Executive Dashboard** automatically upon login
3. **View Staff Status** - See real-time location and status of all staff
4. **Send Meeting Requests** - Request meetings with any staff member
5. **Automatic Substitution** - System finds free staff to cover classes

## Differences Between Roles

| Feature | Admin | Staff | Principal/Secretary/Director |
|---------|-------|-------|------------------------------|
| Manage Staff | ✅ | ❌ | ❌ |
| Manage Timetables | ✅ | ❌ | ❌ |
| View All Staff Status | ✅ | ❌ | ✅ |
| Send Meeting Requests | ❌ | ❌ | ✅ |
| View Own Attendance | ✅ | ✅ | ❌ |
| Submit Leave Requests | ❌ | ✅ | ❌ |
| Approve Leaves | ✅ | ❌ | ❌ |

## Troubleshooting

### "Email already registered"
- This email is already in use
- Use a different email address

### "Staff not found" (for staff role)
- The staff member must be created first in "Manage Staff"
- Go to Manage Staff → Register New Staff first

### "Password validation failed"
- Ensure password meets all requirements
- Must have uppercase, lowercase, number, and special character
- Must be at least 8 characters long

### Can't see "User Accounts" menu
- Only admins can access this section
- Ensure you're logged in as admin

## Security Best Practices

1. **Strong Passwords**: Always use strong, unique passwords
2. **Change Default Passwords**: Users should change their password after first login
3. **Limit Executive Accounts**: Only create executive accounts for authorized personnel
4. **Regular Audits**: Periodically review user accounts and remove inactive ones

## Next Steps After User Creation

1. **Inform the User**: Send them their login credentials securely
2. **First Login**: Have them login and verify access
3. **Test Permissions**: Ensure they can access appropriate features
4. **Password Change**: Recommend changing the initial password

---

**Need Help?** Contact your system administrator or refer to the main documentation.
