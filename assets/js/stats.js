import supabase from './supabase-client.js';

// Initialize Stats tab
export async function initStats() {
  const statsTab = document.getElementById('stats-tab');
  if (statsTab) {
    statsTab.addEventListener('shown.bs.tab', loadStatsData);
    if (statsTab.classList.contains('active')) {
      await loadStatsData();
    }
  }
}

let revenueChart;
let archiveChart;
let currentPage = 1;
const perPage = 10;
let cachedChartData = null; // Cache for chart and table data

// Load all Stats section data (excluding archive summary)
async function loadStatsData() {
  try {
    await Promise.all([
      loadKPIs(),
      loadAccommodationUsage(),
      loadArchiveBookings(currentPage),
      loadCharts()
    ]);
  } catch (error) {
    console.error('Error loading Stats data:', error);
    alert('Failed to load statistics: ' + error.message);
  }
}

// Load KPIs: Monthly Revenue, Days Booked, Avg Booking Duration
async function loadKPIs() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-based
  const currentYear = currentDate.getFullYear();
  const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
  const endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;

  const { data: bookings, error: bookingError } = await supabase
    .from('archive_bookings')
    .select('total_cost, checkin_date, checkout_date')
    .gte('checkin_date', startDate)
    .lt('checkin_date', endDate)
    .eq('status', 'complete');

  if (bookingError) {
    console.error('KPIs fetch error:', bookingError);
    alert('Failed to load KPIs: ' + bookingError.message);
    return;
  }

  console.log('KPIs bookings:', bookings);

  let monthlyRevenue = 0;
  let daysBooked = 0;
  let totalStays = 0;
  let bookingCount = bookings.length;

  if (bookingCount) {
    bookings.forEach(booking => {
      monthlyRevenue += Number(booking.total_cost) || 0;
      const checkin = new Date(booking.checkin_date);
      const checkout = new Date(booking.checkout_date);
      const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      daysBooked += days;
      totalStays += days;
    });
  }

  const avgDuration = bookingCount ? (totalStays / bookingCount).toFixed(1) : 0;

  const revenueEl = document.getElementById('monthly-revenue');
  const daysEl = document.getElementById('days-booked');
  const durationEl = document.getElementById('avg-duration');
  if (revenueEl) revenueEl.textContent = `R${monthlyRevenue.toFixed(2)}`;
  if (daysEl) daysEl.textContent = daysBooked || '0';
  if (durationEl) durationEl.textContent = `${avgDuration} days`;
}

