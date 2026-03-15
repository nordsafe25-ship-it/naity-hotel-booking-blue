<?php
/**
 * Test Database Connections
 * Usage: https://yourdomain.com/sync/test-connection.php?key=YOUR_SECRET_KEY
 */

// Security check
define('SECRET_KEY', 'naity_sync_2026_secure_key_change_this'); // Must match sync.php

if (!isset($_GET['key']) || $_GET['key'] !== SECRET_KEY) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

header('Content-Type: application/json');

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => []
];

// Test NaityDB Connection
try {
    $pdoNaity = new PDO(
        'mysql:host=localhost;dbname=amsoft_NaityDB;charset=utf8mb4',
        'amsoft_naty',
        'g*TZtRDuyHoF'
    );
    $pdoNaity->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test query
    $stmt = $pdoNaity->query('SELECT COUNT(*) as count FROM rooms');
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['tests']['naitydb'] = [
        'status' => 'success',
        'message' => 'Connected successfully',
        'rooms_count' => $count['count']
    ];
} catch (PDOException $e) {
    $results['tests']['naitydb'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// Test ShamSoftDB Connection
try {
    $pdoShamSoft = new PDO(
        'mysql:host=localhost;dbname=amsoft_ShamSoftDB;charset=utf8mb4',
        'amsoft_naty',
        'g*TZtRDuyHoF'
    );
    $pdoShamSoft->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test query
    $stmt = $pdoShamSoft->query('SELECT COUNT(*) as count FROM rooms');
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['tests']['shamsoftdb'] = [
        'status' => 'success',
        'message' => 'Connected successfully',
        'rooms_count' => $count['count']
    ];
} catch (PDOException $e) {
    $results['tests']['shamsoftdb'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// Test Supabase Connection
try {
    $url = 'https://lfnvnxeymkhyzzsvadbp.supabase.co/rest/v1/hotels?select=count&limit=1';
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
