import supabase from './supabase-client.js';

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

// Load Room Availability Table
// async function loadRoomAvailability() {
//   // Get current date
//   const now = new Date();
  
//   // Calculate first day of current week (Monday)
//   const firstDayInWeek = new Date(now);
//   const dayOfWeek = firstDayInWeek.getDay(); // 0 (Sunday) to 6 (Saturday)
//   const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
//   firstDayInWeek.setDate(firstDayInWeek.getDate() + diffToMonday);
  
//   // Calculate the start date based on the current week offset
//   const startDate = new Date(firstDayInWeek);
//   startDate.setDate(firstDayInWeek.getDate() + currentWeekOffset * DAYS_PER_WEEK);
  
//   // Generate dates for the week
//   const dates = [];
//   for (let i = 0; i < DAYS_PER_WEEK; i++) {
//     const date = new Date(startDate);
//     date.setDate(startDate.getDate() + i);
//     dates.push(date);
//   }

//   // Update pagination button states
//   const prevButton = document.getElementById('availability-prev');
//   const nextButton = document.getElementById('availability-next');
//   prevButton.disabled = currentWeekOffset <= -MAX_WEEK_OFFSET;
//   nextButton.disabled = currentWeekOffset >= MAX_WEEK_OFFSET;

//   // Fetch room types
//   const { data: roomTypes, error: roomError } = await supabase
//     .from('bnb_room_type')
//     .select('id, accomodation_type');

//   if (roomError) {
//     console.error('Room types fetch error:', roomError);
//     alert('Failed to load room types: ' + roomError.message);
//     return;
//   }

//   const roomTypeMap = Object.fromEntries(roomTypes.map(t => [t.id, t.accomodation_type || `Unknown (ID: ${t.id})`]));
//   const roomTypeIds = roomTypes.map(t => t.id);

//   // Fetch check-ins for the date range
//   const startDateStr = dates[0].toISOString().split('T')[0];
//   const endDateStr = dates[dates.length - 1].toISOString().split('T')[0];
//   const { data: checkins, error: checkinError } = await supabase
//     .from('checkins')
//     .select('booking_id, guest_name, checkin_time')
//     .gte('checkin_time', startDateStr + 'T00:00:00Z')
//     .lte('checkin_time', endDateStr + 'T23:59:59Z');

//   if (checkinError) {
//     console.error('Check-ins fetch error:', checkinError);
//     alert('Failed to load check-ins: ' + checkinError.message);
//     return;
//   }

//   console.log('Check-ins for availability:', checkins);

//   // Fetch booking details for each check-in using booking_id
//   const bookingDetails = [];
//   for (const checkin of checkins) {
//     const { data: booking, error: bookingError } = await supabase
//       .from('bookings')
//       .select('room_type_id, checkout_date, guest_email')
//       .eq('booking_id', checkin.booking_id)
//       .single();

//     if (bookingError) {
//       console.error(`Error fetching booking for booking_id ${checkin.booking_id}:`, bookingError);
//       continue; // Skip this check-in if booking fetch fails
//     }

//     bookingDetails.push({
//       ...checkin,
//       room_type_id: booking.room_type_id,
//       checkout_date: booking.checkout_date,
//       guest_email: booking.guest_email
//     });
//   }

//   console.log('Booking details for availability:', bookingDetails);

//   // Build the table header (dates)
//   const header = document.getElementById('availability-header');
//   if (header) {
//     let headerRow = '<tr><th>Room</th>';
//     dates.forEach(date => {
//       const formattedDate = date.toISOString().split('T')[0];
//       headerRow += `<th>${formattedDate}</th>`;
//     });
//     headerRow += '</tr>';
//     header.innerHTML = headerRow;
//   }

