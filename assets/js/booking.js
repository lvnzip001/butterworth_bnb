// document.addEventListener('DOMContentLoaded', () => {
//     const form = document.getElementById('bookingForm');
//     const availabilityDiv = document.getElementById('availability');
    
//     // Check availability on date change
//     document.getElementById('checkin').addEventListener('change', checkAvailability);
//     document.getElementById('checkout').addEventListener('change', checkAvailability);
  
//     async function checkAvailability() {
//       const bnbId = 'YOUR_BNB_ID'; // From your page/data attributes
//       const checkin = document.getElementById('checkin').value;
//       const checkout = document.getElementById('checkout').value;
  
//       const { data, error } = await supabase.rpc('check_availability', {
//         p_bnb_id: bnbId,
//         p_start_date: checkin,
//         p_end_date: checkout
//       });
  
//       if (!error) {
//         availabilityDiv.innerHTML = data.map(room => `
//           <div class="room-card">
//             <h3>${room.room_type_name}</h3>
//             <p>Available: ${room.available_quantity}</p>
//             <p>Price: $${room.price * dateDiff(checkin, checkout)}</p>
//             <button onclick="bookRoom('${room.room_type_id}')">Book Now</button>
//           </div>
//         `).join('');
//       }
//     }
  
//     window.bookRoom = async (roomTypeId) => {
//       const bookingData = {
//         guest_name: document.getElementById('name').value,
//         guest_email: document.getElementById('email').value,
//         checkin: document.getElementById('checkin').value,
//         checkout: document.getElementById('checkout').value,
//         bnb_id: 'YOUR_BNB_ID',
//         room_type_id: roomTypeId
//       };
  
//       try {
//         const { data, error } = await supabase.rpc('create_booking', {
//           p_bnb_id: bookingData.bnb_id,
//           p_room_type_id: bookingData.room_type_id,
//           p_checkin: bookingData.checkin,
//           p_checkout: bookingData.checkout,
//           p_guest_name: bookingData.guest_name,
//           p_guest_email: bookingData.guest_email
//         });
        
//         alert('Booking successful!');
//       } catch (error) {
//         alert('Error: ' + error.message);
//       }
//     };
//   });

// Updated checkAvailability function
// assets/js/booking.js
import supabase from './supabase-client.js';

const BNB_ID = '1b523c66-72c4-4a13-a6fa-3ed2531de7a2';

// Debug BnB data
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Fetching BnB data...');
    const { data, error } = await supabase
      .from('bnb')
      .select('*')
      .eq('id', BNB_ID)
      .single();

    console.log('BnB Data:', data); // Debug log
    
    if (error) throw error;
    
    document.getElementById('bnb-name').textContent = data?.name || 'No BnB Found';
    document.getElementById('bnb-description').textContent = data?.description || '';
    
  } catch (error) {
    console.error('BnB Load Error:', error);
    document.getElementById('bnb-name').textContent = 'Error Loading BnB';
  }
});

window.checkAvailability = async () => {
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const resultsDiv = document.getElementById('availability-results');
  
    try {
      resultsDiv.innerHTML = '<p class="loading">Checking availability...</p>';
      
      // Corrected relationship query
      const { data, error } = await supabase
        .from('availability')
        .select(`*
        `)
        .eq('bnb_id', BNB_ID)
        .gte('date', checkin)
        .lte('date', checkout);
      
      console.log(checkin, checkout); // Debug log
      console.log('Availability Query:', BNB_ID, checkin, checkout); // Debug log
      console.log('Availability Data:', data); // Debug log
      
      if (error) throw error;
  
      if (!data || data.length === 0) {
        resultsDiv.innerHTML = '<p class="no-rooms">No availability found</p>';
        return;
      }
  
      resultsDiv.innerHTML = data.map(item => `
        <div class="room-card">
          <h3>${item.bnb_room_type?.name || 'Unknown Room'}</h3>
          <p>Date: ${new Date(item.date).toLocaleDateString()}</p>
          <p>Price: $${item.bnb_room_type?.price_per_night || 'N/A'}</p>
        </div>
      `).join('');
  
    } catch (error) {
      console.error('Availability Error:', error);
      resultsDiv.innerHTML = `
        <p class="error">
          Error: ${error.message}
          ${error.hint ? `<br><small>${error.hint}</small>` : ''}
        </p>
      `;
    }
  };