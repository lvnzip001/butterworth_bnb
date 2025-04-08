import supabase from './supabase-client.js';

// Load all BnBs on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Fetching all BnB data...');
    const { data, error } = await supabase
      .from('bnb')
      .select('*');

    if (error) throw error;

    console.log('All BnB Data:', data);

    const bnbContainer = document.getElementById('bnb-name');
    if (data && data.length > 0) {
      bnbContainer.innerHTML = '<h2>Available BnBs</h2>';
      // Initially, we won’t display details until availability is checked
    } else {
      bnbContainer.textContent = 'No BnBs Found';
    }
    
    document.getElementById('bnb-description').textContent = 'Select dates to see available BnBs.';

  } catch (error) {
    console.error('BnB Load Error:', error);
    document.getElementById('bnb-name').textContent = 'Error Loading BnBs';
  }
});

// Check availability across all BnBs
window.checkAvailability = async () => {
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const resultsDiv = document.getElementById('availability-results');
  const bookingDetails = document.getElementById('booking-details');

  try {
    resultsDiv.innerHTML = '<p class="loading">Checking availability...</p>';

    // Fetch availability with related room type and BnB data
    const { data, error } = await supabase
      .from('availability')
      .select(`
        *,
        bnb_room_type (
          accomodation_type,
          price_per_night,
          bnb_id
        ),
        bnb (
          id,
          name
        )
      `)
      .gte('date', checkin)
      .lt('date', checkout);

    console.log('Availability Query:', { checkin, checkout });
    console.log('Availability Data:', data);

    if (error) throw error;

    if (!data || data.length === 0) {
      resultsDiv.innerHTML = '<p class="no-rooms">No availability found for these dates.</p>';
      bookingDetails.style.display = 'none';
      return;
    }

    // Group availability by BnB and room type
    const availabilityByBnb = {};
    data.forEach(item => {
      const bnbId = item.bnb_room_type.bnb_id;
      const roomType = item.bnb_room_type.accomodation_type;
      const bnbName = item.bnb.name;
      const key = `${bnbId}-${roomType}`;
      if (!availabilityByBnb[bnbId]) {
        availabilityByBnb[bnbId] = {
          bnbName,
          rooms: {}
        };
      }
      if (!availabilityByBnb[bnbId].rooms[roomType]) {
        availabilityByBnb[bnbId].rooms[roomType] = {
          pricePerNight: item.bnb_room_type.price_per_night,
          dates: []
        };
      }
      availabilityByBnb[bnbId].rooms[roomType].dates.push({
        date: item.date,
        available: item.available_quantity > 0
      });

      console.log('My Check:',   bnbName);
    });

    

    // Calculate number of nights
    const startDate = new Date(checkin);
    const endDate = new Date(checkout);
    const numberOfNights = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const datesNeeded = [];
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      datesNeeded.push(d.toISOString().split('T')[0]);
    }

    // Generate availability results
    let resultsHtml = '';
    Object.entries(availabilityByBnb).forEach(([bnbId, bnbData]) => {
      resultsHtml += `<h3>${bnbData.bnbName}</h3>`;
      Object.entries(bnbData.rooms).forEach(([roomType, roomData]) => {
        const isAvailable = datesNeeded.every(date => 
          roomData.dates.some(d => d.date === date && d.available)
        );
        if (isAvailable) {
          const totalPrice = roomData.pricePerNight * numberOfNights;
          resultsHtml += `
            <div class="room-option">
              <p>${roomType} - Available</p>
              <p>Total Price: R${totalPrice} for ${numberOfNights} night${numberOfNights > 1 ? 's' : ''}</p>
              <button onclick="selectRoom('${bnbId}', '${roomData.pricePerNight}', '${totalPrice}')">Book Now</button>
            </div>
          `;
        }
      });
    });

    if (resultsHtml) {
      resultsDiv.innerHTML = resultsHtml;
    } else {
      resultsDiv.innerHTML = '<p class="no-rooms">No rooms available for the entire stay.</p>';
      bookingDetails.style.display = 'none';
    }

  } catch (error) {
    console.error('Availability Error:', error);
    resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    bookingDetails.style.display = 'none';
  }
};

// Function to handle room selection
window.selectRoom = (bnbId, pricePerNight, totalPrice) => {
  document.getElementById('display-checkin').textContent = document.getElementById('checkin').value;
  document.getElementById('display-checkout').textContent = document.getElementById('checkout').value;
  document.getElementById('display-price').textContent = totalPrice;
  window.selectedBnbId = bnbId;
  window.selectedRoomPrice = pricePerNight; // Store for room type lookup if needed
  document.getElementById('booking-details').style.display = 'block';
};

// Submit booking function
window.submitBooking = async () => {
  const guestName = document.getElementById('guest-name').value;
  const guestEmail = document.getElementById('guest-email').value;
  const guestPhone = document.getElementById('guest-phone').value;
  const checkinDate = document.getElementById('checkin').value;
  const checkoutDate = document.getElementById('checkout').value;
  const totalCost = Number(document.getElementById('display-price').textContent);

  // Basic validation
  if (!guestName || !guestEmail || !guestPhone || !checkinDate || !checkoutDate) {
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

  if (!window.selectedBnbId) {
    alert('No BnB selected. Please check availability and select a room.');
    return;
  }

  try {
    // Fetch room_type_id based on bnb_id and price_per_night (assuming unique per BnB)
    const { data: roomData, error: roomError } = await supabase
      .from('bnb_room_type')
      .select('id')
      .eq('bnb_id', window.selectedBnbId)
      .eq('price_per_night', window.selectedRoomPrice)
      .single();

    if (roomError) throw roomError;

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        bnb_id: window.selectedBnbId,
        room_type_id: roomData.id,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        total_cost: totalCost,
        status: 'pending'
      }])
      .select();

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