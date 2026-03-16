# Setup Supabase Tables - Quick Guide

## 🎯 Goal

Create all necessary tables in your `scmgtoqilbkakxikigtz` Supabase project so the sync works.

## 📝 Steps

### 1. Go to Your Supabase Project

- Visit: https://supabase.com/dashboard
- Click on **Naity** organization
- Click on your project (scmgtoqilbkakxikigtz)

### 2. Open SQL Editor

- In the left sidebar, click **SQL Editor**
- Click **New Query**

### 3. Run the Setup Script

- Open the file: `app/sync-service/supabase-complete-setup.sql`
- Copy ALL the content
- Paste into the SQL Editor
- Click **Run** (or press Ctrl+Enter)

### 4. Verify Tables Created

- In left sidebar, click **Table Editor**
- You should see these tables:
  - ✅ profiles
  - ✅ user_roles
  - ✅ hotels
  - ✅ room_categories
  - ✅ hotel_photos
  - ✅ bookings
  - ✅ room_availability

### 5. Create Admin User

In SQL Editor, run:

```sql
-- Create admin user (replace with your email and password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@naity.com',  -- Change this
  crypt('your-password-here', gen_salt('bf')),  -- Change this
  now(),
  '{"full_name": "Admin User"}',
  now(),
  now()
) RETURNING id;

-- Note the returned UUID, then run:
-- Replace YOUR_USER_ID with the UUID from above
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

Or use Supabase Auth UI:
- Go to Authentication → Users
- Click "Add User"
- Enter email and password
- Then add admin role via SQL

### 6. Test the Sync

Now visit:
```
https://yourdomain.com/sync/sync.php?key=naity_sync_rDqhMn85HXLcuiTBIaRt6vAmeKY3ClP2
```

Should work without 404 errors!

### 7. Test Login

Visit your website and try logging in with the admin credentials you created.

## ✅ Done!

Once tables are created:
- ✅ Sync will work
- ✅ Login will work
- ✅ You can add hotels and rooms
- ✅ Bookings will sync to MySQL databases

## 🆘 If You Get Errors

**"relation already exists"**
- Some tables might already exist, that's OK
- Continue with the rest of the script

**"permission denied"**
- Make sure you're logged into the correct project
- Try running smaller sections of the SQL

**Need help?**
- Run the SQL in smaller chunks
- Check Table Editor to see what's created
- Let me know what error you get
