import supabase from './supabase-client.js';

// Initialize Customer Management tab
export async function initCustomerManagement() {
  const customerTab = document.getElementById('customers-tab');
  if (customerTab) {
    customerTab.addEventListener('shown.bs.tab', loadCustomerData);
    if (customerTab.classList.contains('active')) {
      await loadCustomerData();
    }
  } else {
    console.warn('Customers tab element not found in the DOM');
  }
}

let hasLoaded = false; // Flag to prevent re-fetching data

// Load customer data from bookings and archive_bookings tables
async function loadCustomerData() {
  if (hasLoaded) {
    console.log('Customer data already loaded, skipping fetch.');
    return;
  }

  const tbody = document.getElementById('customer-mgmt-body');
  if (!tbody) {
    console.error('Customer table body element not found');
    alert('UI error: Customer table not found');
    return;
  }

  try {
    console.log('Fetching customer data...');

    // Fetch from bookings table
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('guest_name, guest_email, guest_phone')
      .eq('status', 'complete');

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      tbody.innerHTML = `<tr><td colspan="4">Error loading data: ${bookingsError.message}</td></tr>`;
      return;
    }

    console.log('Bookings data:', bookings);

    // Fetch from archive_bookings table
    const { data: archiveBookings, error: archiveError } = await supabase
      .from('archive_bookings')
      .select('guest_name, guest_email, guest_phone')
      .eq('status', 'complete');

    if (archiveError) {
      console.error('Archive bookings fetch error:', archiveError);
      tbody.innerHTML = `<tr><td colspan="4">Error loading data: ${archiveError.message}</td></tr>`;
      return;
    }

    console.log('Archive bookings data:', archiveBookings);

    // Combine and deduplicate by guest_email and guest_name
    const allCustomers = [...bookings, ...archiveBookings];
    const customerMap = new Map();
    allCustomers.forEach(customer => {
      const key = `${customer.guest_email}|${customer.guest_name}`; // Composite key
      if (!customerMap.has(key)) {
        customerMap.set(key, customer);
      }
    });

    const uniqueCustomers = Array.from(customerMap.values());
    console.log('Unique customers:', uniqueCustomers);

    // Render customer table
    renderCustomerTable(uniqueCustomers);
    hasLoaded = true; // Set flag after successful load
  } catch (error) {
    console.error('Error loading customer data:', error);
    tbody.innerHTML = `<tr><td colspan="4">Error loading data: ${error.message}</td></tr>`;
  }
}

