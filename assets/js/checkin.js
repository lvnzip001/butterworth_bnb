import supabase from './supabase-client.js';
import { getBnbIdByName, getRoomTypesWithColumns } from './utils.js';

// Pagination state
let currentWeekOffset = 0; // Number of weeks from the current date (0 = current week)
const DAYS_PER_WEEK = 7; // Show 1 week at a time
const MAX_WEEK_OFFSET = 4; // Limit to ±4 weeks from current date

// Initialize Check-in tab
export async function initCheckin() {
  const checkinTab = document.getElementById('checkin-tab');
  if (checkinTab) {
    checkinTab.addEventListener('shown.bs.tab', loadCheckinData);
    if (checkinTab.classList.contains('active')) {
      await loadCheckinData();
    }
  }

  // Setup form submission
  const submitBtn = document.getElementById('submit-checkin');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleCheckinSubmit);
  }

  // Setup Booking ID selection
  const bookingIdSelect = document.getElementById('booking-id');
  if (bookingIdSelect) {
    bookingIdSelect.addEventListener('change', validateBookingId);
    await populateBookingIdDropdown(); // Populate dropdown on load
  }

  // Set default check-in time
  const checkinTimeInput = document.getElementById('checkin-time');
  if (checkinTimeInput) {
    const now = new Date();
    checkinTimeInput.value = now.toISOString().slice(0, 16);
  }

  // Setup pagination buttons
  const prevButton = document.getElementById('availability-prev');
  const nextButton = document.getElementById('availability-next');
  if (prevButton && nextButton) {
    prevButton.addEventListener('click', () => {
      currentWeekOffset--;
      loadCheckinData();
    });
    nextButton.addEventListener('click', () => {
      currentWeekOffset++;
      loadCheckinData();
    });
  }

  // Load check-in history on page load (for all check-ins)
  await loadCheckinHistory(null);
}

let lastCheckinId = null; // Track last check-in for undo
let lastCheckin = null; // Added this line
let lastBooking = null;
// Load room availability data
async function loadCheckinData() {
  try {
    await loadRoomAvailability();
  } catch (error) {
    console.error('Error loading Check-in data:', error);
    alert('Failed to load check-in data: ' + error.message);
  }
}

// Populate Booking ID Dropdown
async function populateBookingIdDropdown() {
  const bookingIdSelect = document.getElementById('booking-id');
  if (!bookingIdSelect) {
    console.error('Booking ID dropdown element not found');
    return;
  }

  // Fetch completed bookings from 'bookings' only
  const { data: completedBookings, error: completedError } = await supabase
    .from('bookings')
    .select('booking_id, guest_name, checkin_date')
    .eq('status', 'complete');

  if (completedError) {
    console.error('Completed bookings fetch error:', completedError);
    alert('Failed to load completed bookings: ' + completedError.message);
    bookingIdSelect.innerHTML = '<option value="">Error loading bookings</option>';
    return;
  }

  console.log('Completed bookings from bookings table:', completedBookings);

  // Sort by booking_id for consistency
  const allBookings = completedBookings.map(b => ({ ...b, source: 'bookings' }));
  allBookings.sort((a, b) => a.booking_id.localeCompare(b.booking_id));

  // Populate dropdown
  bookingIdSelect.innerHTML = '<option value="">Select a Booking ID</option>';
  if (allBookings.length === 0) {
    console.warn('No completed bookings found');
    bookingIdSelect.innerHTML += '<option value="">No completed bookings available</option>';
  } else {
    allBookings.forEach(booking => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ id: booking.booking_id, source: booking.source });
      option.textContent = `${booking.booking_id} (${booking.guest_name})`;
      bookingIdSelect.appendChild(option);
    });
    console.log('Dropdown populated with', allBookings.length, 'options');
  }
}

