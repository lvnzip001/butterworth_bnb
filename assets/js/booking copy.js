import supabase from './supabase-client.js';

const BNB_ID = '1b523c66-72c4-4a13-a6fa-3ed2531de7a2';

// Load BnB data on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Fetching BnB data...');
    const { data, error } = await supabase
      .from('bnb')
      .select('*')
      .eq('id', BNB_ID)
      .single();

    console.log('BnB Data:', data);
    
    if (error) throw error;
    
    document.getElementById('bnb-name').textContent = data?.name || 'No BnB Found';
    document.getElementById('bnb-description').textContent = data?.description || '';
    
  } catch (error) {
    console.error('BnB Load Error:', error);
    document.getElementById('bnb-name').textContent = 'Error Loading BnB';
  }
});

// Check availability function
window.checkAvailability = async () => {
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const resultsDiv = document.getElementById('availability-results');
  const bookingDetails = document.getElementById('booking-details');

  try {
    resultsDiv.innerHTML = '<p class="loading">Checking availability...</p>';

    // Fetch availability with related room type data
    const { data, error } = await supabase
      .from('availability')
      .select(`
        *,
        bnb_room_type (
          name,
          price_per_night
        )
      `)
      .eq('bnb_id', BNB_ID)
      .gte('date', checkin)
      .lt('date', checkout); // Nights are from checkin to checkout-1

    console.log('Availability Query:', { BNB_ID, checkin, checkout });
    console.log('Availability Data:', data);

    if (error) throw error;

    if (!data || data.length === 0) {
      resultsDiv.innerHTML = '<p class="no-rooms">No availability found for these dates.</p>';
      bookingDetails.style.display = 'none';
      return;
    }

    // Calculate number of nights and total price
    const roomType = data[0].bnb_room_type;
    const pricePerNight = roomType.price_per_night;
    const startDate = new Date(checkin);
    const endDate = new Date(checkout);
    const numberOfNights = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const totalPrice = pricePerNight * numberOfNights;

    // Generate list of required dates
    const datesNeeded = [];
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      datesNeeded.push(d.toISOString().split('T')[0]);
    }

    // Check availability for all required dates
    const availableDates = new Set(data.filter(item => item.available_quantity > 0).map(item => item.date));
    const isAvailable = datesNeeded.every(date => availableDates.has(date));

    if (isAvailable) {
      resultsDiv.innerHTML = `
        <p>The ${roomType.name} is available for your selected dates.</p>
        <p>Total price: R${totalPrice} for ${numberOfNights} night${numberOfNights > 1 ? 's' : ''}.</p>
      `;
      document.getElementById('display-checkin').textContent = checkin;
      document.getElementById('display-checkout').textContent = checkout;
      document.getElementById('display-price').textContent = totalPrice;
      bookingDetails.style.display = 'block';
      // document.getElementById('booking-details').style.display = 'none';
    } else {
      resultsDiv.innerHTML = '<p class="no-rooms">The room is not available for the entire stay.</p>';
      bookingDetails.style.display = 'none';
    }

  } catch (error) {
    console.error('Availability Error:', error);
    resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    bookingDetails.style.display = 'none';
  }
};

// Submit booking function
window.submitBooking = async () => {
  const guestName = document.getElementById('guest-name').value;
  const guestEmail = document.getElementById('guest-email').value;
  const checkinDate = document.getElementById('checkin').value;
  const checkoutDate = document.getElementById('checkout').value;
  const totalCost = Number(document.getElementById('display-price').textContent); // Get from span, convert to number
  const roomTypeId = 'e6cc4a87-8cee-48f0-9263-9d7956338714'; // From your data

  // Basic validation
  if (!guestName || !guestEmail || !checkinDate || !checkoutDate) {
    alert('Please fill in all required fields.');
    return;
  }

  if (new Date(checkoutDate) <= new Date(checkinDate)) {
    alert('Check-out date must be after check-in date.');
    return;
  }

  if (isNaN(totalCost) || totalCost <= 0) {
    alert('Invalid total cost. Please check availability again.');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        bnb_id: BNB_ID,
        room_type_id: roomTypeId,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        guest_name: guestName,
        guest_email: guestEmail,
        total_cost: totalCost, // Use corrected variable name
        status: 'pending' // Default value, can omit since table sets it
      }])
      .select(); // Return inserted row for confirmation

    if (error) throw error;

    console.log('Booking Created:', data);
    alert('Booking successful!');
    document.getElementById('guest-info').reset();
    document.getElementById('booking-details').style.display = 'none';
    document.getElementById('availability-results').innerHTML = '<div class="loading-message">Select dates to check availability</div>';

  } catch (error) {
    console.error('Booking Error:', error);
    alert(`Error: ${error.message}`);
  }
};