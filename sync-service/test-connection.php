<?php
/**
 * Test Database Connections
 * Usage: https://yourdomain.com/sync/test-connection.php?key=YOUR_SECRET_KEY
 */

// Security check
define('SECRET_KEY', 'naity_sync_rDqhMn85HXLcuiTBIaRt6vAmeKY3ClP2'); // Must match sync.php

if (!isset($_GET['key']) || $_GET['key'] !== SECRET_KEY) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

header('Content-Type: application/json');

// Database credentials
define('MYSQL_HOST', 'localhost'); // Changed from 68.65.123.142 to localhost
define('DB_NAITY_NAME', 'naitagfz_Naity_Booking');
define('DB_NAITY_USER', 'naitagfz_Naity_Booking');
define('DB_NAITY_PASS', 'p3cu(+odU6F^');
define('DB_SHAMSOFT_NAME', 'naitagfz_Cham_Soft');
define('DB_SHAMSOFT_USER', 'naitagfz_Samir');
define('DB_SHAMSOFT_PASS', 'r(eJX+6Cwjx1');

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => []
];

// Test NaityDB Connection
try {
    $pdoNaity = new PDO(
        'mysql:host=' . MYSQL_HOST . ';dbname=' . DB_NAITY_NAME . ';charset=utf8mb4',
        DB_NAITY_USER,
        DB_NAITY_PASS
    );
    $pdoNaity->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test query
    $stmt = $pdoNaity->query('SELECT COUNT(*) as count FROM rooms');
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['tests']['naity_booking_db'] = [
        'status' => 'success',
        'message' => 'Connected successfully',
        'database' => DB_NAITY_NAME,
        'rooms_count' => $count['count']
    ];
} catch (PDOException $e) {
    $results['tests']['naity_booking_db'] = [
        'status' => 'error',
        'database' => DB_NAITY_NAME,
        'message' => $e->getMessage()
    ];
}

// Test ShamSoftDB Connection
try {
    $pdoShamSoft = new PDO(
        'mysql:host=' . MYSQL_HOST . ';dbname=' . DB_SHAMSOFT_NAME . ';charset=utf8mb4',
        DB_SHAMSOFT_USER,
        DB_SHAMSOFT_PASS
    );
    $pdoShamSoft->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test query
    $stmt = $pdoShamSoft->query('SELECT COUNT(*) as count FROM rooms');
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['tests']['cham_soft_db'] = [
        'status' => 'success',
        'message' => 'Connected successfully',
        'database' => DB_SHAMSOFT_NAME,
        'rooms_count' => $count['count']
    ];
} catch (PDOException $e) {
    $results['tests']['cham_soft_db'] = [
        'status' => 'error',
        'database' => DB_SHAMSOFT_NAME,
        'message' => $e->getMessage()
    ];
}

// Test Supabase Connection
try {
    $url = 'https://scmgtoqilbkakxikigtz.supabase.co/rest/v1/hotels?select=count&limit=1';
    $headers = [
        'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbWd0b3FpbGJrYWt4aWtpZ3R6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUzNTA3MywiZXhwIjoyMDg4MTExMDczfQ.EwRswaOkNiC9xZNhjB8vYg-WOR41GAuaobSGTxj3FKM',
        'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbWd0b3FpbGJrYWt4aWtpZ3R6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUzNTA3MywiZXhwIjoyMDg4MTExMDczfQ.EwRswaOkNiC9xZNhjB8vYg-WOR41GAuaobSGTxj3FKM'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $results['tests']['supabase'] = [
            'status' => 'success',
            'message' => 'Connected successfully',
            'http_code' => $httpCode
        ];
    } else {
        $results['tests']['supabase'] = [
            'status' => 'error',
            'message' => "HTTP $httpCode",
            'response' => $response
        ];
    }
} catch (Exception $e) {
    $results['tests']['supabase'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// Summary
$allSuccess = true;
foreach ($results['tests'] as $test) {
    if ($test['status'] !== 'success') {
        $allSuccess = false;
        break;
    }
}

$results['overall'] = $allSuccess ? 'All tests passed ✅' : 'Some tests failed ❌';

echo json_encode($results, JSON_PRETTY_PRINT);
?>