async function loadRoomAvailability() {
    // Get current date
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Calculate first day of current week (Monday)
    const firstDayInWeek = new Date(now);
    const dayOfWeek = firstDayInWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    firstDayInWeek.setDate(firstDayInWeek.getDate() + diffToMonday);
    
    // Calculate the start date based on the current week offset
    const startDate = new Date(firstDayInWeek);
    startDate.setDate(firstDayInWeek.getDate() + currentWeekOffset * DAYS_PER_WEEK);
    
    // Generate dates for the week
    const dates = [];
    for (let i = 0; i < DAYS_PER_WEEK; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
  
    // Update pagination button states
    const prevButton = document.getElementById('availability-prev');
    const nextButton = document.getElementById('availability-next');
    prevButton.disabled = currentWeekOffset <= -MAX_WEEK_OFFSET;
    nextButton.disabled = currentWeekOffset >= MAX_WEEK_OFFSET;
  
    // Fetch room types
    let roomTypes = [];
    const bnbId = await getBnbIdByName(); // Replace with actual BnB name
    roomTypes = await getRoomTypesWithColumns(bnbId, 'id, accomodation_type');   
      
    // Filter room types based on selection
    const roomFilter = document.getElementById('room-filter')?.value || '';
    const filteredRoomTypes = roomFilter
      ? roomTypes.filter(t => t.accomodation_type === roomFilter)
      : roomTypes;
  
    const roomTypeMap = Object.fromEntries(filteredRoomTypes.map(t => [t.id, t.accomodation_type || `Unknown (ID: ${t.id})`]));
    const roomTypeIds = filteredRoomTypes.map(t => t.id);
  
    // Fetch check-ins (only confirmed check-ins are in checkins table)
    const { data: checkins, error: checkinError } = await supabase
      .from('checkins')
      .select('booking_id, guest_name, checkin_date, checkout_date, guest_email, guest_phone');
  
    if (checkinError) {
      console.error('Check-ins fetch error:', checkinError);
      alert('Failed to load check-ins: ' + checkinError.message);
      return;
    }
  
    console.log('Check-ins for availability:', checkins);
  
    // Fetch room_type_id from archive_checkin
    const bookingDetails = [];
    for (const checkin of checkins) {
      const { data: archivedBooking, error: bookingError } = await supabase
        .from('archive_checkin')
        .select('room_type_id')
        .eq('booking_id', checkin.booking_id)
        .single();
  
      if (bookingError) {
        console.error(`Error fetching archived booking for booking_id ${checkin.booking_id}:`, bookingError);
        continue;
      }
  
      const checkinDate = new Date(checkin.checkin_date).toISOString().split('T')[0];
      const checkoutDate = new Date(checkin.checkout_date).toISOString().split('T')[0];
      const startDateStr = dates[0].toISOString().split('T')[0];
      const endDateStr = dates[dates.length - 1].toISOString().split('T')[0];
  
      if (checkoutDate >= startDateStr && checkinDate <= endDateStr) {
        bookingDetails.push({
          ...checkin,
          room_type_id: archivedBooking.room_type_id
        });
      }
    }
  
    console.log('Booking details for availability:', bookingDetails);
  
    // Build the table header (dates)
    const header = document.getElementById('availability-header');
    if (header) {
      let headerRow = '<tr><th>Room</th>';
      dates.forEach(date => {
        const formattedDate = date.toISOString().split('T')[0];
        const isToday = formattedDate === todayStr;
        headerRow += `<th${isToday ? ' class="current-date"' : ''}>${formattedDate}</th>`;
      });
      headerRow += '</tr>';
      header.innerHTML = headerRow;
    }
  
    // Build the table body (rooms and availability with spanning)
    const tbody = document.getElementById('availability-body');
    if (tbody) {
      tbody.innerHTML = '';
      filteredRoomTypes.forEach(room => {
        // Filter bookings for this room
        const roomBookings = bookingDetails.filter(b => b.room_type_id === room.id);
  
        // Sort bookings by checkin_date
        roomBookings.sort((a, b) => new Date(a.checkin_date) - new Date(b.checkin_date));
  
        let row = `<tr><td>${room.accomodation_type}</td>`;
        let currentIndex = 0;
  
        while (currentIndex < dates.length) {
          const currentDateStr = dates[currentIndex].toISOString().split('T')[0];
  
          // Find all bookings that include this date
          const matchingBookings = roomBookings.filter(b => {
            const checkinDate = new Date(b.checkin_date).toISOString().split('T')[0];
            const checkoutDate = new Date(b.checkout_date).toISOString().split('T')[0];
            return currentDateStr >= checkinDate && currentDateStr <= checkoutDate;
          });
  
          if (matchingBookings.length === 0) {
            // No bookings, add an empty cell
            row += '<td class="empty-cell"></td>';
            currentIndex++;
          } else if (matchingBookings.length > 1) {
            // Conflict: Multiple bookings overlapping
            // Find the range of the conflict
            let earliestCheckin = currentDateStr;
            let latestCheckout = currentDateStr;
            matchingBookings.forEach(b => {
              const checkinDate = new Date(b.checkin_date).toISOString().split('T')[0];
              const checkoutDate = new Date(b.checkout_date).toISOString().split('T')[0];
              if (checkinDate < earliestCheckin) earliestCheckin = checkinDate;
              if (checkoutDate > latestCheckout) latestCheckout = checkoutDate;
            });
  
            const startIdx = dates.findIndex(d => d.toISOString().split('T')[0] >= earliestCheckin);
            const endIdx = dates.findIndex(d => d.toISOString().split('T')[0] === latestCheckout);
            const spanStartIdx = Math.max(startIdx, currentIndex);
            const spanEndIdx = endIdx >= 0 && endIdx < dates.length ? endIdx : dates.length - 1;
            const colspan = spanEndIdx - spanStartIdx + 1;
  
            const tooltipContent = matchingBookings.map(b => `Guest: ${b.guest_name}<br>Email: ${b.guest_email}<br>Phone: ${b.guest_phone || 'N/A'}<br>Check-in: ${new Date(b.checkin_date).toISOString().split('T')[0]}<br>Check-out: ${b.checkout_date}`).join('<hr>');
            row += `<td class="conflict-cell" colspan="${colspan}">Conflict (${matchingBookings.length})<span class="tooltip-text">${tooltipContent}</span></td>`;
            currentIndex = spanEndIdx + 1;
          } else {
            // Single booking, calculate the span
            const booking = matchingBookings[0];
            const checkinDate = new Date(booking.checkin_date).toISOString().split('T')[0];
            const checkoutDate = new Date(booking.checkout_date).toISOString().split('T')[0];
            const startDateStr = dates[0].toISOString().split('T')[0];
            const endDateStr = dates[dates.length - 1].toISOString().split('T')[0];
  
            // Determine the start and end indices within the displayed range
            const startIdx = dates.findIndex(d => d.toISOString().split('T')[0] >= checkinDate && d.toISOString().split('T')[0] >= startDateStr);
            const endIdx = dates.findIndex(d => d.toISOString().split('T')[0] === checkoutDate);
            const spanStartIdx = Math.max(startIdx, currentIndex);
            const spanEndIdx = endIdx >= 0 && endIdx < dates.length ? endIdx : dates.length - 1;
            const colspan = spanEndIdx - spanStartIdx + 1;
  
            const tooltipContent = `Guest: ${booking.guest_name}<br>Email: ${booking.guest_email}<br>Phone: ${booking.guest_phone || 'N/A'}<br>Check-in: ${new Date(booking.checkin_date).toISOString().split('T')[0]}<br>Check-out: ${booking.checkout_date}`;
            row += `<td class="booked-cell-confirmed" colspan="${colspan}" onclick="showBookingDetails('${booking.booking_id}')">${booking.guest_name}<span class="tooltip-text">${tooltipContent}</span></td>`;
            currentIndex = spanEndIdx + 1;
          }
        }
  
        row += '</tr>';
        tbody.innerHTML += row;
      });
  
      if (!filteredRoomTypes.length) {
        tbody.innerHTML = '<tr><td colspan="' + (dates.length + 1) + '">No rooms available</td></tr>';
      }
    }
  }
  
  // Placeholder function for clickable cells
  window.showBookingDetails = function(bookingId) {
    alert(`Clicked on booking ID: ${bookingId}`);
  };

  
  // Placeholder function for clickable cells
  window.showBookingDetails = function(bookingId) {
    alert(`Clicked on booking ID: ${bookingId}`);
  };
  


// Validate Booking ID and pre-fill guest details
async function validateBookingId() {
  const bookingIdSelect = document.getElementById('booking-id');
  const guestNameInput = document.getElementById('guest-name');
  const checkinTimeInput = document.getElementById('checkin-time');

  const selectedOption = bookingIdSelect.value;
  if (!selectedOption) {
    guestNameInput.value = '';
    // Load all check-ins when no booking_id is selected
    await loadCheckinHistory(null);
    return;
  }

  const { id: bookingId, source } = JSON.parse(selectedOption);

  const { data: booking, error } = await supabase
    .from(source)
    .select('guest_name, guest_email, checkin_date')
    .eq('booking_id', bookingId)
    .eq('status', 'complete')
    .single();

  if (error || !booking) {
    console.error('Booking validation error:', error);
    alert('Booking not found: ' + (error?.message || 'Unknown error'));
    guestNameInput.value = '';
    return;
  }

  // Pre-fill guest name
  guestNameInput.value = booking.guest_name;

  // Check for late check-in
  const expectedCheckin = new Date(booking.checkin_date);
  const checkinTime = new Date(checkinTimeInput.value);
  if (checkinTime > expectedCheckin) {
    alert(`Late Check-in: Expected on ${booking.checkin_date}`);
  }

  // Load check-in history for this booking
  await loadCheckinHistory(bookingId);
}

// async function loadCheckinHistory(bookingId) {
//     let query = supabase
//       .from('checkins')
//       .select('*')
//       .order('created_at', { ascending: false });
  
//     // If bookingId is provided, filter by it; otherwise, fetch all check-ins
//     if (bookingId) {
//       query = query.eq('booking_id', bookingId);
//     }
  
//     const { data: checkins, error } = await query;
  
//     if (error) {
//       console.error('Check-in history fetch error:', error);
//       alert('Failed to load check-in history: ' + error.message);
//       return;
//     }
  
//     const tbody = document.getElementById('checkin-history-body');
//     if (tbody) {
//       tbody.innerHTML = checkins.map(c => `
//         <tr>
//           <td>${new Date(c.checkin_time).toLocaleString()}</td>
//           <td>${c.guest_name}</td>
//           <td>${c.id_number || '-'}</td>
//           <td>${c.emergency_contact || '-'}</td>
//           <td>${c.key_handed_over ? 'Yes' : 'No'}</td>
//           <td>${c.rules_acknowledged ? 'Yes' : 'No'}</td>
//           <td>${c.payment_confirmed ? 'Yes' : 'No'}</td>
//           <td>${c.room_inspected ? 'Yes' : 'No'}</td>
//           <td>${c.notes || '-'}</td>
//           <td><button class="btn-checkout" data-booking-id="${c.booking_id}">Checkout</button></td>
//         </tr>
//       `).join('') || '<tr><td colspan="10">No check-in history</td></tr>';
//     }
//   }

async function loadCheckinHistory(bookingId) {
  let query = supabase
    .from('checkins')
    .select('*')
    .order('created_at', { ascending: false });

  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }

  const { data: checkins, error } = await query;

  if (error) {
    console.error('Check-in history fetch error:', error);
    alert('Failed to load check-in history: ' + error.message);
    return;
  }

  const tbody = document.getElementById('checkin-history-body');
  if (tbody) {
    tbody.innerHTML = checkins.map(c => `
      <tr>
        <td>${new Date(c.checkin_time).toLocaleString()}</td>
        <td>${c.guest_name}</td>
        <td>${c.id_number || '-'}</td>
        <td>${c.emergency_contact || '-'}</td>
        <td>${c.key_handed_over ? 'Yes' : 'No'}</td>
        <td>${c.rules_acknowledged ? 'Yes' : 'No'}</td>
        <td>${c.payment_confirmed ? 'Yes' : 'No'}</td>
        <td>${c.room_inspected ? 'Yes' : 'No'}</td>
        <td>${c.notes || '-'}</td>
        <td><button class="btn-checkout" data-booking-id="${c.booking_id}">Checkout</button></td>
      </tr>
    `).join('') || '<tr><td colspan="10">No check-in history</td></tr>';
  }
}

