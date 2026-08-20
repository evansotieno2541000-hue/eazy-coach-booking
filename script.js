let selectedSeat = '';
let selectedFare = 0;

// Update total fare based on route
function updateFare() {
  const routeSelect = document.getElementById('route');
  const option = routeSelect.options[routeSelect.selectedIndex];
  selectedFare = option.getAttribute('data-fare') || 0;
  document.getElementById('total-fare').innerText = `KES ${selectedFare}`;
}

// Seat selection logic
function selectSeat(button, seatNum) {
  document.querySelectorAll('.seat').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  selectedSeat = seatNum;
  document.getElementById('selected-seat-text').innerText = seatNum;
}

// Trigger payment call to your Render backend
async function triggerMpesaPayment() {
  const route = document.getElementById('route').value;
  const date = document.getElementById('date').value;
  const phone = document.getElementById('phone').value;
  const statusMsg = document.getElementById('status-msg');

  if (!route || !date || !selectedSeat || !phone) {
    statusMsg.innerText = 'Please complete all fields and pick a seat.';
    statusMsg.style.color = 'red';
    return;
  }

  statusMsg.innerText = 'Sending M-Pesa STK push prompt...';
  statusMsg.style.color = 'blue';

  try {
    // Replace URL below with your actual Render API URL once deployed
    const response = await fetch('https://eazy-coach-api.onrender.com/api/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        amount: selectedFare,
        route: route,
        seat: selectedSeat,
        date: date
      })
    });

    const data = await response.json();
    if (data.success) {
      statusMsg.innerText = 'STK Push sent! Enter your PIN on your phone.';
      statusMsg.style.color = 'green';
    } else {
      statusMsg.innerText = 'Failed to initiate payment. Check phone number.';
      statusMsg.style.color = 'red';
    }
  } catch (err) {
    statusMsg.innerText = 'Error connecting to server.';
    statusMsg.style.color = 'red';
  }
}
