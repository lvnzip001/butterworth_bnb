import supabase from './supabase-client.js';
import { adjustAvailability, getRoomTypes, getBnb, getBnbIdByName } from './utils.js';

let calendar;
let roomTypeOptions = [];

// Initialize bookings and calendar
export async function initBookings() {
  initCalendar();
  // Fetch bnb data to get the id for the specified B&B
  
  const bnbId = await getBnbIdByName();
  if (!bnbId) {
    roomTypeOptions = [];
    return;
  }

  console.log('Bnb ID for', bnbId);

  // Fetch room types filtered by bnb_id
  roomTypeOptions = await getRoomTypes(bnbId);
  await loadDashboard();
}

// FullCalendar setup
function initCalendar() {
  const el = document.getElementById('calendar');
  if (!el) return;
  
  // Container styling (better to use CSS classes)
  el.style.width = '100%';
  el.style.maxWidth = '1600px';
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

// Update status with availability handling and fraud detection
async function updateStatus(id, newStatus) {
  // Check if Bootstrap is available
  if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
    console.error('Bootstrap Modal is not available. Ensure bootstrap.bundle.min.js is loaded.');
    alert('Error: Modal functionality is not available. Please ensure Bootstrap is loaded correctly.');
    return;
  }

  // Fetch the current booking details to determine the status change
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('status, checkin_date, checkout_date, bnb_id, room_type_id, booking_id, guest_name')
    .eq('id', id)
    .single();
  if (fetchError) {
    console.error('Fetch booking error:', fetchError.message);
    alert('Failed to fetch booking details: ' + fetchError.message);
    return;
  }
  if (!booking) {
    console.error('Booking not found for id:', id);
    alert('Booking not found. Please refresh the page and try again.');
    return;
  }

  // Determine if we need to show a modal (only for pending <-> complete changes)
  const isPendingToComplete = booking.status === 'pending' && newStatus === 'complete';
  const isCompleteToPending = booking.status === 'complete' && newStatus === 'pending';

  if (!isPendingToComplete && !isCompleteToPending) {
    // No modal needed; proceed with the update
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);
      if (updateError) throw new Error('Update status error: ' + updateError.message);

      await loadDashboard();
    } catch (error) {
      console.error('Error updating status (no modal):', error.message);
      alert('Failed to update booking status: ' + error.message);
    }
    return;
  }

  // Get the modal element
  const modalElement = document.getElementById('statusChangeModal');
  if (!modalElement) {
    console.error('Status Change Modal element not found in the DOM.');
    alert('Error: Status Change Modal not found. Please check your HTML.');
    return;
  }

  // Initialize the modal
  let modal;
  try {
    modal = new bootstrap.Modal(modalElement, {
      backdrop: 'static', // Prevent closing by clicking outside
      keyboard: false // Prevent closing with the Escape key
    });
  } catch (error) {
    console.error('Error initializing modal:', error.message);
    alert('Error: Failed to open the status change modal. Please try again.');
    return;
  }

  // Show the appropriate modal content
  const bookingDetails = document.getElementById('bookingDetails');
  const pendingToCompleteContent = document.getElementById('pendingToCompleteContent');
  const completeToPendingContent = document.getElementById('completeToPendingContent');
  const paymentAttestationInput = document.getElementById('paymentAttestation');
  const statusChangeReasonInput = document.getElementById('statusChangeReason');
  const confirmButton = document.getElementById('confirmStatusChange');

  if (!bookingDetails || !pendingToCompleteContent || !completeToPendingContent || !confirmButton) {
    console.error('Modal elements not found:', {
      bookingDetails: !!bookingDetails,
      pendingToCompleteContent: !!pendingToCompleteContent,
      completeToPendingContent: !!completeToPendingContent,
      confirmButton: !!confirmButton
    });
    alert('Error: Modal elements not found. Please check the modal HTML.');
    return;
  }

  if (isPendingToComplete && !paymentAttestationInput) {
    console.error('Payment attestation input not found in the modal.');
    alert('Error: Payment attestation input not found. Please check the modal HTML.');
    return;
  }

  if (isCompleteToPending && !statusChangeReasonInput) {
    console.error('Status change reason input not found in the modal.');
    alert('Error: Status change reason input not found. Please check the modal HTML.');
    return;
  }

  // Populate booking details
  bookingDetails.textContent = `Booking ID: ${booking.booking_id}, Guest: ${booking.guest_name}`;

  // Reset inputs
  if (paymentAttestationInput) paymentAttestationInput.checked = false;
  if (statusChangeReasonInput) statusChangeReasonInput.value = '';

  // Show the appropriate content
  if (isPendingToComplete) {
    pendingToCompleteContent.classList.remove('d-none');
    completeToPendingContent.classList.add('d-none');
  } else if (isCompleteToPending) {
    pendingToCompleteContent.classList.add('d-none');
    completeToPendingContent.classList.remove('d-none');
  }

  modal.show();

  const statusChangeHandler = async () => {
    try {
      // Validate inputs based on the change direction
      let updateData = { status: newStatus };

      if (isPendingToComplete) {
        if (!paymentAttestationInput.checked) {
          alert('You must confirm the payment is correct to proceed.');
          return;
        }
        updateData.payment_checked = true;
      } else if (isCompleteToPending) {
        const statusChangeReason = statusChangeReasonInput.value.trim();
        if (!statusChangeReason) {
          alert('Please provide a reason for changing the status to pending.');
          return;
        }
        updateData.status_change_reason = statusChangeReason;
        // Do NOT update payment_checked; it should remain TRUE if already set
      }

      // Update the booking with the new status and additional fields
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id);
      if (updateError) throw new Error('Update status error: ' + updateError.message);

      // Adjust availability
      if (isPendingToComplete) {
        await adjustAvailability(booking, -1);
      } else if (isCompleteToPending) {
        await adjustAvailability(booking, 1);
      }

      // Reload the dashboard
      await loadDashboard();

      // Hide the modal
      modal.hide();
    } catch (error) {
      console.error('Error updating status (modal flow):', error.message);
      alert('Failed to update booking status: ' + error.message);
    }
  };

  // Attach the handler to the confirm button (remove previous listeners to avoid duplicates)
  confirmButton.removeEventListener('click', statusChangeHandler);
  confirmButton.addEventListener('click', statusChangeHandler);
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

