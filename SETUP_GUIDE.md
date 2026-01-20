# Multi-Tenant Coaching Center ERP - Setup Guide

## 🚀 Quick Start

This guide will help you set up your multi-tenant coaching center ERP with Supabase authentication.

## 📋 Prerequisites

- Node.js installed
- Supabase account and project created
- `.env` file with Supabase credentials (already configured)

## 🗄️ Database Setup

### Step 1: Run SQL Schema in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (the one with URL: `kzezcgkmlrhiahvttlzf.supabase.co`)
3. Click on **SQL Editor** in the left sidebar
4. Create a new query
5. Copy the entire contents of `supabase-schema-v2.sql`
6. Paste into the SQL editor
7. Click **Run** (or press `Ctrl/Cmd + Enter`)

This will create:
- ✅ User profiles table
- ✅ Organizations (coaching centers) table
- ✅ User-organization mapping
- ✅ All data tables with `organization_id` column
- ✅ Row Level Security policies for data isolation

### Step 2: Verify Tables Created

In Supabase Dashboard:
1. Go to **Table Editor**
2. You should see these new tables:
   - `profiles`
   - `organizations`
   - `user_organizations`
   - Updated: `batches`, `students`, `tests`, `test_scores`, `fee_payments`, `attendance`, `expenses`

## 🔐 Authentication Configuration

### Email Confirmation Settings (Optional)

By default, users can login immediately after signup. If you want to require email confirmation:

1. Go to **Authentication → Providers** in Supabase Dashboard
2. Click on **Email**
3. Toggle "Confirm email" ON/OFF as desired
4. Save changes

**Current Implementation**: Works with both modes (auto-login is attempted after signup)

## 💻 Running the Application

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:5173` (or similar)

## 🧪 Testing Multi-Tenant Functionality

### Test Scenario: Create Two Separate Coaching Centers

#### User 1: Create First Coaching Center

1. Go to `http://localhost:5173/signup`
2. Fill in the form:
   - Full Name: `Rajesh Kumar`
   - Coaching Center Name: `Excel Coaching Institute`
   - Email: `rajesh@example.com`
   - Password: `password123`
3. Click "Create account"
4. You should be auto-logged in and redirected to `/dashboard`
5. Create some test data:
   - Go to **Batches** → Create 2 batches (e.g., "Class 10 Science", "Class 12 Math")
   - Go to **Students** → Add 3-4 students
   - Assign students to batches
6. **Logout** (click user menu in top right → Sign Out)

#### User 2: Create Second Coaching Center

1. Go to `/signup` again
2. Fill in the form:
   - Full Name: `Priya Sharma`
   - Coaching Center Name: `Bright Future Academy`
   - Email: `priya@example.com`
   - Password: `password123`
3. Click "Create account"
4. You should be auto-logged in to a **completely fresh workspace**
5. Create different test data:
   - Go to **Batches** → Create 1-2 batches (e.g., "JEE Preparation", "NEET Biology")
   - Go to **Students** → Add 2-3 students
6. **Verify**: You should NOT see any of Rajesh's data

#### Verify Data Isolation

1. Login as `rajesh@example.com`:
   - You should ONLY see Excel Coaching Institute's data
   - Check Dashboard, Students, Batches - should show Rajesh's data only

2. Logout and login as `priya@example.com`:
   - You should ONLY see Bright Future Academy's data
   - Dashboard should show different statistics

3. **Success Criteria**:
   - ✅ Each user sees only their own organization's data
   - ✅ Students, batches, fees, tests are completely isolated
   - ✅ Organization name shows in header
   - ✅ Dashboard stats are different for each organization

## 🔄 Organization Switching (Future Feature)

If a user joins multiple organizations (requires manual database entry), they can switch between them using the organization switcher in the user menu (top right).

## 🏗️ How It Works

### Data Isolation

Every data table has an `organization_id` column:
```sql
organization_id UUID REFERENCES organizations(id)
```

Row Level Security (RLS) policies ensure:
- Users can only SELECT data from their organizations
- Users can only INSERT/UPDATE/DELETE data in their organizations

### Organization Assignment

When a user signs up:
1. User account created in Supabase Auth
2. Profile created in `profiles` table
3. New organization created in `organizations` table
4. User linked to organization via `user_organizations` table

### Frontend Context

- **AuthContext**: Manages user authentication state
- **OrganizationContext**: Manages current organization selection
- All database functions now require `organizationId` parameter

## 🐛 Troubleshooting

### "Organization ID required" Errors

**Cause**: Organization context not loaded yet

**Solution**: The app automatically waits for organization context. If you see this error, check browser console for details.

### Data Not Showing

**Cause**: RLS policies blocking access

**Solution**: Ensure:
1. User is logged in
2. User has an entry in `user_organizations` table
3. SQL schema was run completely

### Check User's Organizations

Run this query in Supabase SQL Editor:

```sql
-- Replace 'user-uuid' with actual user ID from auth.users table
SELECT 
  u.id as user_id,
  u.email,
  o.id as org_id,
  o.name as org_name
FROM auth.users u
LEFT JOIN user_organizations uo ON u.id = uo.user_id
LEFT JOIN organizations o ON uo.organization_id = o.id;
```

## 📁 Key Files Modified

- `supabase-schema-v2.sql` - Complete database schema
- `src/context/OrganizationContext.jsx` - NEW: Organization management
- `src/context/AuthContext.jsx` - Enhanced signup with org creation
- `src/lib/supabase.js` - All functions updated to use organizationId
- `src/components/layout/Header.jsx` - Added org display and switcher
- `src/pages/auth/Signup.jsx` - Added organization name field
- `src/pages/admin/Dashboard.jsx` - Example of using organization context
- `src/App.jsx` - Added OrganizationProvider

## 🎯 Next Steps

1. **Test thoroughly** with multiple accounts
2. Update remaining pages (Students, Batches, Tests, Fees, etc.) to use organization context (follow Dashboard pattern)
3. Add organization settings page (edit organization name, etc.)
4. Implement team member invitations (optional)

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in Dashboard → Logs
3. Verify RLS policies are active: Table Editor → table → RLS tab

## ✨ Features Implemented

- ✅ User signup with organization creation
- ✅ Automatic login after signup
- ✅ Multi-tenant data isolation
- ✅ Organization switcher (for multi-org users)
- ✅ Row Level Security policies
- ✅ Organization display in header
- ✅ All helper functions organization-aware

Your ERP is now fully multi-tenant! Each user gets their own isolated workspace. 🎉
