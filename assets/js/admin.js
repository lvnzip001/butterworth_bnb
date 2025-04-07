import supabase from './supabase-client.js';

let calendar;

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: [],
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    }
  });
  calendar.render();
  loadDashboard();
});

async function loadDashboard() {
  const bookingsTbody = document.getElementById('bookings-body');
  const accomTbody = document.getElementById('accommodation-body');
  bookingsTbody.innerHTML = '<tr><td colspan="11">Loading...</td></tr>';
  accomTbody.innerHTML = '<tr><td colspan="2">Loading...</td></tr>';

  try {
    // Fetch bookings with accommodation type
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        guest_email,
        guest_phone,
        checkin_date,
        checkout_date,
        total_cost,
        status,
        created_at,
        bnb_room_type (accomodation_type)
      `)
      .order('checkin_date', { ascending: true });

    if (error) throw error;

    // Populate bookings table with guest_phone
    bookingsTbody.innerHTML = bookings.map(booking => {
      const createdAt = new Date(booking.created_at);
      const date = createdAt.toISOString().split('T')[0];
      const time = createdAt.toTimeString().split(' ')[0].slice(0, 5);
      return `
        <tr>
          <td>${booking.guest_name}</td>
          <td>${booking.guest_email}</td>
          <td>${booking.guest_phone || 'N/A'}</td>
          <td>${booking.checkin_date}</td>
          <td>${booking.checkout_date}</td>
          <td>${booking.bnb_room_type.accomodation_type}</td>
          <td>R${Number(booking.total_cost).toFixed(2)}</td>
          <td>
            <select onchange="updateStatus('${booking.id}', this.value)">
              <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="complete" ${booking.status === 'complete' ? 'selected' : ''}>Complete</option>
            </select>
          </td>
          <td>${date}</td>
          <td>${time}</td>
          <td><button onclick="deleteBooking('${booking.id}')">Delete</button></td>
        </tr>
      `;
    }).join('');

    // Update calendar events
    calendar.removeAllEvents();
    calendar.addEventSource(bookings.map(booking => ({
      title: `${booking.bnb_room_type.accomodation_type} - ${booking.guest_name}`,
      start: booking.checkin_date,
      end: booking.checkout_date,
      backgroundColor: '#005e5e',
      borderColor: '#005e5e'
    })));

    // Determine current month (using April 2025 for testing)
    const now = new Date('2025-04-07'); // Replace with `new Date()` in production
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);

    // Filter bookings for the current month based on checkin_date
    const monthlyBookings = bookings.filter(b => {
      const checkin = new Date(b.checkin_date);
      return b.status === 'complete' && checkin >= monthStart && checkin < monthEnd;
    });

    // Calculate monthly revenue
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + Number(b.total_cost), 0);
    document.getElementById('monthly-revenue').textContent = `R${monthlyRevenue.toFixed(2)}`;

    // Calculate total days booked in the current month
    let totalDaysBooked = 0;
    monthlyBookings.forEach(b => {
      const start = new Date(b.checkin_date);
      const end = new Date(b.checkout_date);
      // Clip to month boundaries
      const clippedStart = start < monthStart ? monthStart : start;
      const clippedEnd = end > monthEnd ? monthEnd : end;
      const days = Math.ceil((clippedEnd - clippedStart) / (1000 * 60 * 60 * 24));
      totalDaysBooked += days > 0 ? days : 0;
    });
    document.getElementById('days-booked').textContent = totalDaysBooked;

    // Calculate revenue per accommodation type
    const accomRevenue = {};
    monthlyBookings.forEach(b => {
      const type = b.bnb_room_type.accomodation_type;
      const cost = Number(b.total_cost);
      accomRevenue[type] = (accomRevenue[type] || 0) + cost;
    });

    // Populate accommodation revenue table
    accomTbody.innerHTML = Object.entries(accomRevenue).map(([type, revenue]) => `
      <tr>
        <td>${type}</td>
        <td>R${revenue.toFixed(2)}</td>
      </tr>
    `).join('') || '<tr><td colspan="2">No bookings this month</td></tr>';

  } catch (error) {
    console.error('Error loading dashboard:', error);
    bookingsTbody.innerHTML = `<tr><td colspan="11">Error: ${error.message}</td></tr>`;
    accomTbody.innerHTML = `<tr><td colspan="2">Error: ${error.message}</td></tr>`;
  }
}

window.updateStatus = async (bookingId, newStatus) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) throw error;
    loadDashboard();
  } catch (error) {
    console.error('Error updating status:', error);
    alert(`Error: ${error.message}`);
    loadDashboard();
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
    loadDashboard();
  } catch (error) {
    console.error('Error deleting booking:', error);
    alert(`Error: ${error.message}`);
  }
};

window.logout = () => {
  localStorage.removeItem('adminToken');
  window.location.href = '/login.html';
};