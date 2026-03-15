# PHP Sync Bridge - Quick Start

## 🚀 5-Minute Setup

### 1. Create Databases in cPanel

**MySQL Databases:**
- Create: `amsoft_NaityDB`
- Create: `amsoft_ShamSoftDB`
- User: `amsoft_naty` (password: `g*TZtRDuyHoF`)
- Grant ALL PRIVILEGES to both databases

### 2. Setup Tables in phpMyAdmin

**For amsoft_NaityDB:**
- Open phpMyAdmin → Select `amsoft_NaityDB`
- SQL tab → Paste `mysql-setup-naitydb.sql` → Execute

**For amsoft_ShamSoftDB:**
- Open phpMyAdmin → Select `amsoft_ShamSoftDB`
- SQL tab → Paste `mysql-setup-shamsoftdb.sql` → Execute

### 3. Upload PHP Files

Upload to your web server (e.g., `public_html/sync/`):
- `sync.php`
- `test-connection.php`
- `view-logs.php`

### 4. Change Secret Key

Edit `sync.php`, `test-connection.php`, and `view-logs.php`:

```php
define('SECRET_KEY', 'your-unique-secret-key-12345');
```

Use the same key in all three files!

### 5. Test Connection

Visit:
```
https://yourdomain.com/sync/test-connection.php?key=your-unique-secret-key-12345
```

Should show: ✅ All tests passed

### 6. Test Sync

Visit:
```
https://yourdomain.com/sync/sync.php?key=your-unique-secret-key-12345
```

Should show JSON with sync results.

### 7. Setup Cron Job

**cPanel → Cron Jobs:**

**Every 5 minutes:**
```
*/5 * * * * curl -s "https://yourdomain.com/sync/sync.php?key=your-unique-secret-key-12345" > /dev/null
```

**Or every 10 minutes:**
```
*/10 * * * * curl -s "https://yourdomain.com/sync/sync.php?key=your-unique-secret-key-12345" > /dev/null
```

### 8. Monitor Logs

Visit:
```
https://yourdomain.com/sync/view-logs.php?key=your-unique-secret-key-12345
```

Or check `sync_log.txt` in File Manager.

## 📋 Quick Reference

| File | Purpose | URL |
|------|---------|-----|
| `sync.php` | Main sync script | `yourdomain.com/sync/sync.php?key=XXX` |
| `test-connection.php` | Test all connections | `yourdomain.com/sync/test-connection.php?key=XXX` |
| `view-logs.php` | View sync logs | `yourdomain.com/sync/view-logs.php?key=XXX` |
| `sync_log.txt` | Auto-generated logs | Check in File Manager |

## 🔄 What Gets Synced

**Inventory Sync:**
- Supabase `room_availability` → NaityDB `rooms` → ShamSoftDB `rooms`

**Reservation Sync:**
- Supabase `bookings` (pending) → NaityDB `reservations` + ShamSoftDB `reservations`
- Updates Supabase booking status to 'confirmed'

## ⚙️ Customization

**Change sync interval:**
Edit cron job timing (e.g., `*/10` for 10 minutes)

**Change secret key:**
Edit all three PHP files with same key

**Add more logging:**
Modify `writeLog()` function in sync.php

## 🐛 Troubleshooting

**Connection errors:**
- Check database names in phpMyAdmin
- Verify user privileges
- Confirm credentials

**No data syncing:**
- Check if tables exist
- Verify Supabase has data
- Review sync_log.txt

**Cron not running:**
- Check cron syntax
- Verify URL is accessible
- Check cron email logs

## 📞 Need Help?

1. Run test-connection.php first
2. Check sync_log.txt for errors
3. Verify database setup in phpMyAdmin
4. Test sync.php manually in browser