// Load Accommodation Usage Table: Revenue and occupancy by room type per month
async function loadAccommodationUsage() {
  const { data: bookings, error: bookingError } = await supabase
    .from('archive_bookings')
    .select('room_type_id, checkin_date, checkout_date, total_cost')
    .eq('status', 'complete')
    .order('checkin_date', { ascending: true });

  if (bookingError) {
    console.error('Accommodation usage fetch error:', bookingError);
    alert('Failed to load accommodation usage: ' + bookingError.message);
    return;
  }

  console.log('Accommodation usage bookings:', bookings);

  const { data: roomTypes, error: roomError } = await supabase
    .from('bnb_room_type')
    .select('id, accomodation_type, quantity');

  if (roomError) {
    console.error('Room types fetch error:', roomError);
    alert('Failed to load room types: ' + roomError.message);
    return;
  }

  console.log('Room types:', roomTypes);

  const roomTypeMap = Object.fromEntries(roomTypes.map(t => [t.id, {
    name: t.accomodation_type || `Unknown (ID: ${t.id})`,
    quantity: Number(t.quantity) || 1
  }]));
  const usageData = {};

  bookings.forEach(booking => {
    const roomType = roomTypeMap[booking.room_type_id];
    if (!roomType) {
      console.warn(`Skipping booking with invalid room_type_id: ${booking.room_type_id}`);
      return;
    }
    const checkin = new Date(booking.checkin_date);
    const checkout = new Date(booking.checkout_date);
    const startMonth = new Date(checkin.getFullYear(), checkin.getMonth(), 1);
    const endMonth = new Date(checkout.getFullYear(), checkout.getMonth() + 1, 0);

    // Iterate over months in the booking range
    let current = new Date(startMonth);
    while (current <= endMonth) {
      const month = current.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!usageData[month]) usageData[month] = {};
      if (!usageData[month][roomType.name]) {
        usageData[month][roomType.name] = { revenue: 0, bookedDays: 0 };
      }

      // Calculate days and revenue in this month
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const rangeStart = checkin > monthStart ? checkin : monthStart;
      const rangeEnd = checkout < monthEnd ? checkout : monthEnd;
      const days = Math.max(0, Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)) + 1);

      usageData[month][roomType.name].bookedDays += days;
      // Apportion revenue based on days in this month
      const totalDays = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      const revenueShare = totalDays ? (days / totalDays) * Number(booking.total_cost) : 0;
      usageData[month][roomType.name].revenue += revenueShare || 0;

      // Move to next month
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }
  });

  console.log('Accommodation usage data:', usageData);

  const tbody = document.getElementById('accommodation-body');
  if (tbody) {
    tbody.innerHTML = '';
    for (const month in usageData) {
      const [monthName, year] = month.split(' ');
      const daysInMonth = new Date(year, new Date(month + ' 1').getMonth() + 1, 0).getDate();
      for (const roomType in usageData[month]) {
        const qty = roomTypeMap[Object.keys(roomTypeMap).find(id => roomTypeMap[id].name === roomType)]?.quantity || 1;
        const totalRoomDays = qty * daysInMonth;
        const bookedDays = usageData[month][roomType].bookedDays;
        const rate = totalRoomDays ? ((bookedDays / totalRoomDays) * 100).toFixed(1) : 0;
        tbody.innerHTML += `
          <tr>
            <td>${month}</td>
            <td>${roomType}</td>
            <td>R${usageData[month][roomType].revenue.toFixed(2)}</td>
            <td>${rate}%</td>
          </tr>`;
      }
    }
    if (!Object.keys(usageData).length) {
      tbody.innerHTML = '<tr><td colspan="4">No data available</td></tr>';
    }
  } else {
    console.error('Accommodation body element not found');
    alert('UI error: Accommodation table not found');
  }
}

