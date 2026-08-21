const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Generate Daraja OAuth Token
async function getMpesaToken() {
  const auth = Buffer.from(`${process.env.DARAJA_CONSUMER_KEY || 'H4vPUbiGLZOA2u0XPQv6Ig0XCctW8yGAmjjmdPndP3ZDxBRf'}:${process.env.DARAJA_CONSUMER_SECRET || 'pExaZQquoyIenkBm3LLWjHKfcIxbQ7zsU2sGSJpfoKGd1l4SETzwpwRX26oY5onx'}`).toString('base64');
  const res = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });
  return res.data.access_token;
}

// STK Push Payment Endpoint
app.post('/api/pay', async (req, res) => {
  const { phone, amount, route, seat } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ success: false, error: 'Phone number and amount are required.' });
  }

  // Format phone number to 2547XXXXXXXX
  let formattedPhone = phone.replace(/[^0-9]/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.length === 9) {
    formattedPhone = '254' + formattedPhone;
  }

  try {
    const token = await getMpesaToken();
    
    // Correct local timestamp format (YYYYMMDDHHMMSS)
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

    const shortcode = process.env.BUSINESS_SHORT_CODE || '174379';
    const passkey = process.env.DARAJA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const stkData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Number(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.SERVER_URL ? `${process.env.SERVER_URL}/api/mpesa/callback` : 'https://sandbox.safaricom.co.ke/mpesa/',
      AccountReference: `Seat_${seat || 'Standard'}`,
      TransactionDesc: `Booking for ${route || 'Bus Ticket'}`
    };

    const safaricomRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (safaricomRes.data.ResponseCode === "0") {
      res.json({ success: true, message: 'STK Push Sent Successfully', CheckoutRequestID: safaricomRes.data.CheckoutRequestID });
    } else {
      res.json({ success: false, error: safaricomRes.data.CustomerMessage || 'Payment request rejected by M-Pesa.' });
    }

  } catch (error) {
    console.error('STK Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: error.response?.data?.errorMessage || 'Payment Request Failed' });
  }
});

// M-Pesa Payment Callback Endpoint
app.post('/api/mpesa/callback', (req, res) => {
  console.log('M-Pesa Callback Payload Received:', JSON.stringify(req.body));
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