//   // Build the table body (rooms and availability)
//   const tbody = document.getElementById('availability-body');
//   if (tbody) {
//     tbody.innerHTML = '';
//     roomTypes.forEach(room => {
//       let row = `<tr><td>${room.accomodation_type}</td>`;
//       dates.forEach(date => {
//         const dateStr = date.toISOString().split('T')[0];
//         const bookingDetail = bookingDetails.find(b => {
//           const checkinDate = new Date(b.checkin_time).toISOString().split('T')[0];
//           const checkoutDate = b.checkout_date;
//           return (
//             b.room_type_id === room.id &&
//             dateStr >= checkinDate &&
//             dateStr <= checkoutDate
//           );
//         });
//         if (bookingDetail) {
//           const tooltipContent = `Guest: ${bookingDetail.guest_name}<br>Email: ${bookingDetail.guest_email}<br>Check-in: ${new Date(bookingDetail.checkin_time).toISOString().split('T')[0]}<br>Check-out: ${bookingDetail.checkout_date}`;
//           row += `<td class="booked-cell">Booked<span class="tooltip-text">${tooltipContent}</span></td>`;
//         } else {
//           row += '<td class="empty-cell">Empty</td>';
//         }
//       });
//       row += '</tr>';
//       tbody.innerHTML += row;
//     });
//     if (!roomTypes.length) {
//       tbody.innerHTML = '<tr><td colspan="' + (dates.length + 1) + '">No rooms available</td></tr>';
//     }
//   }
// }

async function loadRoomAvailability() {
    // Get current date
    const now = new Date();
    
    // Calculate first day of current week (Monday)
    const firstDayInWeek = new Date(now);
    const dayOfWeek = firstDayInWeek.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
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
    const { data: roomTypes, error: roomError } = await supabase
      .from('bnb_room_type')
      .select('id, accomodation_type');
  
    if (roomError) {
      console.error('Room types fetch error:', roomError);
      alert('Failed to load room types: ' + roomError.message);
      return;
    }
  
    const roomTypeMap = Object.fromEntries(roomTypes.map(t => [t.id, t.accomodation_type || `Unknown (ID: ${t.id})`]));
    const roomTypeIds = roomTypes.map(t => t.id);
  
    // Fetch check-ins (no date filter here, we'll filter in logic)
    const { data: checkins, error: checkinError } = await supabase
      .from('checkins')
      .select('booking_id, guest_name, checkin_date, checkout_date, guest_email, guest_phone');
  
    if (checkinError) {
      console.error('Check-ins fetch error:', checkinError);
      alert('Failed to load check-ins: ' + checkinError.message);
      return;
    }
  
    console.log('Check-ins for availability:', checkins);
  
    // Fetch booking details from archive_checkin using booking_id
    const bookingDetails = [];
    for (const checkin of checkins) {
      const { data: archivedBooking, error: bookingError } = await supabase
        .from('archive_checkin')
        .select('room_type_id')
        .eq('booking_id', checkin.booking_id)
        .single();
  
      if (bookingError) {
        console.error(`Error fetching archived booking for booking_id ${checkin.booking_id}:`, bookingError);
        continue; // Skip this check-in if booking fetch fails
      }
  
      // Only include check-ins that overlap with the date range
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
        headerRow += `<th>${formattedDate}</th>`;
      });
      headerRow += '</tr>';
      header.innerHTML = headerRow;
    }
  
    // Build the table body (rooms and availability)
    const tbody = document.getElementById('availability-body');
    if (tbody) {
      tbody.innerHTML = '';
      roomTypes.forEach(room => {
        let row = `<tr><td>${room.accomodation_type}</td>`;
        dates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          const bookingDetail = bookingDetails.find(b => {
            const checkinDate = new Date(b.checkin_date).toISOString().split('T')[0];
            const checkoutDate = new Date(b.checkout_date).toISOString().split('T')[0];
            return (
              b.room_type_id === room.id &&
              dateStr >= checkinDate &&
              dateStr <= checkoutDate
            );
          });
          if (bookingDetail) {
            const tooltipContent = `Guest: ${bookingDetail.guest_name}<br>Email: ${bookingDetail.guest_email}<br>Phone: ${bookingDetail.guest_phone || 'N/A'}<br>Check-in: ${new Date(bookingDetail.checkin_date).toISOString().split('T')[0]}<br>Check-out: ${bookingDetail.checkout_date}`;
            row += `<td class="booked-cell">Booked<span class="tooltip-text">${tooltipContent}</span></td>`;
          } else {
            row += '<td class="empty-cell">Empty</td>';
          }
        });
        row += '</tr>';
        tbody.innerHTML += row;
      });
      if (!roomTypes.length) {
        tbody.innerHTML = '<tr><td colspan="' + (dates.length + 1) + '">No rooms available</td></tr>';
      }
    }
  }

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