// Delete booking with modal for reason
async function deleteBooking(id) {
  // Check if Bootstrap is available
  if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
    console.error('Bootstrap Modal is not available. Ensure bootstrap.bundle.min.js is loaded.');
    alert('Error: Modal functionality is not available. Please ensure Bootstrap is loaded.');
    return;
  }

  // Get the modal element
  const modalElement = document.getElementById('deleteBookingModal');
  if (!modalElement) {
    console.error('Delete Booking Modal element not found in the DOM.');
    alert('Error: Delete Booking Modal not found. Please check your HTML.');
    return;
  }

  // Initialize the modal
  let modal;
  try {
    modal = new bootstrap.Modal(modalElement, {
      backdrop: 'static', // Prevent closing by clicking outside
      keyboard: false // Prevent closing with the Escape key
    });
  } catch (error) {
    console.error('Error initializing modal:', error.message);
    alert('Error: Failed to open the deletion modal. Please try again.');
    return;
  }

  // Fetch the booking to determine its status
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', id)
    .single();
  if (fetchError) {
    console.error('Fetch booking error:', fetchError.message);
    alert('Failed to fetch booking: ' + fetchError.message);
    return;
  }

  // Show the modal and adjust its content based on status
  const refundStatusGroup = document.getElementById('refundStatusGroup');
  const refundStatusInput = document.getElementById('refundStatus');
  const reasonInput = document.getElementById('deletionReason');
  const confirmButton = document.getElementById('confirmDeleteBooking');

  if (!reasonInput || !confirmButton) {
    console.error('Modal elements not found.');
    alert('Error: Modal elements not found. Please check the modal HTML.');
    return;
  }

  // Reset inputs
  reasonInput.value = '';
  if (refundStatusInput) refundStatusInput.value = '';

  // Show/hide refund status based on booking status
  if (booking.status === 'complete') {
    refundStatusGroup.classList.remove('d-none');
  } else {
    refundStatusGroup.classList.add('d-none');
  }

  modal.show();

  const deleteHandler = async () => {
    try {
      // Validate the reason
      const cancellationReason = reasonInput.value.trim();
      if (!cancellationReason) {
        alert('Please provide a reason for deleting the booking.');
        return;
      }

      // Validate refund status for complete bookings
      let refundStatus = null;
      if (booking.status === 'complete') {
        refundStatus = refundStatusInput.value;
        if (!refundStatus) {
          alert('Please select a refund status.');
          return;
        }
      }

      // Fetch the full booking details
      const { data: fullBooking, error: fetchFullError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchFullError) throw new Error('Fetch booking error: ' + fetchFullError.message);

      // Adjust availability if the booking status is 'complete'
      if (fullBooking.status === 'complete') {
        await adjustAvailability(fullBooking, 1);
      }

      // Delete from bookings first
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      if (deleteError) throw new Error('Delete error: ' + deleteError.message);

      // Handle based on status
      if (fullBooking.status === 'complete') {
        // Insert into archive_refunds for complete bookings
        const archivedBooking = {
          ...fullBooking,
          cancellation_reason: cancellationReason,
          refund_status: refundStatus
        };
        const { error: insertError } = await supabase
          .from('archive_refunds')
          .insert(archivedBooking);
        if (insertError) throw new Error('Insert into archive_refunds error: ' + insertError.message);
      } else if (fullBooking.status === 'pending') {
        // Insert into archive_cancelled_no_payment for pending bookings
        const cancelledBooking = {
          ...fullBooking,
          cancellation_reason: cancellationReason
        };
        const { error: insertError } = await supabase
          .from('archive_cancelled_no_payment')
          .insert(cancelledBooking);
        if (insertError) throw new Error('Insert into archive_cancelled_no_payment error: ' + insertError.message);
      } else {
        throw new Error('Invalid booking status: ' + fullBooking.status);
      }

      // Reload the dashboard
      await loadDashboard();

      // Hide the modal
      modal.hide();
    } catch (error) {
      console.error('Error deleting booking:', error.message);
      alert('Failed to delete booking: ' + error.message);
    }
  };

  // Attach the handler to the confirm button (remove previous listeners to avoid duplicates)
  confirmButton.removeEventListener('click', deleteHandler);
  confirmButton.addEventListener('click', deleteHandler);
}