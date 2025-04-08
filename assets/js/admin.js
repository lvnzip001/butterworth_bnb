import supabase from './supabase-client.js';

let calendar;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, initializing calendar');
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
    console.error('Calendar element not found in DOM');
    return;
  }

  // Apply inline style to make calendar wider
  calendarEl.style.width = '90%'; // Adjust this value as needed (e.g., '1000px')
  calendarEl.style.maxWidth = '1200px'; // Optional cap for very wide screens
  calendarEl.style.margin = '0 auto'; // Center it

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: [],
    eventDisplay: 'block', // Solid blocks for events
    displayEventTime: false, // Hide time since bookings are day-based
    dayMaxEvents: 3, // Limit events per day, show "+X more" if exceeded
    editable: true, // Allow dragging (won’t persist without backend update)
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay' // Added Day view
    },
    height: 'auto', // Responsive height
    dayHeaders: true, // Explicitly show day headers
    weekends: true, // Show weekends
    eventClick: (info) => {
      console.log('Event clicked:', info.event);
      alert(`Booking: ${info.event.title}\nFrom: ${info.event.startStr}\nTo: ${info.event.endStr || info.event.startStr}`);
    }
  });
  console.log('Rendering calendar with enhanced options');
  calendar.render();
  console.log('Calling loadDashboard');
  loadDashboard();
});

