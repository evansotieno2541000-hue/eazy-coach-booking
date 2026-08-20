let selectedSeat = '';
let selectedFare = 0;

function updateFare() {
  const routeSelect = document.getElementById('route');
  const option = routeSelect.options[routeSelect.selectedIndex];
  selectedFare = option.getAttribute('data-fare') || 0;
  document.getElementById('total-fare').innerText = `KES ${selectedFare}`;
}

function selectSeat(button, seatNum) {
  document.querySelectorAll('.seat').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  selectedSeat = seatNum;
  document.getElementById('selected-seat-text').innerText = seatNum;
}

async function triggerMpesaPayment() {
  const route = document.getElementById('route').value;
  const date = document.getElementById('date').value;
  const phone = document.getElementById('phone').value;
  const statusMsg = document.getElementById('status-msg');

  if (!route || !date || !selectedSeat || !phone) {
    statusMsg.innerText = 'Please complete all fields and select a seat.';
    statusMsg.style.color = '#ef4444';
    return;
  }

  statusMsg.innerText = 'Sending M-Pesa STK push prompt...';
  statusMsg.style.color = '#38bdf8';

  try {
    const response = await fetch('https://eazy-coach-booking.onrender.com/api/pay', {
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
      statusMsg.style.color = '#22c55e';
    } else {
      statusMsg.innerText = 'Failed to initiate payment. Check phone number.';
      statusMsg.style.color = '#ef4444';
    }
  } catch (err) {
    statusMsg.innerText = 'Error connecting to backend server.';
    statusMsg.style.color = '#ef4444';
  }
}
