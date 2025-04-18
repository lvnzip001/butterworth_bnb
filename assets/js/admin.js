import supabase from './supabase-client.js';

let calendar;
let revenueChart;
let archiveChart;
let roomTypeOptions = [];

// Initialize calendar and data
window.addEventListener('DOMContentLoaded', async () => {
  initCalendar();
  await loadRoomTypes();
  await loadDashboard();
  await loadStatsData();
});

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

// Load room types for pricing & booking edits
async function loadRoomTypes() {
  const { data, error } = await supabase
    .from('bnb_room_type')
    .select('id, accomodation_type, price_per_night, quantity')
    .order('accomodation_type');
  if (error) {
    console.error('Room types error:', error);
    alert('Failed to load room types');
    return;
  }
  roomTypeOptions = data;
  const tbody = document.getElementById('room-types-body');
  if (tbody) {
    tbody.innerHTML = data.map(r => `
      <tr data-id="${r.id}">
        <td>${r.accomodation_type}</td>
        <td><input class="form-control form-control-sm edit-price" type="number" step="0.01" value="${r.price_per_night}"></td>
        <td><input class="form-control form-control-sm edit-qty" type="number" value="${r.quantity}"></td>
        <td><button class="btn btn-sm btn-primary save-room">Save</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.save-room').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('tr');
        const id = row.dataset.id;
        const price = parseFloat(row.querySelector('.edit-price').value);
        const qty = parseInt(row.querySelector('.edit-qty').value, 10);
        const { error } = await supabase
          .from('bnb_room_type')
          .update({ price_per_night: price, quantity: qty })
          .eq('id', id);
        if (error) {
          alert('Update failed: ' + error.message);
        } else {
          btn.textContent = '✔';
          setTimeout(() => btn.textContent = 'Save', 1500);
        }
      });
    });
  }
}

// Load live bookings and render all
async function loadDashboard() {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_email, guest_phone, room_type_id, checkin_date, checkout_date, total_cost, status, created_at, bnb_room_type(accomodation_type)')
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

// Load all Stats section data
async function loadStatsData() {
  try {
    // Load stats when Stats tab is shown
    const statsTab = document.getElementById('stats-tab');
    if (statsTab) {
      statsTab.addEventListener('shown.bs.tab', async () => {
        await Promise.all([
          loadKPIs(),
          loadAccommodationUsage(),
          loadArchiveBookings(),
          loadArchiveSummary(),
          loadCharts()
        ]);
      });
      // Load immediately if Stats tab is active
      if (statsTab.classList.contains('active')) {
        await Promise.all([
          loadKPIs(),
          loadAccommodationUsage(),
          loadArchiveBookings(),
          loadArchiveSummary(),
          loadCharts()
        ]);
      }
    }
  } catch (error) {
    console.error('Error loading Stats data:', error);
    alert('Failed to load statistics. Please try again.');
  }
}

// Load KPIs: Monthly Revenue and Days Booked for the current month
async function loadKPIs() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-based
  const currentYear = currentDate.getFullYear();
  const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
  const endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('archive_bookings')
    .select('total_cost, checkin_date, checkout_date')
    .gte('checkin_date', startDate)
    .lt('checkin_date', endDate)
    .eq('status', 'complete');

  if (error) {
    console.error('KPIs fetch error:', error);
    return;
  }

  let monthlyRevenue = 0;
  let daysBooked = 0;

  if (data.length) {
    data.forEach(booking => {
      monthlyRevenue += Number(booking.total_cost) || 0;
      const checkin = new Date(booking.checkin_date);
      const checkout = new Date(booking.checkout_date);
      const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      daysBooked += days;
    });
  }

  const revenueEl = document.getElementById('monthly-revenue');
  const daysEl = document.getElementById('days-booked');
  if (revenueEl) revenueEl.textContent = `R${monthlyRevenue.toFixed(2)}`;
  if (daysEl) daysEl.textContent = daysBooked || '0';
}

// Load Accommodation Usage Table: Revenue by room type per month
async function loadAccommodationUsage() {
  const { data, error } = await supabase
    .from('archive_bookings')
    .select('room_type_id, checkin_date, total_cost, bnb_room_type(accomodation_type)')
    .order('checkin_date', { ascending: true });

  if (error) {
    console.error('Accommodation usage fetch error:', error);
    return;
  }

  const usageData = {};
  data.forEach(booking => {
    const month = new Date(booking.checkin_date).toLocaleString('default', { month: 'long', year: 'numeric' });
    const roomType = booking.bnb_room_type?.accomodation_type || 'Unknown';
    if (!usageData[month]) usageData[month] = {};
    if (!usageData[month][roomType]) usageData[month][roomType] = 0;
    usageData[month][roomType] += Number(booking.total_cost) || 0;
  });

  const tbody = document.getElementById('accommodation-body');
  if (tbody) {
    tbody.innerHTML = '';
    for (const month in usageData) {
      for (const roomType in usageData[month]) {
        tbody.innerHTML += `
          <tr>
            <td>${month}</td>
            <td>${roomType}</td>
            <td>R${usageData[month][roomType].toFixed(2)}</td>
          </tr>`;
      }
    }
    if (!Object.keys(usageData).length) {
      tbody.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
    }
  }
}

// Load Archive Bookings Table: Paginated historical data
async function loadArchiveBookings(page = 1, perPage = 10) {
  const { data: types, error: typesError } = await supabase
    .from('bnb_room_type')
    .select('id, accomodation_type');
  if (typesError) {
    console.error('Room types fetch error:', typesError);
    return;
  }
  const roomTypeMap = Object.fromEntries(types.map(t => [t.id, t.accomodation_type]));

  const { data, error } = await supabase
    .from('archive_bookings')
    .select('id, guest_name, guest_email, room_type_id, checkin_date, checkout_date, total_cost')
    .order('checkin_date', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error) {
    console.error('Archive bookings fetch error:', error);
    return;
  }

  const tbody = document.getElementById('archive-bookings-body');
  if (tbody) {
    tbody.innerHTML = data.map(b => `
      <tr>
        <td>${b.guest_name}</td>
        <td>${b.guest_email}</td>
        <td>${roomTypeMap[b.room_type_id] || 'Unknown'}</td>
        <td>${b.checkin_date}</td>
        <td>${b.checkout_date}</td>
        <td>R${Number(b.total_cost || 0).toFixed(2)}</td>
      </tr>`).join('') || '<tr><td colspan="6">No data available</td></tr>';
  }
}

// Load Monthly Archive Summary Table: Sorted by date
async function loadArchiveSummary() {
  const { data, error } = await supabase
    .from('archive_bookings')
    .select('checkin_date, total_cost');

  if (error) {
    console.error('Archive summary fetch error:', error);
    return;
  }

  const summary = {};
  data.forEach(b => {
    const m = new Date(b.checkin_date);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    summary[key] = summary[key] || { count: 0, revenue: 0 };
    summary[key].count++;
    summary[key].revenue += Number(b.total_cost) || 0;
  });

  const tbody = document.getElementById('archive-summary-body');
  if (tbody) {
    tbody.innerHTML = Object.entries(summary)
      .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date descending
      .map(([k, v]) => `
        <tr>
          <td>${new Date(k + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
          <td>${v.count}</td>
          <td>R${v.revenue.toFixed(2)}</td>
        </tr>`
      ).join('') || '<tr><td colspan="3">No data available</td></tr>';
  }
}

// Load Charts: Enhanced revenue and bookings charts
async function loadCharts() {
  const { data, error } = await supabase
    .from('archive_bookings')
    .select('checkin_date, total_cost');

  if (error) {
    console.error('Charts data fetch error:', error);
    return;
  }

  const monthlyData = {};
  data.forEach(booking => {
    const month = new Date(booking.checkin_date).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, count: 0 };
    }
    monthlyData[month].revenue += Number(booking.total_cost) || 0;
    monthlyData[month].count++;
  });

  const labels = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));
  const revenueData = labels.map(month => monthlyData[month].revenue);
  const bookingCountData = labels.map(month => monthlyData[month].count);

  // Revenue Line Chart
  const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
  if (revenueCtx) {
    if (revenueChart) revenueChart.destroy();
    const gradient = revenueCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 94, 94, 0.5)'); // #005e5e
    gradient.addColorStop(1, 'rgba(0, 94, 94, 0.1)');
    revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Monthly Revenue',
          data: revenueData,
          borderColor: '#005e5e',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#005e5e',
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: context => `R${context.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Revenue (ZAR)' } },
          x: { title: { display: true, text: 'Month' } }
        }
      }
    });
  }

  // Booking Count Bar Chart
  const bookingCtx = document.getElementById('archiveSummaryChart')?.getContext('2d');
  if (bookingCtx) {
    if (archiveChart) archiveChart.destroy();
    archiveChart = new Chart(bookingCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Number of Bookings',
          data: bookingCountData,
          backgroundColor: 'rgba(0, 94, 94, 0.7)',
          borderColor: '#005e5e',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: context => `${context.parsed.y} bookings`
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#000',
            font: { weight: 'bold' }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Bookings' } },
          x: { title: { display: true, text: 'Month' } }
        }
      },
      plugins: [ChartDataLabels]
    });
  }
}

