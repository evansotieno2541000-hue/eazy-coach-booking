// State tracking variables
let selectedSeatNumber = null;
let currentFare = 0;

/**
 * Updates the total fare displayed based on the selected route.
 */
function updateFare() {
  const routeSelect = document.getElementById('route');
  const selectedOption = routeSelect.options[routeSelect.selectedIndex];
  
  // Extract custom data-fare attribute from selected route
  currentFare = selectedOption.getAttribute('data-fare') || 0;
  
  const totalFareDisplay = document.getElementById('total-fare');

  if (selectedSeatNumber && currentFare > 0) {
    totalFareDisplay.innerText = `KES ${parseInt(currentFare).toLocaleString()}`;
  } else if (currentFare > 0) {
    totalFareDisplay.innerText = `KES ${parseInt(currentFare).toLocaleString()}`;
  } else {
    totalFareDisplay.innerText = `KES 0`;
  }
}

/**
 * Handles seat selection click events in the 45-seat bus grid.
 */
function selectSeat(button, seatNumber) {
  // Clear 'selected' class from any previously selected seat
  const allSeats = document.querySelectorAll('.seat');
  allSeats.forEach(s => s.classList.remove('selected'));

  // Highlight the clicked seat
  button.classList.add('selected');
  selectedSeatNumber = seatNumber;

  // Update UI indicators
  document.getElementById('selected-seat-text').innerText = `Selected: ${seatNumber}`;
  
  if (currentFare > 0) {
    document.getElementById('total-fare').innerText = `KES ${parseInt(currentFare).toLocaleString()}`;
  }
}

/**
 * Validates inputs and triggers the payment workflow.
 */
function triggerMpesaPayment() {
  const route = document.getElementById('route').value;
  const date = document.getElementById('date').value;
  const phone = document.getElementById('phone').value.trim();
  const statusMsg = document.getElementById('status-msg');

  // Input validation checks
  if (!route) {
    alert("Please select a travel route.");
    return;
  }
  if (!date) {
    alert("Please select a travel date.");
    return;
  }
  if (!selectedSeatNumber) {
    alert("Please select a preferred seat from the bus layout.");
    return;
  }
  if (!phone || phone.length < 10) {
    alert("Please enter a valid M-Pesa phone number (e.g. 254712345678 or 0712345678).");
    return;
  }

  // Display pending state
  statusMsg.style.color = "#dc2626";
  statusMsg.innerText = "Initiating M-Pesa STK Push prompt...";

  /*
  // REAL BACKEND INTEGRATION:
  // Uncomment and update this block once you upload stkpush.php to a PHP server
  
  fetch('https://YOUR-PHP-SERVER-URL.com/stkpush.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      phone: phone,
      amount: currentFare,
      route: route,
      date: date,
      seat: selectedSeatNumber
    })
  })
  .then(response => response.json())
  .then(data => {
    statusMsg.style.color = "#16a34a";
    statusMsg.innerText = "STK Push sent! Please enter your M-Pesa PIN on your phone. SMS ticket will follow.";
  })
  .catch(error => {
    statusMsg.style.color = "#dc2626";
    statusMsg.innerText = "Failed to trigger payment. Please try again.";
  });
  */

  // DEMO SIMULATION (For testing interface directly on GitHub Pages)
  setTimeout(() => {
    statusMsg.style.color = "#16a34a";
    statusMsg.innerText = `STK Push sent to ${phone}! Complete payment on your phone to receive your SMS E-Ticket for Seat ${selectedSeatNumber}.`;
  }, 1500);
}
