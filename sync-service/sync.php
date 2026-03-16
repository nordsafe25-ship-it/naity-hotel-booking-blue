<?php
/**
 * Data Sync Bridge - PHP Version
 * Syncs data between Supabase and two local MySQL databases
 * 
 * Usage: https://yourdomain.com/sync.php?key=YOUR_SECRET_KEY
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Security: Secret key to prevent unauthorized access
define('SECRET_KEY', 'naity_sync_rDqhMn85HXLcuiTBIaRt6vAmeKY3ClP2');

// Supabase Configuration
define('SUPABASE_URL', 'https://scmgtoqilbkakxikigtz.supabase.co');
define('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbWd0b3FpbGJrYWt4aWtpZ3R6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUzNTA3MywiZXhwIjoyMDg4MTExMDczfQ.EwRswaOkNiC9xZNhjB8vYg-WOR41GAuaobSGTxj3FKM');

// MySQL Configuration (Namecheap Shared Server - 68.65.123.142)
// Both databases are on the same server
define('MYSQL_HOST', 'localhost'); // Changed from 68.65.123.142 to localhost

// Naity Booking Database (Main System)
define('DB_NAITY_NAME', 'naitagfz_Naity_Booking');
define('DB_NAITY_USER', 'naitagfz_Naity_Booking');
define('DB_NAITY_PASS', 'p3cu(+odU6F^');

// ShamSoft Database (Local Hotel System)
define('DB_SHAMSOFT_NAME', 'naitagfz_Cham_Soft');
define('DB_SHAMSOFT_USER', 'naitagfz_Samir');
define('DB_SHAMSOFT_PASS', 'r(eJX+6Cwjx1');

// Log file path
define('LOG_FILE', __DIR__ . '/sync_log.txt');

// ============================================================================
// SECURITY CHECK
// ============================================================================

if (!isset($_GET['key']) || $_GET['key'] !== SECRET_KEY) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized - Invalid or missing key']));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Write to log file with timestamp
 */
function writeLog($message, $data = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    
    if ($data !== null) {
        $logMessage .= "\n" . json_encode($data, JSON_PRETTY_PRINT);
    }
    
    $logMessage .= "\n" . str_repeat('=', 80) . "\n";
    
    file_put_contents(LOG_FILE, $logMessage, FILE_APPEND);
    echo $logMessage;
}

/**
 * Make HTTP request to Supabase
 */
function supabaseRequest($method, $endpoint, $data = null) {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    
    $headers = [
        'apikey: ' . SUPABASE_SERVICE_KEY,
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'PATCH') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 400) {
        throw new Exception("Supabase request failed: HTTP $httpCode - $response");
    }
    
    return json_decode($response, true);
}

/**
 * Create PDO connection
 */
function createConnection($database, $user, $password) {
    try {
        $dsn = "mysql:host=" . MYSQL_HOST . ";dbname=$database;charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception("Database connection failed for $database: " . $e->getMessage());
    }
}

// ============================================================================
// INVENTORY SYNC: Supabase → NaityDB → ShamSoftDB
// ============================================================================