async function loadDashboard() {
  console.log('loadDashboard started');
  const bookingsTbody = document.getElementById('bookings-body');
  const accomTbody = document.getElementById('accommodation-body');
  if (!bookingsTbody || !accomTbody) {
    console.error('Table bodies not found: bookingsTbody=', bookingsTbody, 'accomTbody=', accomTbody);
    return;
  }
  bookingsTbody.innerHTML = '<tr><td colspan="11">Loading...</td></tr>';
  accomTbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

  try {
    console.log('Fetching bookings from Supabase');
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        bnb_id,
        room_type_id,
        guest_name,
        guest_email,
        guest_phone,
        checkin_date,
        checkout_date,
        total_cost,
        status,
        created_at,
        bnb_room_type (accomodation_type, bnb_id)
      `)
      .order('checkin_date', { ascending: true });

    console.log('Fetch result: error=', error, 'bookings=', bookings);
    if (error) {
      console.error('Fetch bookings failed:', error);
      throw new Error(`Fetch error: ${error.message}`);
    }

    if (!bookings || bookings.length === 0) {
      console.log('No bookings returned');
      bookingsTbody.innerHTML = '<tr><td colspan="11">No bookings found</td></tr>';
      accomTbody.innerHTML = '<tr><td colspan="3">No bookings found</td></tr>';
      return;
    }

    console.log('Processing bookings, count:', bookings.length);
    bookingsTbody.innerHTML = bookings.map(booking => {
      console.log('Mapping booking:', booking.id, 'status:', booking.status);
      const createdAt = new Date(booking.created_at);
      const date = createdAt.toISOString().split('T')[0];
      const time = createdAt.toTimeString().split(' ')[0].slice(0, 5);
      const selectBgColor = booking.status === 'pending' ? 'orange' : '#005e5e';
      return `
        <tr>
          <td>${booking.guest_name || 'N/A'}</td>
          <td>${booking.guest_email || 'N/A'}</td>
          <td>${booking.guest_phone || 'N/A'}</td>
          <td>${booking.checkin_date}</td>
          <td>${booking.checkout_date}</td>
          <td>${booking.bnb_room_type?.accomodation_type || 'N/A'}</td>
          <td>R${Number(booking.total_cost || 0).toFixed(2)}</td>
          <td>
            <select onchange="updateStatus('${booking.id}', this.value)" style="background-color: ${selectBgColor};">
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

    console.log('Updating calendar events');
    calendar.removeAllEvents();
    calendar.addEventSource(bookings.map(booking => {
      console.log('Adding event for booking:', booking.id, 'status:', booking.status);
      const eventColor = booking.status === 'pending' ? 'orange' : '#005e5e';
      return {
        title: `${booking.bnb_room_type?.accomodation_type || 'Unknown'} - ${booking.guest_name || 'Unknown'}`,
        start: booking.checkin_date,
        end: booking.checkout_date,
        backgroundColor: eventColor,
        borderColor: eventColor
      };
    }));

    const monthlyRevenue = bookings
      .filter(b => b.status === 'complete')
      .reduce((sum, b) => sum + Number(b.total_cost || 0), 0);
    console.log('Calculated monthly revenue:', monthlyRevenue);
    document.getElementById('monthly-revenue').textContent = `R${monthlyRevenue.toFixed(2)}`;

    let totalDaysBooked = 0;
    bookings.filter(b => b.status === 'complete').forEach(b => {
      const start = new Date(b.checkin_date);
      const end = new Date(b.checkout_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      totalDaysBooked += days > 0 ? days : 0;
    });
    console.log('Total days booked:', totalDaysBooked);
    document.getElementById('days-booked').textContent = totalDaysBooked;

    const accomStats = {};
    bookings.filter(b => b.status === 'complete').forEach(b => {
      const checkin = new Date(b.checkin_date);
      const monthKey = `${checkin.getFullYear()}-${String(checkin.getMonth() + 1).padStart(2, '0')}`;
      const type = b.bnb_room_type?.accomodation_type || 'Unknown';
      if (!accomStats[monthKey]) accomStats[monthKey] = {};
      accomStats[monthKey][type] = (accomStats[monthKey][type] || 0) + Number(b.total_cost || 0);
    });
    console.log('Accommodation stats:', accomStats);

    accomTbody.innerHTML = Object.entries(accomStats).flatMap(([month, types]) =>
      Object.entries(types).map(([type, revenue]) => `
        <tr>
          <td>${month}</td>
          <td>${type}</td>
          <td>R${revenue.toFixed(2)}</td>
        </tr>
      `)
    ).join('') || '<tr><td colspan="3">No completed bookings</td></tr>';

  } catch (error) {
    console.error('loadDashboard failed:', error);
    bookingsTbody.innerHTML = `<tr><td colspan="11">Error: ${error.message}</td></tr>`;
    accomTbody.innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
  }
}

async function adjustAvailability(booking, increase = false) {
  console.log('adjustAvailability started for booking:', booking.id, 'increase:', increase);
  console.log('Booking details:', booking);
  const startDate = new Date(booking.checkin_date);
  const endDate = new Date(booking.checkout_date);
  const datesToUpdate = [];
  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    datesToUpdate.push(d.toISOString().split('T')[0]);
  }
  console.log('Dates to adjust:', datesToUpdate);

  const effectiveBnbId = booking.bnb_id || booking.bnb_room_type?.bnb_id;
  if (!effectiveBnbId || !booking.room_type_id) {
    console.error('Missing critical IDs: bnb_id=', effectiveBnbId, 'room_type_id=', booking.room_type_id);
    throw new Error('Missing bnb_id or room_type_id');
  }
  console.log('Using effectiveBnbId:', effectiveBnbId, 'room_type_id:', booking.room_type_id);

  for (const date of datesToUpdate) {
    console.log('Processing availability for date:', date);
    const { data: availability, error: availError } = await supabase
      .from('availability')
      .select('available_quantity')
      .eq('bnb_id', effectiveBnbId)
      .eq('room_type_id', booking.room_type_id)
      .eq('date', date)
      .maybeSingle();

    console.log('Availability fetch result for', date, ': data=', availability, 'error=', availError);
    if (availError && availError.code !== 'PGRST116') {
      console.error('Availability fetch error:', availError);
      throw new Error(`Availability fetch failed: ${availError.message}`);
    }

    if (availability) {
      const currentQuantity = availability.available_quantity;
      console.log('Current quantity for', date, ':', currentQuantity);
      const newQuantity = increase ? currentQuantity + 1 : currentQuantity - 1;
      console.log('New quantity calculated:', newQuantity);
      if (newQuantity >= 0) {
        const { error: updateError } = await supabase
          .from('availability')
          .update({ available_quantity: newQuantity })
          .eq('bnb_id', effectiveBnbId)
          .eq('room_type_id', booking.room_type_id)
          .eq('date', date);

        console.log('Update result for', date, ': error=', updateError);
        if (updateError) {
          console.error('Update failed:', updateError);
          throw new Error(`Update failed: ${updateError.message}`);
        }
      } else {
        console.warn('Cannot reduce below 0 for', date, 'current:', currentQuantity);
      }
    } else if (increase) {
      console.log('No record found, inserting for', date);
      const { error: insertError } = await supabase
        .from('availability')
        .insert({
          bnb_id: effectiveBnbId,
          room_type_id: booking.room_type_id,
          date: date,
          available_quantity: 1
        });

        console.log('Insert result for', date, ': error=', insertError);
        if (insertError) {
          console.error('Insert failed:', insertError);
          throw new Error(`Insert failed: ${insertError.message}`);
        }
      } else {
        console.warn('No availability record to decrease for', date);
      }
    }
  }

