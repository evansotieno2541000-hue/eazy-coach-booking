<?php
header("Content-Type: application/json");

// Read M-Pesa Callback Payload
$stkCallbackResponse = file_get_contents('php://input');
$logFile = "mpesa_responses.json";
file_put_contents($logFile, $stkCallbackResponse . PHP_EOL, FILE_APPEND);

$data = json_decode($stkCallbackResponse, true);

$resultCode = $data['Body']['stkCallback']['ResultCode'];
$resultDesc = $data['Body']['stkCallback']['ResultDesc'];

if ($resultCode == 0) {
    // Payment Successful
    $callbackMetadata = $data['Body']['stkCallback']['CallbackMetadata']['Item'];
    
    $amount = "";
    $mpesaReceiptNumber = "";
    $phoneNumber = "";

    foreach ($callbackMetadata as $item) {
        if ($item['Name'] == 'Amount') {
            $amount = $item['Value'];
        }
        if ($item['Name'] == 'MpesaReceiptNumber') {
            $mpesaReceiptNumber = $item['Value'];
        }
        if ($item['Name'] == 'PhoneNumber') {
            $phoneNumber = $item['Value'];
        }
    }

    // Retrieve pending booking details saved during STK push
    $bookingFile = "pending_bookings.json";
    $pendingBookings = json_decode(file_get_contents($bookingFile), true);
    
    $userBooking = $pendingBookings[$phoneNumber] ?? null;

    $route = $userBooking['route'] ?? 'Selected Route';
    $date = $userBooking['date'] ?? date('Y-m-d');
    $seat = $userBooking['seat'] ?? 'Assigned Seat';

    // Construct the E-Ticket SMS Message
    $message = "EAZY COACH E-TICKET\n" .
               "Ref: " . $mpesaReceiptNumber . "\n" .
               "Route: " . $route . "\n" .
               "Date: " . $date . "\n" .
               "Seat: " . $seat . "\n" .
               "Amount: KES " . $amount . "\n" .
               "Thank you for traveling with Eazy Coach!";

    // Trigger SMS via Africa's Talking API
    sendSms($phoneNumber, $message);
}

function sendSms($recipients, $message) {
    $username = 'YOUR_AFRICASTALKING_USERNAME'; // e.g., 'sandbox' or live username
    $apiKey   = 'YOUR_AFRICASTALKING_API_KEY';  // Africa's Talking API Key

    $url = 'https://api.africastalking.com/version1/messaging'; // Use https://api.sandbox.africastalking.com/version1/messaging for testing

    $postData = array(
        'username' => $username,
        'to'       => '+' . $recipients,
        'message'  => $message
    );

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Accept: application/json',
        'Content-Type: application/x-www-form-urlencoded',
        'apiKey: ' . $apiKey
    ));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}
?>
