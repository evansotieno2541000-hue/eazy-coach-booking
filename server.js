const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Generate Daraja OAuth Token
async function getMpesaToken() {
  const auth = Buffer.from(`${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`).toString('base64');
  const res = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });
  return res.data.access_token;
}

// STK Push Payment Endpoint
app.post('/api/pay', async (req, res) => {
  const { phone, amount, route, seat } = req.body;

  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortcode = '174379';
    const passkey = process.env.DARAJA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const stkData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: `${process.env.SERVER_URL}/api/mpesa/callback`,
      AccountReference: `Seat_${seat}`,
      TransactionDesc: `Booking for ${route}`
    };

    await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.json({ success: true, message: 'STK Push Sent Successfully' });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: 'Payment Request Failed' });
  }
});

// M-Pesa Payment Callback Endpoint
app.post('/api/mpesa/callback', (req, res) => {
  console.log('M-Pesa Callback Payload Received:', JSON.stringify(req.body));
  // Integrate Africa's Talking SMS dispatch logic here
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
