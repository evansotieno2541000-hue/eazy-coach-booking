<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// ------------------------------------------------------------------
// 1. DARAJA API CONFIGURATION
// ------------------------------------------------------------------
$consumerKey    = 'H4vPUbiGLZOA2u0XPQv6Ig0XCctW8yGAmjjmdPndP3ZDxBRf';
$consumerSecret = 'pExaZQquoyIenkBm3LLWjHKfcIxbQ7zsU2sGSJpfoKGd1l4SETzwpwRX26oY5onx';
$BusinessShortCode = '174379';
$Passkey        = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

$PartyB         = $BusinessShortCode;
$AccountReference = 'EazyCoach';
$TransactionDesc  = 'Bus Ticket Payment';

// Replace with your actual live domain URL
$CallBackURL    = 'https://your-domain.com/callback.php'; 

// Daraja Sandbox Endpoints
$authUrl    = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
$stkPushUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

// ------------------------------------------------------------------
// 2. CAPTURE & SANITIZE REQUEST DATA
// ------------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$jsonData = json_decode($rawInput, true);

$phone  = $_POST['phone']  ?? $jsonData['phone']  ?? '';
$amount = $_POST['amount'] ?? $jsonData['amount'] ?? '';
$route  = $_POST['route']  ?? $jsonData['route']  ?? 'Default Route';
$date   = $_POST['date']   ?? $jsonData['date']   ?? date('Y-m-d');
$seat   = $_POST['seat']   ?? $jsonData['seat']   ?? 'Standard';

if (empty($phone) || empty($amount)) {
    echo json_encode(["status" => "error", "message" => "Phone number and amount are required."]);
    exit;
}

// Format Phone Number to Standard 254XXXXXXXXX
$phone = preg_replace('/[^0-9]/', '', $phone);
if (substr($phone, 0, 1) == '0') {
    $phone = '254' . substr($phone, 1);
} elseif (strlen($phone) == 9) {
    $phone = '254' . $phone;
}

// ------------------------------------------------------------------
// 3. GENERATE SAFARICOM OAUTH ACCESS TOKEN
// ------------------------------------------------------------------
$headers = [
    'Authorization: Basic ' . base64_encode($consumerKey . ':' . $consumerSecret)
];

$ch = curl_init($authUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$authResponse = curl_exec($ch);
curl_close($ch);

$authData = json_decode($authResponse, true);
$accessToken = $authData['access_token'] ?? null;

if (!$accessToken) {
    echo json_encode(["status" => "error", "message" => "Failed to generate Daraja access token. Verify Consumer Key and Secret."]);
    exit;
}

// ------------------------------------------------------------------
// 4. GENERATE STK PUSH PASSWORD & PAYLOAD
// ------------------------------------------------------------------
$Timestamp = date('YmdHis');
$Password  = base64_encode($BusinessShortCode . $Passkey . $Timestamp);

$stkHeader = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $accessToken
];

$stkPayload = [
    'BusinessShortCode' => (int)$BusinessShortCode,
    'Password'          => $Password,
    'Timestamp'         => $Timestamp,
    'TransactionType'   => 'CustomerPayBillOnline',
    'Amount'            => (int)$amount,
    'PartyA'            => (int)$phone,
    'PartyB'            => (int)$PartyB,
    'PhoneNumber'       => (int)$phone,
    'CallBackURL'       => $CallBackURL,
    'AccountReference'  => $AccountReference,
    'TransactionDesc'   => $TransactionDesc
];

// ------------------------------------------------------------------
// 5. INITIATE STK PUSH REQUEST TO SAFARICOM
// ------------------------------------------------------------------
$ch = curl_init($stkPushUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, $stkHeader);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($stkPayload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$stkResponse = curl_exec($ch);
curl_close($ch);

$resData = json_decode($stkResponse, true);

// ------------------------------------------------------------------
// 6. SAVE PENDING BOOKING & RESPOND TO FRONTEND
// ------------------------------------------------------------------
if (isset($resData['ResponseCode']) && $resData['ResponseCode'] == "0") {
    
    $bookingFile = "pending_bookings.json";
    $pendingBookings = file_exists($bookingFile) ? json_decode(file_get_contents($bookingFile), true) : [];
    
    $pendingBookings[$phone] = [
        "route"  => $route,
        "date"   => $date,
        "seat"   => $seat,
        "amount" => $amount,
        "time"   => time()
    ];
    
    file_put_contents($bookingFile, json_encode($pendingBookings));

    echo json_encode([
        "status" => "success",
        "message" => "STK Push sent successfully.",
        "CheckoutRequestID" => $resData['CheckoutRequestID']
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => $resData['CustomerMessage'] ?? $resData['ResponseDescription'] ?? "STK Push request failed."
    ]);
}
?>
