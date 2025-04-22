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
  
  // Container styling (better to use CSS classes)
  el.style.width = '90%';
  el.style.maxWidth = '1200px';
  el.style.margin = '0 auto';
  el.style.borderRadius = '12px';
  el.style.overflow = 'hidden';
  el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';

  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    headerToolbar: { 
      left: 'prev,next today', 
      center: 'title', 
      right: 'dayGridMonth,timeGridWeek,timeGridDay' 
    },
    views: {
      dayGridMonth: {
        titleFormat: { year: 'numeric', month: 'long' }
      },
      timeGridWeek: {
        titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
      }
    },
    displayEventTime: false,
    editable: true,
    selectable: true,
    dayMaxEvents: true,
    eventDisplay: 'block',
    eventColor: '#005e5e',
    eventTextColor: '#ffffff',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: 'short'
    },
    eventClick: function(info) {
      const event = info.event;
      const startDate = new Date(event.start).toLocaleDateString();
      const endDate = event.end ? new Date(event.end).toLocaleDateString() : startDate;
      
      // Create a custom modal instead of alert
      showBookingDetails({
        title: event.title,
        guestName: event.extendedProps.guestName,
        guestEmail: event.extendedProps.guestEmail,
        guestPhone: event.extendedProps.guestPhone,
        bookingId: event.extendedProps.bookingId,
        dates: `${startDate} - ${endDate}`,
        status: event.extendedProps.status,
        totalCost: event.extendedProps.totalCost,
        roomType: event.extendedProps.roomType
      });
    },
    eventDidMount: function(info) {
      const status = info.event.extendedProps.status;
      const dotEl = document.createElement('div');
      dotEl.className = 'bnb-calendar-event-status';
      
        // Custom status text mapping
      const statusTextMap = {
          'pending': 'Pending Payment',
          'complete': 'Payment Received',
          'cancelled': 'Booking Cancelled',
        };
        
        // Default to status value if not in map
      const displayText = statusTextMap[status] || status;

      // Set color based on status
      if (status === 'pending') {
        dotEl.style.backgroundColor = 'orange';
        info.el.style.backgroundColor = 'rgba(255, 166, 0, 0.6)'; // Light orange background
        info.el.style.borderColor = 'orange';
      } else {
        dotEl.style.backgroundColor = '#005e5e';
        info.el.style.backgroundColor = 'rgba(0, 94, 94, 0.6)'; // Light teal background
        info.el.style.borderColor = '#005e5e';
      }
      
      // Add status text if you want
      const statusText = document.createElement('div');
      statusText.className = 'bnb-calendar-event-status-text';
      statusText.textContent = displayText;
      statusText.style.color = status === 'pending' ? 'orange' : '#005e5e';
      
      info.el.appendChild(dotEl);
      info.el.appendChild(statusText);
    }
  });
  
  calendar.render();
  console.log('Calendar initialized:', calendar);
}

// Calendar events
function renderCalendarEvents(bookings) {
  if (!calendar) return;
  calendar.removeAllEvents();
  bookings.forEach(b => {
    const title = `${b.bnb_room_type?.accomodation_type || ''} : ${b.guest_name}`;
    const color = b.status === 'pending' ? 'orange' : '#005e5e';
    
    calendar.addEvent({
      title,
      start: b.checkin_date,
      end: b.checkout_date,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { // This is where you store additional data
        guestName: b.guest_name,
        guestEmail: b.guest_email,
        guestPhone: b.guest_phone,
        bookingId: b.booking_id,
        roomType: b.bnb_room_type?.accomodation_type,
        totalCost: b.total_cost,
        status: b.status
      }
    });
  });
}

function showBookingDetails(details) {
  // Remove existing modal if any
  const existingModal = document.querySelector('.bnb-booking-modal');
  if (existingModal) existingModal.remove();
  
    // Custom status text mapping
  const statusTextMap = {
    'pending': 'Pending Payment',
    'complete': 'Payment Received',
    'cancelled': 'Booking Cancelled',
  };
    
    // Default to status value if not in map
  const displayText = statusTextMap[details.status] || details.status;

  // Create modal HTML with new class names
  const modalHTML = `
    <div class="bnb-booking-modal">
      <div class="bnb-booking-modal__content">
        <span class="bnb-booking-modal__close">&times;</span>
        <h4>Booking Details</h4>
        <div class="bnb-booking-modal__grid">
          <div class="bnb-booking-modal__row">
            <span class="bnb-booking-modal__label">Booking ID:</span>
            <span class="bnb-booking-modal__value">${details.bookingId}</span>
          </div>
          <div class="bnb-booking-modal__row">
            <span class="bnb-booking-modal__label">Guest:</span>
            <span class="bnb-booking-modal__value">${details.guestName}</span>
          </div>
          <div class="bnb-booking-modal__row">
            <span class="bnb-booking-modal__label">Email:</span>
            <span class="bnb-booking-modal__value">${details.guestEmail}</span>
          </div>
          <div class="bnb-booking-modal__row">
            <span class="bnb-booking-modal__label">Phone:</span>
            <span class="bnb-booking-modal__value">${details.guestPhone || 'N/A'}</span>
          </div>
          <div class="bnb-booking-modal__row">
            <span class="bnb-booking-modal__label">Dates:</span>
            <span class="bnb-booking-modal__value">${details.dates}</span>
          </div>
          <div class="bnb-booking-modal__row">
            <span class="bnb-booking-modal__label">Room Type:</span>
            <span class="bnb-booking-modal__value">${details.roomType}</span>
          </div>
          <div class="bnb-booking-modal__row">
            <span class="bnb-booking-modal__label">Total Cost:</span>
            <span class="bnb-booking-modal__value">R${details.totalCost}</span>
          </div>
          <div class="bnb-booking-modal__row">
            <span class="bnb-booking-modal__label">Status:</span>
            <span class="bnb-booking-modal__value bnb-booking-modal__status--${details.status.toLowerCase()}">${displayText}</span>
          </div>
        </div>
        <div class="bnb-booking-modal__actions">
          <button class="bnb-booking-modal__btn--close">Close</button>
        </div>
      </div>
    </div>
  `;
  
  // Add to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners
  document.querySelector('.bnb-booking-modal__close').addEventListener('click', () => {
    document.querySelector('.bnb-booking-modal').remove();
  });
  
  document.querySelector('.bnb-booking-modal__btn--close').addEventListener('click', () => {
    document.querySelector('.bnb-booking-modal').remove();
  });
  
  document.querySelector('.bnb-booking-modal__btn--edit').addEventListener('click', () => {
    // Implement edit functionality
    console.log('Edit booking:', details.bookingId);
  });
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
      const text_color = b.status === 'pending' ? 'white' : 'White';
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
          <td><select class="form-select form-select-sm edit-booking-status" data-id="${b.id}" style="background-color:${color}; color:${text_color}">
               <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
               <option value="complete" ${b.status === 'complete' ? 'selected' : ''}>Complete</option>
             </select></td>
          <td>${date}</td>
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