// Update status with enhanced availability handling
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

// Adjust availability with enhanced error handling
async function adjustAvailability(bk, delta) {
  try {
    const start = new Date(bk.checkin_date);
    const end = new Date(bk.checkout_date);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      const { data: av, error: fetchError } = await supabase
        .from('availability')
        .select('available_quantity')
        .eq('bnb_id', bk.bnb_id)
        .eq('room_type_id', bk.room_type_id)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('Fetch availability error: ' + fetchError.message);
      }

      if (av) {
        const qty = av.available_quantity + delta;
        if (qty < 0) {
          throw new Error(`Cannot set negative availability for ${date}`);
        }
        const { error: updateError } = await supabase
          .from('availability')
          .update({ available_quantity: qty })
          .eq('bnb_id', bk.bnb_id)
          .eq('room_type_id', bk.room_type_id)
          .eq('date', date);
        if (updateError) throw new Error('Update availability error: ' + updateError.message);
      } else if (delta > 0) {
        const { data: roomType, error: roomError } = await supabase
          .from('bnb_room_type')
          .select('quantity')
          .eq('id', bk.room_type_id)
          .single();
        if (roomError) throw new Error('Fetch room type error: ' + roomError.message);
        const { error: insertError } = await supabase
          .from('availability')
          .insert({ bnb_id: bk.bnb_id, room_type_id: bk.room_type_id, date, available_quantity: Math.min(delta, roomType.quantity) });
        if (insertError) throw new Error('Insert availability error: ' + insertError.message);
      }
    }
  } catch (error) {
    console.error('Error adjusting availability:', error.message);
    throw error; // Propagate to caller for user feedback
  }
}

// Logout
function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/login.html';
}