// Render customer table
function renderCustomerTable(customers) {
  const tbody = document.getElementById('customer-mgmt-body');
  if (!tbody) {
    console.error('Customer table body element not found');
    return;
  }

  tbody.innerHTML = customers.map(customer => `
    <tr>
      <td>${customer.guest_name}</td>
      <td>${customer.guest_email}</td>
      <td>${customer.guest_phone || 'N/A'}</td>
      <td>
        <button class="customer-mgmt-contact-btn customer-mgmt-email-btn" 
                onclick="window.showEmailModal('${customer.guest_email}', '${customer.guest_name}')"
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                title="Contact via Email">
          <i class="bi bi-envelope"></i>
          <span class="contact-label">Email</span>
        </button>
        <button class="customer-mgmt-contact-btn customer-mgmt-sms-btn" 
                onclick="window.showSMSModal('${customer.guest_phone}', '${customer.guest_name}')"
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                title="Contact via SMS">
          <i class="bi bi-chat-text"></i>
          <span class="contact-label">SMS</span>
        </button>
        ${customer.guest_phone ? `
          <button onclick="window.open('https://api.whatsapp.com/send/?phone=${customer.guest_phone}&text&app_absent=0', '_blank')"
             class="customer-mgmt-contact-btn customer-mgmt-whatsapp-btn"
             data-bs-toggle="tooltip" 
             data-bs-placement="top" 
             title="Chat on WhatsApp">
            <i class="bi bi-whatsapp"></i>
            <span class="contact-label">WhatsApp</span>
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4">No customers found</td></tr>';

  // Initialize tooltips for all buttons
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Show email modal
window.showEmailModal = function(email, name) {
  let modal = document.getElementById('customer-mgmt-email-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customer-mgmt-email-modal';
    modal.className = 'customer-mgmt-modal';
    modal.innerHTML = `
      <div class="customer-mgmt-modal-content">
        <div class="customer-mgmt-modal-header">
          <h2 class="customer-mgmt-modal-title">Send Email to ${name}</h2>
          <button class="customer-mgmt-modal-close">×</button>
        </div>
        <form class="customer-mgmt-modal-form" id="customer-mgmt-email-form">
          <label for="email-subject">Subject</label>
          <input type="text" id="email-subject" name="subject" required />
          <label for="email-body">Message</label>
          <textarea id="email-body" name="body" required></textarea>
          <input type="hidden" id="email-recipient" name="recipient" value="${email}" />
          <button type="submit">Send Email</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.customer-mgmt-modal-close').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.querySelector('#customer-mgmt-email-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = document.getElementById('email-subject').value;
      const body = document.getElementById('email-body').value;
      const recipient = document.getElementById('email-recipient').value;

      try {
        const response = await sendEmail(recipient, subject, body);
        if (response.ok) {
          alert('Email sent successfully!');
          modal.style.display = 'none';
          document.getElementById('customer-mgmt-email-form').reset();
        } else {
          const errorData = await response.json();
          alert('Failed to send email: ' + (errorData.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error sending email:', error);
        alert('Failed to send email: ' + error.message);
      }
    });
  }

  modal.querySelector('.customer-mgmt-modal-title').textContent = `Send Email to ${name}`;
  modal.querySelector('#email-recipient').value = email;
  modal.style.display = 'flex';
};

// Show SMS modal
window.showSMSModal = function(phone, name) {
  let modal = document.getElementById('customer-mgmt-sms-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customer-mgmt-sms-modal';
    modal.className = 'customer-mgmt-modal';
    modal.innerHTML = `
      <div class="customer-mgmt-modal-content">
        <div class="customer-mgmt-modal-header">
          <h2 class="customer-mgmt-modal-title">Send SMS to ${name}</h2>
          <button class="customer-mgmt-modal-close">×</button>
        </div>
        <form class="customer-mgmt-modal-form" id="customer-mgmt-sms-form">
          <label for="sms-body">Message <span style="color: red;">(160 characters max)</span></label>
          <textarea id="sms-body" name="body" maxlength="160" required></textarea>
          <input type="hidden" id="sms-recipient" name="recipient" value="${phone}" />
          <button type="submit">Send SMS</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.customer-mgmt-modal-close').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.querySelector('#customer-mgmt-sms-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = document.getElementById('sms-body').value;
      const recipient = document.getElementById('sms-recipient').value;

      try {
        const response = await sendSMS(recipient, body);
        if (response.ok) {
          alert('SMS sent successfully!');
          modal.style.display = 'none';
          document.getElementById('customer-mgmt-sms-form').reset();
        } else {
          const errorData = await response.json();
          alert('Failed to send SMS: ' + (errorData.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error sending SMS:', error);
        alert('Failed to send SMS: ' + error.message);
      }
    });
  }

  modal.querySelector('.customer-mgmt-modal-title').textContent = `Send SMS to ${name}`;
  modal.querySelector('#sms-recipient').value = phone;
  modal.style.display = 'flex';
};

// Send email using Resend API
async function sendEmail(recipient, subject, body) {
  const RESEND_API_KEY = 'your_resend_api_key_here'; // Replace with your Resend API key
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'your-email@yourdomain.com', // Replace with your sender email
      to: recipient,
      subject: subject,
      html: `<p>${body}</p>`,
    }),
  });
  return response;
}

// Placeholder for sending SMS (to be implemented with Twilio)
async function sendSMS(recipient, body) {
  console.log(`Sending SMS to ${recipient}: ${body}`);
  return { ok: true }; // Simulate success until Twilio is implemented
}