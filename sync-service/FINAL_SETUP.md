# 🎯 Final Setup - Namecheap PHP Sync Bridge

## ✅ What You Have

All files are ready in `app/sync-service/`:

### PHP Files (Upload to Namecheap):
1. **sync.php** - Main sync script
2. **test-connection.php** - Test database connections
3. **view-logs.php** - View sync logs

### SQL Setup Files (Run in phpMyAdmin):
1. **mysql-setup-naitydb.sql** - For naitagfz_Naity_Booking
2. **mysql-setup-shamsoftdb.sql** - For naitagfz_Cham_Soft

### Documentation:
- **NAMECHEAP_DEPLOYMENT.md** - Complete deployment guide
- **PHP_QUICKSTART.md** - Quick reference
- **PHP_SETUP_GUIDE.md** - Detailed instructions

## 🗄️ Your Database Setup

### Server: 68.65.123.142 (Namecheap)

**Database 1: naitagfz_Naity_Booking** (Your Main System)
- User: naitagfz_Naity_Booking
- Password: p3cu(+odU6F^
- Tables: rooms, reservations

**Database 2: naitagfz_Cham_Soft** (ShamSoft Local System)
- User: naitagfz_Samir
- Password: r(eJX+6Cwjx1
- Tables: rooms, reservations

**Supabase: lfnvnxeymkhyzzsvadbp.supabase.co**
- Tables: hotels, room_availability, bookings

## 🚀 Quick Deployment (5 Steps)

### 1. Create Tables in phpMyAdmin

**For naitagfz_Naity_Booking:**
- phpMyAdmin → Select database → SQL tab
- Paste `mysql-setup-naitydb.sql` → Go

**For naitagfz_Cham_Soft:**
- phpMyAdmin → Select database → SQL tab
- Paste `mysql-setup-shamsoftdb.sql` → Go

### 2. Upload PHP Files

- cPanel → File Manager → public_html
- Create folder: `sync`
- Upload: sync.php, test-connection.php, view-logs.php

### 3. Change Secret Key

Edit all 3 PHP files, change:
```php
define('SECRET_KEY', 'your-unique-secret-key-here');
```

### 4. Test

Visit:
```
https://yourdomain.com/sync/test-connection.php?key=your-key
```

Should show: "All tests passed ✅"

### 5. Setup Cron Job

cPanel → Cron Jobs → Add:
```
*/5 * * * * curl -s "https://yourdomain.com/sync/sync.php?key=your-key" > /dev/null
```

## 🔄 How It Works

### Every 5 Minutes:

1. **Inventory Sync**:
   - Fetch room data from Supabase
   - Update naitagfz_Naity_Booking.rooms
   - Update naitagfz_Cham_Soft.rooms

2. **Reservation Sync**:
   - Fetch pending bookings from Supabase
   - Insert into naitagfz_Naity_Booking.reservations
   - Insert into naitagfz_Cham_Soft.reservations
   - Mark Supabase booking as 'confirmed'

## 📝 Monitoring

**View Logs:**
```
https://yourdomain.com/sync/view-logs.php?key=your-key
```

**Or check File Manager:**
- Navigate to: public_html/sync/sync_log.txt
- Right-click → View

## 🔐 Security Notes

1. **Change the SECRET_KEY** - Don't use default
2. **Keep key private** - Don't share in public repos
3. **Use HTTPS** - Ensure SSL is active
4. **Protect files** - Set permissions to 644

## ✅ Verification Checklist

- [ ] Both databases created in cPanel
- [ ] Tables created (rooms + reservations in each)
- [ ] PHP files uploaded to public_html/sync/
- [ ] SECRET_KEY changed in all 3 files
- [ ] test-connection.php returns success
- [ ] sync.php runs without errors
- [ ] Cron job configured
- [ ] Logs are being written

## 🎊 Success Indicators

When everything works:
- ✅ test-connection.php shows all green
- ✅ sync.php returns success JSON
- ✅ sync_log.txt shows sync activity
- ✅ Reservations appear in both MySQL databases
- ✅ Supabase bookings change from 'pending' to 'confirmed'

## 📞 Need Help?

1. Run test-connection.php first
2. Check sync_log.txt for errors
3. Verify database credentials in cPanel
4. Ensure tables exist in phpMyAdmin
5. Test sync.php manually before setting up cron

## 🎯 Quick Commands

**Test everything:**
```
https://yourdomain.com/sync/test-connection.php?key=YOUR_KEY
```

**Run sync once:**
```
https://yourdomain.com/sync/sync.php?key=YOUR_KEY
```

**View last 100 log lines:**
```
https://yourdomain.com/sync/view-logs.php?key=YOUR_KEY
```

**View last 500 log lines:**
```
https://yourdomain.com/sync/view-logs.php?key=YOUR_KEY&lines=500
```

---

**You're all set!** Follow the steps above and your sync bridge will be running in minutes.
