# Namecheap Deployment Guide - Complete Setup

## 📋 Overview

You have:
- **Supabase** - Web application backend (PostgreSQL)
- **naitagfz_Naity_Booking** - Your main booking system (MySQL)
- **naitagfz_Cham_Soft** - ShamSoft local hotel system (MySQL)

Both MySQL databases are on: **68.65.123.142** (Namecheap shared hosting)

## 🎯 Sync Flow

```
Supabase (room_availability)
    ↓
naitagfz_Naity_Booking (rooms)
    ↓
naitagfz_Cham_Soft (rooms)

Supabase (bookings: pending)
    ↓
naitagfz_Naity_Booking (reservations) + naitagfz_Cham_Soft (reservations)
    ↓
Supabase (bookings: confirmed)
```

## 🚀 Step-by-Step Setup

### Step 1: Access phpMyAdmin

1. Log into Namecheap cPanel
2. Find and click "phpMyAdmin"

### Step 2: Setup naitagfz_Naity_Booking Database

1. In phpMyAdmin, select database: **naitagfz_Naity_Booking**
2. Click "SQL" tab
3. Copy entire contents of `mysql-setup-naitydb.sql`
4. Paste into SQL window
5. Click "Go"
6. Verify: You should see `rooms` and `reservations` tables created

### Step 3: Setup naitagfz_Cham_Soft Database

1. In phpMyAdmin, select database: **naitagfz_Cham_Soft**
2. Click "SQL" tab
3. Copy entire contents of `mysql-setup-shamsoftdb.sql`
4. Paste into SQL window
5. Click "Go"
6. Verify: You should see `rooms` and `reservations` tables created

### Step 4: Upload PHP Files to Server

**Option A: Using File Manager (Easier)**

1. In cPanel, go to "File Manager"
2. Navigate to `public_html`
3. Create new folder: `sync`
4. Enter the `sync` folder
5. Click "Upload"
6. Upload these 3 files:
   - `sync.php`
   - `test-connection.php`
   - `view-logs.php`

**Option B: Using FTP**

1. Use FileZilla or any FTP client
2. Connect to your Namecheap server
3. Navigate to `public_html`
4. Create folder `sync`
5. Upload the 3 PHP files

### Step 5: Change Secret Key (IMPORTANT!)

Edit all 3 PHP files and change this line:

```php
define('SECRET_KEY', 'naity_sync_2026_secure_key_change_this');
```

To something unique like:
```php
define('SECRET_KEY', 'naity_hotel_sync_XyZ789_secure');
```

**Use the SAME key in all 3 files!**

### Step 6: Test Database Connections

Visit in your browser:
```
https://yourdomain.com/sync/test-connection.php?key=naity_hotel_sync_XyZ789_secure
```

Expected response:
```json
{
    "timestamp": "2026-03-15 12:00:00",
    "tests": {
        "naity_booking_db": {
            "status": "success",
            "message": "Connected successfully",
            "database": "naitagfz_Naity_Booking",
            "rooms_count": 0
        },
        "cham_soft_db": {
            "status": "success",
            "message": "Connected successfully",
            "database": "naitagfz_Cham_Soft",
            "rooms_count": 0
        },
        "supabase": {
            "status": "success",
            "message": "Connected successfully"
        }
    },
    "overall": "All tests passed ✅"
}
```

### Step 7: Test Manual Sync

Visit:
```
https://yourdomain.com/sync/sync.php?key=naity_hotel_sync_XyZ789_secure
```

This will run one sync cycle and show results.

### Step 8: Setup Automatic Sync (Cron Job)

1. In cPanel, go to "Cron Jobs"
2. Under "Add New Cron Job":
   - **Common Settings**: Custom
   - **Minute**: */5 (every 5 minutes)
   - **Hour**: *
   - **Day**: *
   - **Month**: *
   - **Weekday**: *
   - **Command**:
   ```bash
   curl -s "https://yourdomain.com/sync/sync.php?key=naity_hotel_sync_XyZ789_secure" > /dev/null 2>&1
   ```

