import supabase from './supabase-client.js';

// Check if logged in (commented out as requested)
// const token = localStorage.getItem('adminToken');
// if (!token) {
//   window.location.href = '/login.html';
// }

let calendar;

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: []
  });
  calendar.render();
  loadBookings();
});

async function loadBookings() {
  const tbody = document.getElementById('bookings-body');
  tbody.innerHTML = '<tr><td colspan="9">Loading...</td></tr>';

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        bnb_room_type (accomodation_type)
      `)
      .order('checkin_date', { ascending: true });

    if (error) throw error;

    tbody.innerHTML = data.map(booking => `
      <tr>
        <td>${booking.guest_name}</td>
        <td>${booking.guest_email}</td>
        <td>${booking.checkin_date}</td>
        <animal>${booking.checkout_date}</td>
        <td>${booking.bnb_room_type.accomodation_type}</td>
        <td>$${booking.total_cost}</td>
        <td>
          <select onchange="updateStatus('${booking.id}', this.value)">
            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="complete" ${booking.status === 'complete' ? 'selected' : ''}>Complete</option>
          </select>
        </td>
        <td>${booking.created_at}</td>
        <td><button onclick="deleteBooking('${booking.id}')">Delete</button></td>
      </tr>
    `).join('');

    // Update calendar events
    calendar.removeAllEvents();
    calendar.addEventSource(data.map(booking => ({
      title: `${booking.bnb_room_type.accomodation_type} - ${booking.guest_name}`,
      start: booking.checkin_date,
      end: booking.checkout_date,
      backgroundColor: '#005e5e',
      borderColor: '#005e5e'
    })));
  } catch (error) {
    console.error('Error loading bookings:', error);
    tbody.innerHTML = `<tr><td colspan="9">Error: ${error.message}</td></tr>`;
  }
}

window.updateStatus = async (bookingId, newStatus) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) throw error;
    console.log(`Updated status for booking ${bookingId} to ${newStatus}`);
  } catch (error) {
    console.error('Error updating status:', error);
    alert(`Error: ${error.message}`);
    loadBookings(); // Reload to revert UI on error
  }
};

window.deleteBooking = async (bookingId) => {
  if (!confirm('Are you sure you want to delete this booking?')) return;

  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) throw error;
    loadBookings(); // Refresh table and calendar
  } catch (error) {
    console.error('Error deleting booking:', error);
    alert(`Error: ${error.message}`);
  }
};

window.logout = () => {
  localStorage.removeItem('adminToken');
  window.location.href = '/login.html';
};