function handleBookingFormSubmit(event) {
  event.preventDefault();

  // Collect form data
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const roomType = document.getElementById('confirmRoomType').value;
  const checkin = document.getElementById('confirmCheckin').value;
  const checkout = document.getElementById('confirmCheckout').value;
  const adults = document.getElementById('confirmAdults').value;
  const children = document.getElementById('confirmChildren').value;
  const totalCost = document.getElementById('confirmTotalCost').value;

  // Generate a simple booking ID
  const bookingId = 'B' + Math.random().toString(36).substr(2, 9).toUpperCase();

  // Store booking info in localStorage
  localStorage.setItem('bookingInfo', JSON.stringify({
    name: name,
    email: email,
    phone: phone,
    roomType: roomType,
    checkin: checkin,
    checkout: checkout,
    adults: adults,
    children: children,
    totalCost: totalCost,
    bookingId: bookingId
  }));

  // Add booking ID to form for email
  const bookingForm = document.getElementById('bookingForm');
  const bookingIdInput = document.createElement('input');
  bookingIdInput.type = 'hidden';
  bookingIdInput.name = 'bookingId';
  bookingIdInput.value = bookingId;
  bookingForm.appendChild(bookingIdInput);

  // Ensure Formsubmit.co hidden inputs are present
  bookingForm.submit();
}