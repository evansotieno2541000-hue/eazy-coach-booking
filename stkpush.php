<?php
// Receive POST inputs from frontend script.js
$phone = $_POST['phone'];
$amount = $_POST['amount'];
$route = $_POST['route'];
$date = $_POST['date'];
$seat = $_POST['seat'];

// Store temporary booking data mapped to phone number
$bookingFile = "pending_bookings.json";
$pendingBookings = file_exists($bookingFile) ? json_decode(file_get_contents($bookingFile), true) : [];

$pendingBookings[$phone] = [
    'route' => $route,
    'date' => $date,
    'seat' => $seat,
    'amount' => $amount
];

file_put_contents($bookingFile, json_encode($pendingBookings));

// --- Proceed with regular Safaricom Daraja STK Push API call below ---
?>