window.updateStatus = async (bookingId, newStatus) => {
  console.log('updateStatus called: bookingId=', bookingId, 'newStatus=', newStatus);
  try {
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, bnb_id, room_type_id, checkin_date, checkout_date, bnb_room_type (bnb_id)')
      .eq('id', bookingId)
      .single();

    console.log('Booking fetch result: booking=', booking, 'error=', fetchError);
    if (fetchError) {
      console.error('Fetch booking failed:', fetchError);
      throw new Error(`Fetch error: ${fetchError.message}`);
    }
    if (!booking) {
      console.error('No booking found for ID:', bookingId);
      throw new Error('Booking not found');
    }

    const oldStatus = booking.status;
    console.log('Old status:', oldStatus, 'New status:', newStatus);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    console.log('Status update result: error=', updateError);
    if (updateError) {
      console.error('Update status failed:', updateError);
      throw new Error(`Update error: ${updateError.message}`);
    }

    if (oldStatus === 'pending' && newStatus === 'complete') {
      console.log('Status changed to complete, decreasing availability');
      await adjustAvailability(booking, false);
    } else if (oldStatus === 'complete' && newStatus === 'pending') {
      console.log('Status changed to pending, increasing availability');
      await adjustAvailability(booking, true);
    } else {
      console.log('No availability adjustment needed');
    }

    console.log('Reloading dashboard after status update');
    loadDashboard();
  } catch (error) {
    console.error('updateStatus failed:', error);
    alert(`Error updating status: ${error.message}`);
    loadDashboard();
  }
};

window.deleteBooking = async (bookingId) => {
  console.log('deleteBooking called: bookingId=', bookingId);
  if (!confirm('Are you sure you want to delete this booking?')) {
    console.log('Deletion cancelled by user');
    return;
  }

  try {
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, bnb_id, room_type_id, checkin_date, checkout_date, bnb_room_type (bnb_id)')
      .eq('id', bookingId)
      .single();

    console.log('Booking fetch result for deletion: booking=', booking, 'error=', fetchError);
    if (fetchError) {
      console.error('Fetch booking failed:', fetchError);
      throw new Error(`Fetch error: ${fetchError.message}`);
    }
    if (!booking) {
      console.error('No booking found for ID:', bookingId);
      throw new Error('Booking not found');
    }

    if (booking.status === 'complete') {
      console.log('Booking is complete, increasing availability before delete');
      await adjustAvailability(booking, true);
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    console.log('Delete result: error=', error);
    if (error) {
      console.error('Delete failed:', error);
      throw new Error(`Delete error: ${error.message}`);
    }

    console.log('Booking deleted successfully, reloading dashboard');
    loadDashboard();
  } catch (error) {
    console.error('deleteBooking failed:', error);
    alert(`Error deleting booking: ${error.message}`);
  }
};

window.logout = () => {
  console.log('Logging out, removing adminToken');
  localStorage.removeItem('adminToken');
  window.location.href = '/login.html';
};