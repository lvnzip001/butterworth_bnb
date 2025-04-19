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
async function loadRoomAvailability() {
  const today = new Date('2025-04-19'); // Current date (April 19, 2025)
  // Calculate the start date based on the current week offset
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + currentWeekOffset * DAYS_PER_WEEK);
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

  // Fetch check-ins for the date range
  const startDateStr = dates[0].toISOString().split('T')[0];
  const endDateStr = dates[dates.length - 1].toISOString().split('T')[0];
  const { data: checkins, error: checkinError } = await supabase
    .from('checkins')
    .select('booking_id, guest_name, checkin_time')
    .gte('checkin_time', startDateStr + 'T00:00:00Z')
    .lte('checkin_time', endDateStr + 'T23:59:59Z');

  if (checkinError) {
    console.error('Check-ins fetch error:', checkinError);
    alert('Failed to load check-ins: ' + checkinError.message);
    return;
  }

  console.log('Check-ins for availability:', checkins);

  // Fetch booking details for each check-in using booking_id
  const bookingDetails = [];
  for (const checkin of checkins) {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('room_type_id, checkout_date, guest_email')
      .eq('booking_id', checkin.booking_id)
      .single();

    if (bookingError) {
      console.error(`Error fetching booking for booking_id ${checkin.booking_id}:`, bookingError);
      continue; // Skip this check-in if booking fetch fails
    }

    bookingDetails.push({
      ...checkin,
      room_type_id: booking.room_type_id,
      checkout_date: booking.checkout_date,
      guest_email: booking.guest_email
    });
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
          const checkinDate = new Date(b.checkin_time).toISOString().split('T')[0];
          const checkoutDate = b.checkout_date;
          return (
            b.room_type_id === room.id &&
            dateStr >= checkinDate &&
            dateStr <= checkoutDate
          );
        });
        if (bookingDetail) {
          const tooltipContent = `Guest: ${bookingDetail.guest_name}<br>Email: ${bookingDetail.guest_email}<br>Check-in: ${new Date(bookingDetail.checkin_time).toISOString().split('T')[0]}<br>Check-out: ${bookingDetail.checkout_date}`;
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
async function handleCheckinSubmit() {
  const bookingIdSelect = document.getElementById('booking-id');
  const selectedOption = bookingIdSelect.value;
  if (!selectedOption) {
    alert('Please select a Booking ID.');
    return;
  }

  const { id: bookingId } = JSON.parse(selectedOption);
  const guestName = document.getElementById('guest-name').value.trim();
  const idNumber = document.getElementById('id-number').value.trim();
  const emergencyContact = document.getElementById('emergency-contact').value.trim();
  const checkinTime = document.getElementById('checkin-time').value;
  const keyHandedOver = document.getElementById('key-handed-over').checked;
  const rulesAcknowledged = document.getElementById('rules-acknowledged').checked;
  const paymentConfirmed = document.getElementById('payment-confirmed').checked;
  const roomInspected = document.getElementById('room-inspected').checked;
  const notes = document.getElementById('notes').value.trim();

  // Validate required fields
  if (!bookingId || !guestName || !checkinTime) {
    alert('Please fill in all required fields (Booking ID, Guest Name, Check-in Time).');
    return;
  }

  // Submit check-in
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      booking_id: bookingId,
      guest_name: guestName,
      id_number: idNumber || null,
      emergency_contact: emergencyContact || null,
      checkin_time: checkinTime,
      key_handed_over: keyHandedOver,
      rules_acknowledged: rulesAcknowledged,
      payment_confirmed: paymentConfirmed,
      room_inspected: roomInspected,
      notes: notes || null
    })
    .select()
    .single();

  if (error) {
    console.error('Check-in submission error:', error);
    alert('Failed to submit check-in: ' + error.message);
    return;
  }

  // Show success alert
  const alert = document.getElementById('checkin-alert');
  if (alert) {
    alert.textContent = `Check-in successful for ${guestName} (Booking ID: ${bookingId})`;
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), 3000);
  }

  // Enable undo button
  lastCheckinId = data.id;
  const undoBtn = document.getElementById('undo-checkin');
  if (undoBtn) {
    undoBtn.classList.remove('d-none');
    undoBtn.onclick = handleUndoCheckin;
  }

  // Reset form
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

  // Reload history for all check-ins
  await loadCheckinHistory(null);

  // Reload room availability
  await loadRoomAvailability();
}

// Undo Last Check-in
async function handleUndoCheckin() {
  if (!lastCheckinId) {
    alert('No check-in to undo.');
    return;
  }

  const { error } = await supabase
    .from('checkins')
    .delete()
    .eq('id', lastCheckinId);

  if (error) {
    console.error('Undo check-in error:', error);
    alert('Failed to undo check-in: ' + error.message);
    return;
  }

  // Show success alert
  const alert = document.getElementById('checkin-alert');
  if (alert) {
    alert.textContent = 'Check-in undone successfully.';
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), 3000);
  }

  // Disable undo button
  lastCheckinId = null;
  const undoBtn = document.getElementById('undo-checkin');
  if (undoBtn) {
    undoBtn.classList.add('d-none');
  }

  // Reload history for all check-ins
  await loadCheckinHistory(null);

  // Reload room availability
  await loadRoomAvailability();
}