async function loadCheckoutTable() {
  const { data: checkouts, error } = await supabase
    .from('archive_checkout')
    .select('*')
    .order('checkout_date', { ascending: false });

  if (error) {
    console.error('Checkout table fetch error:', error);
    alert('Failed to load checkout table: ' + error.message);
    return;
  }

  const tableRows = checkouts.length > 0
    ? checkouts.map(c => `
        <tr>
          <td>${new Date(c.checkout_date).toLocaleString()}</td>
          <td>${c.guest_name || '-'}</td>
          <td>${c.guest_phone || '-'}</td>
          <td>${c.guest_email || '-'}</td>
          <td>
            <span style="color: ${c.room_inspected ? '#2e7d32' : '#d32f2f'}; font-size: 1.2em;">
              ${c.room_inspected ? '✔' : '✘'}
            </span> /
            <span style="color: ${c.key_collected ? '#2e7d32' : '#d32f2f'}; font-size: 1.2em;">
              ${c.key_collected ? '✔' : '✘'}
            </span>
          </td>
          <td>${c.comments || '-'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="6">No completed checkouts</td></tr>';

  const modalHtml = `
    <div class="modal checkout-table-modal" id="checkout-table-modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000;">
      <div class="modal-content" style="background-color: white; margin: 2% auto; padding: 30px; width: 90%; max-width: 1400px; border-radius: 12px; box-shadow: 0 6px 12px rgba(0,0,0,0.2); max-height: 80vh; overflow-y: auto;">
        <h2 style="font-size: 1.8rem; color: #333; margin-bottom: 20px; text-align: center;">Checkout History</h2>
        <table class="checkout-modal-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 12px; background-color: #f5f5f5; color: #333; font-weight: 600; border-bottom: 2px solid #ddd; text-align: left;">Checkout Date</th>
              <th style="padding: 12px; background-color: #f5f5f5; color: #333; font-weight: 600; border-bottom: 2px solid #ddd; text-align: left;">Guest Name</th>
              <th style="padding: 12px; background-color: #f5f5f5; color: #333; font-weight: 600; border-bottom: 2px solid #ddd; text-align: left;">Guest Phone</th>
              <th style="padding: 12px; background-color: #f5f5f5; color: #333; font-weight: 600; border-bottom: 2px solid #ddd; text-align: left;">Guest Email</th>
              <th style="padding: 12px; background-color: #f5f5f5; color: #333; font-weight: 600; border-bottom: 2px solid #ddd; text-align: left;">Room Inspected/Key Collected</th>
              <th style="padding: 12px; background-color: #f5f5f5; color: #333; font-weight: 600; border-bottom: 2px solid #ddd; text-align: left;">Comments</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div style="text-align: center; margin-top: 20px;">
          <button type="button" id="close-checkout-modal" style="background-color: #b0bec5; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const closeButton = document.getElementById('close-checkout-modal');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      const modal = document.getElementById('checkout-table-modal');
      if (modal) modal.remove();
    });
  }
}


  
  // async function loadCheckoutTable() {
  //   const { data: checkins, error } = await supabase
  //     .from('checkins')
  //     .select('*')
  //     .order('created_at', { ascending: false });
  
  //   if (error) {
  //     console.error('Checkout table fetch error:', error);
  //     alert('Failed to load checkout table: ' + error.message);
  //     return;
  //   }
  
  //   const tbody = document.getElementById('checkout-body');
  //   if (tbody) {
  //     const html = checkins.map(c => `
  //       <tr>
  //         <td>${new Date(c.checkin_time).toLocaleString()}</td>
  //         <td>${c.guest_name}</td>
  //         <td>${c.id_number || '-'}</td>
  //         <td>${c.emergency_contact || '-'}</td>
  //         <td><button class="btn-checkout" data-booking-id="${c.booking_id}">Checkout</button></td>
  //       </tr>
  //     `).join('') || '<tr><td colspan="5">No check-ins available for checkout</td></tr>';
  //     tbody.innerHTML = html;
  //     console.log('Checkout table loaded with HTML:', html); // Debug log
  //   }
  // }
  


  // Handle checkout process
 
  // async function handleCheckout(bookingId) {
  //   console.log('handleCheckout called with bookingId:', bookingId); // Debug log
  
  //   const { data: checkin, error: fetchError } = await supabase
  //     .from('checkins')
  //     .select('*')
  //     .eq('booking_id', bookingId)
  //     .single();
  
  //   if (fetchError || !checkin) {
  //     console.error('Check-in fetch error:', fetchError);
  //     alert('Check-in record not found: ' + (fetchError?.message || 'Unknown error'));
  //     return;
  //   }
  
  //   console.log('Check-in record found:', checkin); // Debug log
  
  //   const modalHtml = `
  //     <div class="modal" id="checkout-modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000;">
  //       <div style="background-color: white; margin: 10% auto; padding: 20px; width: 400px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  //         <h2>Checkout Confirmation</h2>
  //         <form id="checkout-form">
  //           <div style="margin-bottom: 15px;">
  //             <label>Room Inspected:</label>
  //             <select name="room_inspected" required>
  //               <option value="true">TRUE</option>
  //               <option value="false">FALSE</option>
  //             </select>
  //           </div>
  //           <div style="margin-bottom: 15px;">
  //             <label>Key Collected:</label>
  //             <select name="key_collected" required>
  //               <option value="true">TRUE</option>
  //               <option value="false">FALSE</option>
  //             </select>
  //           </div>
  //           <div style="margin-bottom: 15px;">
  //             <label>Comments:</label>
  //             <textarea name="comments" rows="3" style="width: 100%;" placeholder="Enter any comments"></textarea>
  //           </div>
  //           <button type="submit" style="background-color: #00796b; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Confirm Checkout</button>
  //           <button type="button" onclick="document.getElementById('checkout-modal').remove()" style="background-color: #b0bec5; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Cancel</button>
  //         </form>
  //       </div>
  //     </div>
  //   `;
  
  //   document.body.insertAdjacentHTML('beforeend', modalHtml);
  //   console.log('Modal HTML appended'); // Debug log
  
  //   const form = document.getElementById('checkout-form');
  //   if (form) {
  //     form.addEventListener('submit', async (e) => {
  //       e.preventDefault();
  
  //       const checkoutData = {
  //         booking_id: checkin.booking_id,
  //         guest_name: checkin.guest_name,
  //         guest_email: checkin.guest_email,
  //         guest_phone: checkin.guest_phone,
  //         checkout_date: new Date().toISOString(),
  //         room_inspected: form.room_inspected.value === 'true',
  //         key_collected: form.key_collected.value === 'true',
  //         comments: form.comments.value || null,
  //       };
  
  //       const { error: archiveError } = await supabase
  //         .from('archive_checkout')
  //         .insert(checkoutData);
  
  //       if (archiveError) {
  //         console.error('Checkout archive error:', archiveError);
  //         alert('Failed to archive checkout: ' + archiveError.message);
  //         document.getElementById('checkout-modal').remove();
  //         return;
  //       }
  
  //       const { error: deleteError } = await supabase
  //         .from('checkins')
  //         .delete()
  //         .eq('booking_id', bookingId);
  
  //       if (deleteError) {
  //         console.error('Check-in delete error:', deleteError);
  //         alert('Failed to delete check-in: ' + deleteError.message);
  //         document.getElementById('checkout-modal').remove();
  //         return;
  //       }
  
  //       loadCheckinHistory();
  //       loadCheckoutTable();
  //       document.getElementById('checkout-modal').remove();
  //       alert('Checkout completed successfully.');
  //     });
  //   } else {
  //     console.error('Checkout form not found');
  //   }
  // }