3. Click "Add New Cron Job"

### Step 9: Monitor Logs

Visit:
```
https://yourdomain.com/sync/view-logs.php?key=naity_hotel_sync_XyZ789_secure
```

Or check `sync_log.txt` in File Manager.

## 📊 Database Credentials Summary

### Naity Booking Database (Main System)
- **Host**: 68.65.123.142
- **Database**: naitagfz_Naity_Booking
- **User**: naitagfz_Naity_Booking
- **Password**: p3cu(+odU6F^

### ShamSoft Database (Local Hotel System)
- **Host**: 68.65.123.142
- **Database**: naitagfz_Cham_Soft
- **User**: naitagfz_Samir
- **Password**: r(eJX+6Cwjx1

### Supabase
- **URL**: https://lfnvnxeymkhyzzsvadbp.supabase.co
- **Service Key**: (already in sync.php)

## 🔄 What Gets Synced

### Inventory Sync (Supabase → MySQL)
1. Fetches room availability from Supabase `room_availability` table
2. Updates `naitagfz_Naity_Booking.rooms`
3. Updates `naitagfz_Cham_Soft.rooms`

### Reservation Sync (Supabase → MySQL)
1. Fetches pending bookings from Supabase `bookings` table
2. Inserts into `naitagfz_Naity_Booking.reservations`
3. Inserts into `naitagfz_Cham_Soft.reservations`
4. Updates Supabase booking status to 'confirmed'

## 🔐 Security Checklist

- ✅ Changed SECRET_KEY in all PHP files
- ✅ Files uploaded to secure directory
- ✅ File permissions set to 644
- ✅ Using HTTPS (SSL certificate active)
- ✅ Secret key not shared publicly

## 🧪 Testing Checklist

- [ ] Databases created in cPanel
- [ ] Tables created via SQL scripts
- [ ] PHP files uploaded
- [ ] SECRET_KEY changed
- [ ] test-connection.php shows all green
- [ ] sync.php runs successfully
- [ ] Cron job configured
- [ ] Logs are being written

## 📱 Quick URLs

Replace `yourdomain.com` with your actual domain:

```
Test Connection:
https://yourdomain.com/sync/test-connection.php?key=YOUR_KEY

Run Sync:
https://yourdomain.com/sync/sync.php?key=YOUR_KEY

View Logs:
https://yourdomain.com/sync/view-logs.php?key=YOUR_KEY
```

## 🆘 Troubleshooting

### "Access denied for user"
- Check database user has privileges
- Verify credentials are correct
- Check user is added to both databases in cPanel

### "Unknown database"
- Verify database names are exact (case-sensitive)
- Check databases exist in phpMyAdmin

### "Table doesn't exist"
- Run the SQL setup scripts
- Check you selected correct database before running SQL

### "Supabase request failed"
- Verify service key is correct
- Check Supabase URL
- Ensure server can make outbound HTTPS requests

### Cron job not working
- Test URL manually in browser first
- Check cron job email for errors
- Verify curl is available on server

## 📈 Monitoring

### Check Sync Status

Create a simple status page `status.php`:

```php
<?php
if ($_GET['key'] !== 'YOUR_KEY') die('Unauthorized');

$logFile = __DIR__ . '/sync_log.txt';
$lastModified = file_exists($logFile) ? date('Y-m-d H:i:s', filemtime($logFile)) : 'Never';
$fileSize = file_exists($logFile) ? filesize($logFile) : 0;

echo json_encode([
    'last_sync' => $lastModified,
    'log_size_kb' => round($fileSize / 1024, 2),
    'status' => 'running'
], JSON_PRETTY_PRINT);
?>
```

## 🎉 You're Done!

Once setup is complete:
- Sync runs automatically every 5 minutes
- Logs are written to sync_log.txt
- Monitor via view-logs.php
- All reservations flow: Supabase → Both MySQL databases
