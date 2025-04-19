import supabase from './supabase-client.js';
import { adjustAvailability, getRoomTypes } from './utils.js';

let calendar;
let roomTypeOptions = [];

// Initialize bookings and calendar
export async function initBookings() {
  initCalendar();
  roomTypeOptions = await getRoomTypes();
  await loadDashboard();
}

// FullCalendar setup
function initCalendar() {
  const el = document.getElementById('calendar');
  if (!el) return;
  el.style.width = '90%';
  el.style.maxWidth = '1200px';
  el.style.margin = '0 auto';
  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    displayEventTime: false,
    editable: true,
    eventClick: info => alert(`Booking: ${info.event.title}\nFrom: ${info.event.startStr}\nTo: ${info.event.endStr || info.event.startStr}`)
  });
  calendar.render();
}

// Load live bookings and render all
async function loadDashboard() {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_email, guest_phone, room_type_id, checkin_date, checkout_date, total_cost, status, created_at,booking_id, bnb_room_type(accomodation_type)')
    .order('checkin_date', { ascending: true });
  if (error) {
    console.error('Bookings error:', error);
    alert('Failed to load bookings');
    return;
  }
  renderBookingsTable(bookings);
  renderCalendarEvents(bookings);
}

// Render bookings table with editable status & room
function renderBookingsTable(bookings) {
  const tbody = document.getElementById('bookings-body');
  if (tbody) {
    tbody.innerHTML = bookings.map(b => {
      const created = new Date(b.created_at);
      const date = created.toISOString().split('T')[0];
      const time = created.toTimeString().slice(0, 5);
      const color = b.status === 'pending' ? 'orange' : '#005e5e';
      const roomOpts = roomTypeOptions.map(r =>
        `<option value="${r.id}" ${r.id === b.room_type_id ? 'selected' : ''}>${r.accomodation_type}</option>`
      ).join('');
      return `
        <tr>
          <td>${b.booking_id}</td>
          <td>${b.guest_name}</td>
          <td>${b.guest_email}</td>
          <td>${b.guest_phone || ''}</td>
          <td>${b.checkin_date}</td>
          <td>${b.checkout_date}</td>
          <td><select class="form-select form-select-sm edit-booking-room" data-id="${b.id}">${roomOpts}</select></td>
          <td>R${Number(b.total_cost || 0).toFixed(2)}</td>
          <td><select class="form-select form-select-sm edit-booking-status" data-id="${b.id}" style="background-color:${color}">
               <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
               <option value="complete" ${b.status === 'complete' ? 'selected' : ''}>Complete</option>
             </select></td>
          <td>${date}</td>
          <td>${time}</td>
          <td><button class="btn btn-sm btn-danger btn-delete-booking" data-id="${b.id}">Delete</button></td>
        </tr>`;
    }).join('');
    document.querySelectorAll('.edit-booking-status').forEach(el =>
      el.addEventListener('change', e => updateStatus(e.target.dataset.id, e.target.value))
    );
    document.querySelectorAll('.edit-booking-room').forEach(el =>
      el.addEventListener('change', e => updateBookingRoom(e.target.dataset.id, e.target.value))
    );
    document.querySelectorAll('.btn-delete-booking').forEach(btn =>
      btn.addEventListener('click', () => deleteBooking(btn.dataset.id))
    );
  }
}

// Calendar events
function renderCalendarEvents(bookings) {
  if (!calendar) return;
  calendar.removeAllEvents();
  bookings.forEach(b => {
    const title = `${b.bnb_room_type?.accomodation_type || ''} - ${b.guest_name}`;
    const color = b.status === 'pending' ? 'orange' : '#005e5e';
    calendar.addEvent({ title, start: b.checkin_date, end: b.checkout_date, backgroundColor: color, borderColor: color });
  });
}

// Update status with availability handling
async function updateStatus(id, newStatus) {
  try {
    const { data: b, error: fetchError } = await supabase
      .from('bookings')
      .select('status, checkin_date, checkout_date, bnb_id, room_type_id')
      .eq('id', id)
      .single();
    if (fetchError) throw new Error('Fetch booking error: ' + fetchError.message);
    if (!b) throw new Error('Booking not found');

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);
    if (updateError) throw new Error('Update status error: ' + updateError.message);

    if (b.status === 'pending' && newStatus === 'complete') {
      await adjustAvailability(b, -1);
    } else if (b.status === 'complete' && newStatus === 'pending') {
      await adjustAvailability(b, 1);
    }

    await loadDashboard();
  } catch (error) {
    console.error('Error updating status:', error.message);
    alert('Failed to update booking status: ' + error.message);
  }
}

// Update room type
async function updateBookingRoom(id, newRoom) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ room_type_id: newRoom })
      .eq('id', id);
    if (error) throw new Error('Update room error: ' + error.message);
    await loadDashboard();
  } catch (error) {
    console.error('Error updating room:', error.message);
    alert('Failed to update booking room: ' + error.message);
  }
}

// Delete booking
async function deleteBooking(id) {
  if (!confirm('Delete booking?')) return;
  try {
    const { data: b, error: fetchError } = await supabase
      .from('bookings')
      .select('status, checkin_date, checkout_date, bnb_id, room_type_id')
      .eq('id', id)
      .single();
    if (fetchError) throw new Error('Fetch booking error: ' + fetchError.message);
    if (b.status === 'complete') await adjustAvailability(b, 1);
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    if (deleteError) throw new Error('Delete error: ' + deleteError.message);
    await loadDashboard();
  } catch (error) {
    console.error('Error deleting booking:', error.message);
    alert('Failed to delete booking: ' + error.message);
  }
}