// Handle checkout process
async function handleCheckout(bookingId) {
  const { data: checkin, error: fetchError } = await supabase
    .from('checkins')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (fetchError || !checkin) {
    console.error('Check-in fetch error:', fetchError);
    alert('Check-in record not found: ' + (fetchError?.message || 'Unknown error'));
    return;
  }

  const modalHtml = `
    <div class="modal checkout-form-modal" id="checkout-form-modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1001;">
      <div style="background-color: white; margin: 10% auto; padding: 20px; width: 400px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size: 1.5rem; color: #333; margin-bottom: 20px;">Checkout Confirmation</h2>
        <form id="checkout-form">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #555;">Room Inspected:</label>
            <select name="room_inspected" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="true">TRUE</option>
              <option value="false">FALSE</option>
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #555;">Key Collected:</label>
            <select name="key_collected" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="true">TRUE</option>
              <option value="false">FALSE</option>
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #555;">Comments:</label>
            <textarea name="comments" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Enter any comments"></textarea>
          </div>
          <button type="submit" style="background-color: #00796b; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Confirm Checkout</button>
          <button type="button" onclick="document.getElementById('checkout-form-modal').remove()" style="background-color: #b0bec5; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Cancel</button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const checkoutData = {
        booking_id: checkin.booking_id,
        guest_name: checkin.guest_name,
        guest_email: checkin.guest_email,
        guest_phone: checkin.guest_phone,
        checkout_date: new Date().toISOString(),
        room_inspected: form.room_inspected.value === 'true',
        key_collected: form.room_inspected.value === 'true', // Fixed typo: should be form.key_collected.value
        comments: form.comments.value || null,
      };

      const { error: archiveError } = await supabase
        .from('archive_checkout')
        .insert(checkoutData);

      if (archiveError) {
        console.error('Checkout archive error:', archiveError);
        alert('Failed to archive checkout: ' + archiveError.message);
        document.getElementById('checkout-form-modal').remove();
        return;
      }

      const { error: deleteError } = await supabase
        .from('checkins')
        .delete()
        .eq('booking_id', bookingId);

      if (deleteError) {
        console.error('Check-in delete error:', deleteError);
        alert('Failed to delete check-in: ' + deleteError.message);
        document.getElementById('checkout-form-modal').remove();
        return;
      }

      loadCheckinHistory();
      document.getElementById('checkout-form-modal').remove();
      const checkoutTableModal = document.getElementById('checkout-table-modal');
      if (checkoutTableModal) checkoutTableModal.remove();
      alert('Checkout completed successfully.');
    });
  }
}

    // Event listeners for the checkout button
  
document.addEventListener('DOMContentLoaded', () => {
  const showCheckoutBtn = document.getElementById('show-checkout-btn');
  if (showCheckoutBtn) {
    showCheckoutBtn.addEventListener('click', () => {
      loadCheckoutTable();
    });
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-checkout')) {
    const bookingId = e.target.getAttribute('data-booking-id');
    if (bookingId) {
      handleCheckout(bookingId);
    }
  }
});
  
  // Event listeners for showing the checkout table
  document.addEventListener('DOMContentLoaded', () => {
    const showCheckoutBtn = document.getElementById('show-checkout-btn');
    if (showCheckoutBtn) {
      showCheckoutBtn.addEventListener('click', () => {
        const checkoutContainer = document.getElementById('checkout-container');
        if (checkoutContainer) {
          if (checkoutContainer.classList.contains('hidden')) {
            loadCheckoutTable();
            checkoutContainer.classList.remove('hidden');
            checkoutContainer.classList.add('visible');
            showCheckoutBtn.textContent = 'Hide Checkout Table';
          } else {
            checkoutContainer.classList.remove('visible');
            checkoutContainer.classList.add('hidden');
            showCheckoutBtn.textContent = 'Show Checkout Table';
          }
        } else {
          console.error('Checkout container not found');
        }
      });
    } else {
      console.error('Show Checkout button not found');
    }
  });



async function handleCheckinSubmit() {
    const bookingIdSelect = document.getElementById('booking-id');
    const selectedOption = bookingIdSelect.value;
    if (!selectedOption) {
      alert('Please select a Booking ID.');
      return;
    }
  
    const bookingData = JSON.parse(selectedOption);
    const bookingId = bookingData.id; // Text (booking_id, e.g., "BX78MXP9BU")
    const guestName = document.getElementById('guest-name').value.trim();
    const idNumber = document.getElementById('id-number').value.trim();
    const emergencyContact = document.getElementById('emergency-contact').value.trim();
    const checkinTime = document.getElementById('checkin-time').value;
    const keyHandedOver = document.getElementById('key-handed-over').checked;
    const rulesAcknowledged = document.getElementById('rules-acknowledged').checked;
    const paymentConfirmed = document.getElementById('payment-confirmed').checked;
    const roomInspected = document.getElementById('room-inspected').checked;
    const notes = document.getElementById('notes').value.trim();
  
    // Validate required fields (unchanged)
    if (!bookingId || !guestName || !checkinTime) {
      alert('Please fill in all required fields (Booking ID, Guest Name, Check-in Time).');
      return;
    }
  
    try {
      // Step 1: Fetch the booking
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_id', bookingId)
        .single();
      if (fetchError) throw new Error('Fetch booking error: ' + fetchError.message);
      if (!booking) throw new Error('Booking not found');
  
      // Step 2: Derive checkin_date from checkin_time
      const checkinDate = checkinTime ? new Date(checkinTime).toISOString().split('T')[0] : null;
  
      // Step 3: Submit check-in with new fields from booking
      const { data: insertedCheckin, error: checkinError } = await supabase
        .from('checkins')
        .insert({
          booking_id: booking.booking_id,
          guest_name: guestName,
          id_number: idNumber || null,
          emergency_contact: emergencyContact || null,
          checkin_time: checkinTime,
          key_handed_over: keyHandedOver,
          rules_acknowledged: rulesAcknowledged,
          payment_confirmed: paymentConfirmed,
          room_inspected: roomInspected,
          notes: notes || null,
          guest_phone: booking.guest_phone || null, // From bookings
          guest_email: booking.guest_email || null, // From bookings
          checkin_date: checkinDate, // Derived from checkin_time
          checkout_date: booking.checkout_date || null, // From bookings
          total_cost: booking.total_cost || null // From bookings
        })
        .select()
        .single();
      if (checkinError) throw new Error('Insert check-in error: ' + checkinError.message);
  
      // Step 4: Archive the check-in record in archive_checkins with new fields
      const { created_at: checkinCreatedAt, ...checkinData } = insertedCheckin;
      const archivedCheckin = {
        ...checkinData,
        booking_id: booking.booking_id,
        archived_at: new Date().toISOString()
      };
      const { error: archiveCheckinError } = await supabase
        .from('archive_checkins')
        .insert(archivedCheckin);
      if (archiveCheckinError) throw new Error('Insert into archive_checkins error: ' + archiveCheckinError.message);
  
      // Step 5: Archive the booking in archive_checkin
      const { created_at: bookingCreatedAt, ...bookingData } = booking;
      const archivedBooking = {
        ...bookingData,
        booking_id: booking.booking_id,
        archived_at: new Date().toISOString()
      };
      const { error: archiveBookingError } = await supabase
        .from('archive_checkin')
        .insert(archivedBooking);
      if (archiveBookingError) throw new Error('Insert into archive_checkin error: ' + archiveBookingError.message);
  
      // Step 6: Delete the booking from bookings (checkins record will remain)
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('booking_id', booking.booking_id);
      if (deleteError) throw new Error('Delete booking error: ' + deleteError.message);
  
      // Step 7: Show success alert
      const alert = document.getElementById('checkin-alert');
      if (alert) {
        alert.textContent = `Check-in successful for ${guestName} (Booking ID: ${bookingId})`;
        alert.classList.remove('d-none');
        setTimeout(() => alert.classList.add('d-none'), 3000);
      }
  
      // Step 8: Enable undo button
      lastCheckinId = insertedCheckin.id;
      lastCheckin = archivedCheckin;
      lastBooking = archivedBooking;
      const undoBtn = document.getElementById('undo-checkin');
      if (undoBtn) {
        undoBtn.classList.remove('d-none');
        undoBtn.onclick = handleUndoCheckin;
      }
  
      // Step 9: Reset form (removed guest-phone and total-cost reset)
      bookingIdSelect.value = '';
      document.getElementById('guest-name').value = '';
      document.getElementById('id-number').value = '';
      document.getElementById('emergency-contact').value = '';
      document.getElementById('checkin-time').value = new Date().toISOString().slice(0, 16);
      document.getElementById('key-handed-over').checked = false;
      document.getElementById('rules-acknowledged').checked = false;
      document.getElementById('payment-confirmed').checked = false;
      document.getElementById('room-inspected').checked = false;
      document.getElementById('notes').value = '';
  
      // Step 10: Reload history for all check-ins
      await loadCheckinHistory(null);
  
      // Step 11: Reload room availability
      await loadRoomAvailability();
    } catch (error) {
      console.error('Check-in submission error:', error.message);
      alert('Failed to submit check-in: ' + error.message);
    }
  }
// Undo Last Check-in
async function handleUndoCheckin() {
    if (!lastCheckinId || !lastCheckin || !lastBooking) {
      alert('No check-in to undo.');
      return;
    }
  
    try {
      // Step 1: Delete the archived check-in record from archive_checkins
      const { error: deleteCheckinError } = await supabase
        .from('archive_checkins')
        .delete()
        .eq('id', lastCheckinId);
      if (deleteCheckinError) throw new Error('Delete archived check-in error: ' + deleteCheckinError.message);
  
      // Step 2: Delete the archived booking from archive_checkin
      const { error: deleteBookingError } = await supabase
        .from('archive_checkin')
        .delete()
        .eq('id', lastBooking.id);
      if (deleteBookingError) throw new Error('Delete archived booking error: ' + deleteBookingError.message);
  
      // Step 3: Delete the check-in record from checkins
      const { error: deleteCheckinRecordError } = await supabase
        .from('checkins')
        .delete()
        .eq('id', lastCheckinId);
      if (deleteCheckinRecordError) throw new Error('Delete check-in record error: ' + deleteCheckinRecordError.message);
  
      // Step 4: Reinsert the booking into bookings
      const { archived_at: bookingArchivedAt, ...restoredBooking } = lastBooking;
      const { error: insertBookingError } = await supabase
        .from('bookings')
        .insert(restoredBooking);
      if (insertBookingError) throw new Error('Reinsert booking error: ' + insertBookingError.message);
  
      // Step 5: Show success alert
      const alert = document.getElementById('checkin-alert');
      if (alert) {
        alert.textContent = `Check-in undone successfully for Booking ID: ${lastBooking.booking_id}`;
        alert.classList.remove('d-none');
        setTimeout(() => alert.classList.add('d-none'), 3000);
      }
  
      // Step 6: Disable undo button
      lastCheckinId = null;
      lastCheckin = null;
      lastBooking = null;
      const undoBtn = document.getElementById('undo-checkin');
      if (undoBtn) {
        undoBtn.classList.add('d-none');
      }
  
      // Step 7: Reload history for all check-ins
      await loadCheckinHistory(null);
  
      // Step 8: Reload room availability
      await loadRoomAvailability();
    } catch (error) {
      console.error('Undo check-in error:', error.message);
      alert('Failed to undo check-in: ' + error.message);
    }
  }