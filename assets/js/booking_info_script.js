document.addEventListener('DOMContentLoaded', () => {
    const bookingInfo = JSON.parse(localStorage.getItem('bookingInfo'));
    if (bookingInfo) {
      document.getElementById('booking-id') && (document.getElementById('booking-id').textContent = bookingInfo.bookingId);
      document.getElementById('guest-name') && (document.getElementById('guest-name').textContent = bookingInfo.name);
      document.getElementById('guest-email') && (document.getElementById('guest-email').textContent = bookingInfo.email);
      document.getElementById('guest-phone') && (document.getElementById('guest-phone').textContent = bookingInfo.phone);
      document.getElementById('room-type') && (document.getElementById('room-type').textContent = bookingInfo.roomType);
      document.getElementById('checkin') && (document.getElementById('checkin').textContent = bookingInfo.checkin);
      document.getElementById('checkout') && (document.getElementById('checkout').textContent = bookingInfo.checkout);
      document.getElementById('adults') && (document.getElementById('adults').textContent = bookingInfo.adults);
      document.getElementById('children') && (document.getElementById('children').textContent = bookingInfo.children);
      document.getElementById('total-cost') && (document.getElementById('total-cost').textContent = bookingInfo.totalCost);
      localStorage.removeItem('bookingInfo');
    } else {
      console.error('No booking info found in localStorage');
    }
  });