<?php
/**
 * View Sync Logs
 * Usage: https://yourdomain.com/sync/view-logs.php?key=YOUR_SECRET_KEY
 */

// Security check
define('SECRET_KEY', 'naity_sync_2026_secure_key_change_this'); // Must match sync.php

if (!isset($_GET['key']) || $_GET['key'] !== SECRET_KEY) {
    http_response_code(401);
    die('Unauthorized - Invalid or missing key');
}

// Get number of lines to display (default: 100)
$lines = isset($_GET['lines']) ? intval($_GET['lines']) : 100;

// Read log file
$logFile = __DIR__ . '/sync_log.txt';

if (!file_exists($logFile)) {
    die('No log file found. Sync has not run yet.');
}

// Get last N lines
$file = new SplFileObject($logFile);
$file->seek(PHP_INT_MAX);
$totalLines = $file->key() + 1;

$startLine = max(0, $totalLines - $lines);

$file->seek($startLine);
$output = '';

while (!$file->eof()) {
    $output .= $file->current();
    $file->next();
}

// Display
header('Content-Type: text/plain; charset=utf-8');
echo "=== SYNC LOG (Last $lines lines) ===\n";
echo "Total lines: $totalLines\n";
echo "Log file: $logFile\n";
echo str_repeat('=', 80) . "\n\n";
echo $output;
?>