// Load Check-in History
async function loadCheckinHistory(bookingId) {
  let query = supabase
    .from('checkins')
    .select('*')
    .order('created_at', { ascending: false });

  // If bookingId is provided, filter by it; otherwise, fetch all check-ins
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
      </tr>
    `).join('') || '<tr><td colspan="9">No check-in history</td></tr>';
  }
}

// Handle Check-in Form Submission
// async function handleCheckinSubmit() {
//   const bookingIdSelect = document.getElementById('booking-id');
//   const selectedOption = bookingIdSelect.value;
//   if (!selectedOption) {
//     alert('Please select a Booking ID.');
//     return;
//   }

//   const { id: bookingId } = JSON.parse(selectedOption);
//   const guestName = document.getElementById('guest-name').value.trim();
//   const idNumber = document.getElementById('id-number').value.trim();
//   const emergencyContact = document.getElementById('emergency-contact').value.trim();
//   const checkinTime = document.getElementById('checkin-time').value;
//   const keyHandedOver = document.getElementById('key-handed-over').checked;
//   const rulesAcknowledged = document.getElementById('rules-acknowledged').checked;
//   const paymentConfirmed = document.getElementById('payment-confirmed').checked;
//   const roomInspected = document.getElementById('room-inspected').checked;
//   const notes = document.getElementById('notes').value.trim();

//   // Validate required fields
//   if (!bookingId || !guestName || !checkinTime) {
//     alert('Please fill in all required fields (Booking ID, Guest Name, Check-in Time).');
//     return;
//   }

//   // Submit check-in
//   const { data, error } = await supabase
//     .from('checkins')
//     .insert({
//       booking_id: bookingId,
//       guest_name: guestName,
//       id_number: idNumber || null,
//       emergency_contact: emergencyContact || null,
//       checkin_time: checkinTime,
//       key_handed_over: keyHandedOver,
//       rules_acknowledged: rulesAcknowledged,
//       payment_confirmed: paymentConfirmed,
//       room_inspected: roomInspected,
//       notes: notes || null
//     })
//     .select()
//     .single();

//   if (error) {
//     console.error('Check-in submission error:', error);
//     alert('Failed to submit check-in: ' + error.message);
//     return;
//   }

//   // Show success alert
//   const alert = document.getElementById('checkin-alert');
//   if (alert) {
//     alert.textContent = `Check-in successful for ${guestName} (Booking ID: ${bookingId})`;
//     alert.classList.remove('d-none');
//     setTimeout(() => alert.classList.add('d-none'), 3000);
//   }

//   // Enable undo button
//   lastCheckinId = data.id;
//   const undoBtn = document.getElementById('undo-checkin');
//   if (undoBtn) {
//     undoBtn.classList.remove('d-none');
//     undoBtn.onclick = handleUndoCheckin;
//   }

//   // Reset form
//   bookingIdSelect.value = '';
//   document.getElementById('guest-name').value = '';
//   document.getElementById('id-number').value = '';
//   document.getElementById('emergency-contact').value = '';
//   document.getElementById('checkin-time').value = new Date().toISOString().slice(0, 16);
//   document.getElementById('key-handed-over').checked = false;
//   document.getElementById('rules-acknowledged').checked = false;
//   document.getElementById('payment-confirmed').checked = false;
//   document.getElementById('room-inspected').checked = false;
//   document.getElementById('notes').value = '';

//   // Reload history for all check-ins
//   await loadCheckinHistory(null);

//   // Reload room availability
//   await loadRoomAvailability();
// }

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