// Load Archive Bookings Table: Paginated historical data
async function loadArchiveBookings(page = 1) {
  currentPage = page;
  const { data: types, error: typesError } = await supabase
    .from('bnb_room_type')
    .select('id, accomodation_type');
  if (typesError) {
    console.error('Room types fetch error:', typesError);
    alert('Failed to load room types: ' + typesError.message);
    return;
  }
  const roomTypeMap = Object.fromEntries(types.map(t => [t.id, t.accomodation_type || `Unknown (ID: ${t.id})`]));

  const { data, count, error } = await supabase
    .from('archive_bookings')
    .select('id, guest_name, guest_email, room_type_id, checkin_date, checkout_date, total_cost', { count: 'exact' })
    .order('checkin_date', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error) {
    console.error('Archive bookings fetch error:', error);
    alert('Failed to load archive bookings: ' + error.message);
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

  // Update pagination buttons
  const prevBtn = document.getElementById('archive-prev');
  const nextBtn = document.getElementById('archive-next');
  if (prevBtn && nextBtn) {
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = !count || (page * perPage) >= count;
    prevBtn.onclick = () => loadArchiveBookings(currentPage - 1);
    nextBtn.onclick = () => loadArchiveBookings(currentPage + 1);
  }
}

// Load Monthly Archive Summary Table: Using cached chart data
function loadArchiveSummary() {
  if (!cachedChartData) {
    console.error('No cached chart data available');
    alert('Failed to load archive summary: No data available');
    return;
  }

  const tbody = document.getElementById('archive-summary-body');
  if (tbody) {
    tbody.innerHTML = Object.entries(cachedChartData)
      .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Sort by date descending
      .map(([month, v]) => `
        <tr>
          <td>${month}</td>
          <td>${v.count}</td>
          <td>R${v.revenue.toFixed(2)}</td>
        </tr>`
      ).join('') || '<tr><td colspan="3">No data available</td></tr>';
  } else {
    console.error('Archive summary body element not found');
    alert('UI error: Archive summary table not found');
  }
}

// Load Charts: Enhanced revenue and bookings charts
async function loadCharts() {
  const { data, error } = await supabase
    .from('archive_bookings')
    .select('checkin_date, total_cost, checkout_date');

  if (error) {
    console.error('Charts data fetch error:', error);
    alert('Failed to load charts: ' + error.message);
    return;
  }

  const monthlyData = {};
  data.forEach(booking => {
    const month = new Date(booking.checkin_date).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, count: 0, totalDays: 0 };
    }
    monthlyData[month].revenue += Number(booking.total_cost) || 0;
    monthlyData[month].count++;
    const checkin = new Date(booking.checkin_date);
    const checkout = new Date(booking.checkout_date);
    const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    monthlyData[month].totalDays += days;
  });

  cachedChartData = monthlyData; // Cache data for table

  const labels = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));
  const revenueData = labels.map(month => monthlyData[month].revenue);
  const bookingCountData = labels.map(month => monthlyData[month].count);
  const avgDurationData = labels.map(month => monthlyData[month].count ? (monthlyData[month].totalDays / monthlyData[month].count).toFixed(1) : 0);

  // Revenue Line Chart
  const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
  if (revenueCtx) {
    if (revenueChart) revenueChart.destroy();
    const gradient = revenueCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 110, 110, 0.5)'); // Brighter #006e6e
    gradient.addColorStop(1, 'rgba(0, 110, 110, 0.1)');
    revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Monthly Revenue',
          data: revenueData,
          borderColor: '#006e6e',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#006e6e',
          pointHoverRadius: 10,
          pointHoverBackgroundColor: '#006e6e',
          pointHoverBorderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: true, position: 'top', labels: { font: { size: 14 } } },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 10,
            callbacks: {
              title: context => context[0].label,
              label: context => {
                const value = context.parsed.y;
                const prevValue = context.dataIndex > 0 ? revenueData[context.dataIndex - 1] : null;
                const change = prevValue ? ((value - prevValue) / prevValue * 100).toFixed(1) : null;
                return [
                  `Revenue: R${value.toFixed(2)}`,
                  change ? `Change: ${change > 0 ? '+' : ''}${change}%` : ''
                ].filter(Boolean);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Revenue (ZAR)', font: { size: 12 } },
            grid: { color: 'rgba(0, 0, 0, 0.1)', borderDash: [5, 5] }
          },
          x: {
            title: { display: true, text: 'Month', font: { size: 12 } },
            grid: { display: false }
          }
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
          backgroundColor: 'rgba(0, 110, 110, 0.7)',
          borderColor: '#006e6e',
          borderWidth: 1,
          hoverBackgroundColor: '#006e6e',
          hoverBorderColor: '#004d4d'
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: true, position: 'top', labels: { font: { size: 14 } } },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 10,
            callbacks: {
              title: context => context[0].label,
              label: context => [
                `Bookings: ${context.parsed.y}`,
                `Avg Duration: ${avgDurationData[context.dataIndex]} days`
              ]
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#000',
            font: { weight: 'bold', size: 12 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Bookings', font: { size: 12 } },
            grid: { color: 'rgba(0, 0, 0, 0.1)', borderDash: [5, 5] }
          },
          x: {
            title: { display: true, text: 'Month', font: { size: 12 } },
            grid: { display: false }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // Initialize modal event listener
  const modal = document.getElementById('archive-summary-modal');
  if (modal) {
    modal.addEventListener('shown.bs.modal', loadArchiveSummary);
  }
}