function syncInventory() {
    writeLog("🔄 Starting Inventory Sync (Supabase → MySQL)");
    
    try {
        // Fetch room availability from Supabase
        writeLog("Fetching room availability from Supabase...");
        $rooms = supabaseRequest('GET', 'room_availability?select=*');
        
        if (empty($rooms)) {
            writeLog("⚠️  No rooms found in Supabase");
            return ['success' => true, 'message' => 'No rooms to sync'];
        }
        
        writeLog("✅ Found " . count($rooms) . " rooms in Supabase");
        
        // Connect to both databases
        $pdoNaity = createConnection(DB_NAITY_NAME, DB_NAITY_USER, DB_NAITY_PASS);
        $pdoShamSoft = createConnection(DB_SHAMSOFT_NAME, DB_SHAMSOFT_USER, DB_SHAMSOFT_PASS);
        
        $successCount = 0;
        $errorCount = 0;
        
        foreach ($rooms as $room) {
            try {
                $roomNumber = $room['room_number'] ?? 'N/A';
                $categoryName = $room['category_name'] ?? 'Standard';
                $price = $room['price_per_night'] ?? 0;
                $status = $room['status'] ?? 'available';
                
                // Update or Insert into NaityDB
                $stmtNaity = $pdoNaity->prepare("
                    INSERT INTO rooms (room_number, room_type, price, status, updated_at)
                    VALUES (:room_number, :room_type, :price, :status, NOW())
                    ON DUPLICATE KEY UPDATE
                        room_type = :room_type,
                        price = :price,
                        status = :status,
                        updated_at = NOW()
                ");
                
                $stmtNaity->execute([
                    ':room_number' => $roomNumber,
                    ':room_type' => $categoryName,
                    ':price' => $price,
                    ':status' => $status
                ]);
                
                // Update or Insert into ShamSoftDB
                $stmtShamSoft = $pdoShamSoft->prepare("
                    INSERT INTO rooms (room_number, room_type, price, status, updated_at)
                    VALUES (:room_number, :room_type, :price, :status, NOW())
                    ON DUPLICATE KEY UPDATE
                        room_type = :room_type,
                        price = :price,
                        status = :status,
                        updated_at = NOW()
                ");
                
                $stmtShamSoft->execute([
                    ':room_number' => $roomNumber,
                    ':room_type' => $categoryName,
                    ':price' => $price,
                    ':status' => $status
                ]);
                
                $successCount++;
            } catch (Exception $e) {
                writeLog("❌ Error syncing room $roomNumber: " . $e->getMessage());
                $errorCount++;
            }
        }
        
        writeLog("✅ Inventory sync completed: $successCount synced, $errorCount errors");
        return ['success' => true, 'synced' => $successCount, 'errors' => $errorCount];
        
    } catch (Exception $e) {
        writeLog("❌ Inventory sync failed: " . $e->getMessage());
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// ============================================================================
// RESERVATION SYNC: Supabase → NaityDB & ShamSoftDB
// ============================================================================

function syncReservations() {
    writeLog("🔄 Starting Reservation Sync (Supabase → MySQL)");
    
    try {
        // Fetch pending bookings from Supabase
        writeLog("Fetching pending bookings from Supabase...");
        $bookings = supabaseRequest('GET', 'bookings?status=eq.pending&order=created_at.asc');
        
        if (empty($bookings)) {
            writeLog("ℹ️  No pending bookings to sync");
            return ['success' => true, 'message' => 'No pending bookings'];
        }
        
        writeLog("✅ Found " . count($bookings) . " pending bookings");
        
        // Connect to both databases
        $pdoNaity = createConnection(DB_NAITY_NAME, DB_NAITY_USER, DB_NAITY_PASS);
        $pdoShamSoft = createConnection(DB_SHAMSOFT_NAME, DB_SHAMSOFT_USER, DB_SHAMSOFT_PASS);
        
        $successCount = 0;
        $errorCount = 0;
        
        foreach ($bookings as $booking) {
            try {
                $supabaseId = $booking['id'];
                $roomNumber = $booking['room_number'] ?? 'TBD';
                $guestName = trim(($booking['guest_first_name'] ?? '') . ' ' . ($booking['guest_last_name'] ?? ''));
                $guestEmail = $booking['guest_email'] ?? '';
                $guestPhone = $booking['guest_phone'] ?? '';
                $checkIn = $booking['check_in'] ?? '';
                $checkOut = $booking['check_out'] ?? '';
                $totalPrice = $booking['total_price'] ?? 0;
                $specialRequests = $booking['special_requests'] ?? '';
                $createdAt = $booking['created_at'] ?? date('Y-m-d H:i:s');
                
                // Insert into NaityDB
                $stmtNaity = $pdoNaity->prepare("
                    INSERT INTO reservations 
                    (supabase_id, room_number, guest_name, guest_email, guest_phone, check_in, check_out, total_price, special_requests, created_at)
                    VALUES (:supabase_id, :room_number, :guest_name, :guest_email, :guest_phone, :check_in, :check_out, :total_price, :special_requests, :created_at)
                    ON DUPLICATE KEY UPDATE
                        room_number = :room_number,
                        guest_name = :guest_name,
                        updated_at = NOW()
                ");
                
                $stmtNaity->execute([
                    ':supabase_id' => $supabaseId,
                    ':room_number' => $roomNumber,
                    ':guest_name' => $guestName,
                    ':guest_email' => $guestEmail,
                    ':guest_phone' => $guestPhone,
                    ':check_in' => $checkIn,
                    ':check_out' => $checkOut,
                    ':total_price' => $totalPrice,
                    ':special_requests' => $specialRequests,
                    ':created_at' => $createdAt
                ]);
                
                // Insert into ShamSoftDB
                $stmtShamSoft = $pdoShamSoft->prepare("
                    INSERT INTO reservations 
                    (supabase_id, room_number, guest_name, guest_email, guest_phone, check_in, check_out, total_price, special_requests, created_at)
                    VALUES (:supabase_id, :room_number, :guest_name, :guest_email, :guest_phone, :check_in, :check_out, :total_price, :special_requests, :created_at)
                    ON DUPLICATE KEY UPDATE
                        room_number = :room_number,
                        guest_name = :guest_name,
                        updated_at = NOW()
                ");
                
                $stmtShamSoft->execute([
                    ':supabase_id' => $supabaseId,
                    ':room_number' => $roomNumber,
                    ':guest_name' => $guestName,
                    ':guest_email' => $guestEmail,
                    ':guest_phone' => $guestPhone,
                    ':check_in' => $checkIn,
                    ':check_out' => $checkOut,
                    ':total_price' => $totalPrice,
                    ':special_requests' => $specialRequests,
                    ':created_at' => $createdAt
                ]);
                
                // Update Supabase booking status to 'confirmed'
                supabaseRequest('PATCH', "bookings?id=eq.$supabaseId", [
                    'status' => 'confirmed',
                    'hotel_notified_at' => date('c'),
                    'hotel_notification_status' => 'sent',
                    'updated_at' => date('c')
                ]);
                
                writeLog("✅ Synced booking: $supabaseId - $guestName");
                $successCount++;
                
            } catch (Exception $e) {
                writeLog("❌ Error syncing booking $supabaseId: " . $e->getMessage());
                $errorCount++;
            }
        }
        
        writeLog("✅ Reservation sync completed: $successCount synced, $errorCount errors");
        return ['success' => true, 'synced' => $successCount, 'errors' => $errorCount];
        
    } catch (Exception $e) {
        writeLog("❌ Reservation sync failed: " . $e->getMessage());
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Start sync
writeLog("================================================================================");
writeLog("🚀 Data Sync Started");
writeLog("================================================================================");

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'inventory' => null,
    'reservations' => null
];

try {
    // Run Inventory Sync
    writeLog("\n--- INVENTORY SYNC ---");
    $results['inventory'] = syncInventory();
    
    // Run Reservation Sync
    writeLog("\n--- RESERVATION SYNC ---");
    $results['reservations'] = syncReservations();
    
    writeLog("================================================================================");
    writeLog("✨ Data Sync Completed Successfully");
    writeLog("================================================================================");
    
    $results['success'] = true;
    
} catch (Exception $e) {
    writeLog("================================================================================");
    writeLog("💥 Data Sync Failed: " . $e->getMessage());
    writeLog("================================================================================");
    
    $results['success'] = false;
    $results['error'] = $e->getMessage();
}

// Return JSON response
echo json_encode($results, JSON_PRETTY_PRINT);
?>
