# PHP Sync Bridge - Setup Guide for Namecheap

## Overview

The PHP sync bridge runs on your Namecheap shared hosting and syncs data between:
- **Supabase** (your web app backend)
- **amsoft_NaityDB** (local MySQL database 1)
- **amsoft_ShamSoftDB** (local MySQL database 2)

## Setup Steps

### Step 1: Create MySQL Databases in cPanel

1. Log into your Namecheap cPanel
2. Go to "MySQL Databases"
3. Create two databases:
   - `amsoft_NaityDB`
   - `amsoft_ShamSoftDB`
4. Create or use existing user: `amsoft_naty` with password: `g*TZtRDuyHoF`
5. Add the user to both databases with ALL PRIVILEGES

### Step 2: Setup Database Tables

1. In cPanel, go to "phpMyAdmin"
2. Select `amsoft_NaityDB` database
3. Go to "SQL" tab
4. Copy and paste contents of `mysql-setup-naitydb.sql`
5. Click "Go" to execute
6. Repeat for `amsoft_ShamSoftDB` using `mysql-setup-shamsoftdb.sql`

### Step 3: Upload sync.php

1. In cPanel, go to "File Manager"
2. Navigate to `public_html` (or your web root)
3. Create a folder called `sync` (optional, for organization)
4. Upload `sync.php` to this folder
5. Set file permissions to 644

### Step 4: Configure Secret Key

Edit `sync.php` and change the SECRET_KEY:

```php
define('SECRET_KEY', 'your-unique-secret-key-here-change-this');
```

Generate a strong key or use: `naity_sync_2026_` + random string

### Step 5: Test the Sync

Open your browser and visit:

```
https://yourdomain.com/sync/sync.php?key=your-unique-secret-key-here
```

You should see JSON output with sync results.

### Step 6: Setup Automatic Execution (Cron Job)

1. In cPanel, go to "Cron Jobs"
2. Add a new cron job:
   - **Minute**: */5 (every 5 minutes)
   - **Hour**: * (every hour)
   - **Day**: * (every day)
   - **Month**: * (every month)
   - **Weekday**: * (every weekday)
   - **Command**: 
   ```bash
   curl -s "https://yourdomain.com/sync/sync.php?key=your-unique-secret-key-here" > /dev/null
   ```

Or use wget:
```bash
wget -q -O /dev/null "https://yourdomain.com/sync/sync.php?key=your-unique-secret-key-here"
```

### Step 7: Monitor Logs

The sync creates a `sync_log.txt` file in the same directory as `sync.php`.

To view logs:
1. Go to File Manager in cPanel
2. Navigate to the sync folder
3. Right-click `sync_log.txt` → View

Or add this to your cron command to save output:
```bash
curl -s "https://yourdomain.com/sync/sync.php?key=your-key" >> /home/username/sync_output.log 2>&1
```

## Testing

### Test Manually

Visit in browser:
```
https://yourdomain.com/sync/sync.php?key=your-secret-key
```

### Test with curl (from terminal)

```bash
curl "https://yourdomain.com/sync/sync.php?key=your-secret-key"
```

### Expected Response

```json
{
    "timestamp": "2026-03-15 12:00:00",
    "inventory": {
        "success": true,
        "synced": 25,
        "errors": 0
    },
    "reservations": {
        "success": true,
        "synced": 3,
        "errors": 0
    },
    "success": true
}
```

## Security Notes

1. **Change the SECRET_KEY** - Don't use the default
2. **Keep the key secret** - Don't share it publicly
3. **Use HTTPS** - Ensure your domain has SSL certificate
4. **Restrict file permissions** - Set sync.php to 644
5. **Monitor logs** - Check for unauthorized access attempts

## Troubleshooting

### "Unauthorized" Error
- Check the `key` parameter in URL matches SECRET_KEY in sync.php

### "Database connection failed"
- Verify database names are correct
- Check user has privileges on both databases
- Confirm credentials are correct

### "Supabase request failed"
- Verify SUPABASE_SERVICE_KEY is correct
- Check SUPABASE_URL is correct
- Ensure server can make outbound HTTPS requests

### No data syncing
- Check if tables exist (run setup SQL scripts)
- Verify Supabase has data in room_availability and bookings tables
- Review sync_log.txt for detailed errors

### Cron job not running
- Check cron job syntax is correct
- Verify the URL is accessible
- Check cron job logs in cPanel

## File Structure on Server

```
public_html/
└── sync/
    ├── sync.php           (main sync script)
    └── sync_log.txt       (auto-generated logs)
```

## Monitoring

### View Recent Logs

Add this helper script `view-logs.php`:

```php
<?php
if ($_GET['key'] !== 'your-secret-key') die('Unauthorized');
echo '<pre>';
echo file_get_contents('sync_log.txt');
echo '</pre>';
?>
```

Visit: `https://yourdomain.com/sync/view-logs.php?key=your-key`

### Clear Old Logs

To prevent log file from growing too large, add to cron:

```bash
# Clear logs older than 7 days (run daily at midnight)
0 0 * * * find /home/username/public_html/sync -name "sync_log.txt" -mtime +7 -exec rm {} \;
```

Or truncate periodically:
```bash
# Keep only last 1000 lines
0 0 * * * tail -n 1000 /home/username/public_html/sync/sync_log.txt > /tmp/sync_log_temp.txt && mv /tmp/sync_log_temp.txt /home/username/public_html/sync/sync_log.txt
```

## Advantages of PHP Approach

✅ No IP whitelist issues (localhost connection)
✅ Runs on same server as databases
✅ Simple cron job scheduling
✅ Easy to monitor via cPanel
✅ No additional hosting costs
✅ Works on shared hosting

## Next Steps

1. Setup databases in phpMyAdmin
2. Upload sync.php to your server
3. Change the SECRET_KEY
4. Test manually in browser
5. Setup cron job for automatic execution
6. Monitor sync_log.txt

## Support

If you encounter issues:
1. Check sync_log.txt for detailed errors
2. Verify database credentials in cPanel
3. Test Supabase connection separately
4. Ensure PHP has curl extension enabled
