// Room data (single source of truth)
const roomsData = [
  {
    type: "Standard Room",
    price: 600,
    location: "Butterwork B&B",
    size: "40 m²",
    capacity: "max. 2 pers.",
    amenities: ["Free Wi-Fi", "TV", "Bathroom with Shower"],
    images: ["assets/img/standard_room.jpeg","assets/img/bibby's1.jpg", "assets/img/gallery/bathroom/bibbys_bath_1.jpg"],
    detailsLink: "room_standard.html"
  },
  {
    type: "Sharing Room",
    price: 700,
    location: "Butterwork B&B",
    size: "45 m²",
    capacity: "max. 4 pers.",
    amenities: ["Free Wi-Fi", "TV", "Bathroom with Shower"],
    images: ["assets/img/two_single_bed.jpeg", "assets/img/bibby's19.jpg", "assets/img/gallery/bathroom/bibbys_bath_1.jpg"],
    detailsLink: "room_shared.html"
  },
  {
    type: "Family Room",
    price: 800,
    location: "Butterwork B&B",
    size: "60 m²",
    capacity: "max. 5 pers.",
    amenities: ["Free Wi-Fi", "TV", "Bathroom with Shower"],
    images: ["assets/img/gallery/double_room.jpg", "assets/img/gallery/king_bed.jpg", "assets/img/gallery/bathroom/bibbys_bath_1.jpg"],
    detailsLink: "room_family.html"
  }
];

// Function to generate room card HTML
function generateRoomCard(room, index) {
  return `
    <div class="col-12 col-lg-12 mb-4 room-item-card__padding">
      <div class="room-item-card room-item-card--listing js-filter__load-item">
        <div class="room-item-card__inner d-flex">
          <div class="room-item-card__img-box">
            <picture class="room-item-card__img-hld">
              <div id="carousel${room.type.replace(/\s+/g, '')}${index}" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-inner">
                  ${room.images.map((img, i) => `
                    <div class="carousel-item ${i === 0 ? 'active' : ''}">
                      <img src="${img}" class="d-block w-100" alt="${room.type} ${i + 1}">
                    </div>
                  `).join('')}
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#carousel${room.type.replace(/\s+/g, '')}${index}" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#carousel${room.type.replace(/\s+/g, '')}${index}" data-bs-slide="next">
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Next</span>
                </button>
              </div>
            </picture>
          </div>
          <div class="room-item-card__text-box">
            <div class="room-item-card__text-box-inner">
              <div class="room-item-card__price-hld">
                <div class="room-item-card__price">
                  <span class="from">from</span>
                  <span class="value text-primary">R${room.price}</span>
                  <span class="rate">/night</span>
                </div>
              </div>
              <div class="room-item-card__room-location-hld text-muted">
                <span class="bi bi-geo-alt me-2"></span>
                <p class="room-item-card__room-location-value">${room.location}</p>
              </div>
              <div class="room-item-card__title-hld">
                <h2 class="room-item-card__title">${room.type}</h2>
              </div>
              <div class="room-item-card__special-info d-flex">
                <div class="room-item-card__special-info-item me-3">
                  <span class="bi bi-rulers me-2"></span>
                  <span class="text">${room.size}</span>
                </div>
                <div class="room-item-card__special-info-item">
                  <span class="bi bi-person me-2"></span>
                  <span class="text">${room.capacity}</span>
                </div>
              </div>
              <div class="room-item-card__amenities mt-3">
                <h5>Amenities</h5>
                <ul class="list-unstyled">
                  ${room.amenities.map(amenity => `<li><span class="bi bi-check-circle me-2"></span>${amenity}</li>`).join('')}
                </ul>
              </div>
            </div>
            <div class="room-item-card__buttons d-flex gap-2">
              <a href="${room.detailsLink}" class="btn btn-outline-dark btn-arrow">
                <span class="text">Details</span>
                <span class="bi bi-arrow-right ms-2"></span>
              </a>
              <button class="btn btn-success book-btn" data-room-type="${room.type}" data-room-price="${room.price}">
                <span class="text">Book</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Function to generate the room selection modal HTML
function generateRoomSelectionModal(roomFilter = null) {
  const filteredRooms = roomFilter ? roomsData.filter(room => room.type === roomFilter) : roomsData;
  return `
    <div class="modal fade" id="roomSelectionModal" tabindex="-1" aria-labelledby="roomSelectionModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content custom-room-modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="roomSelectionModalLabel" style="color: black; font-weight: 600;">SELECT A ROOM${roomFilter ? ` - ${roomFilter}` : ''}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="l-wrapper">
              <div class="rooms-listing__wrap">
                <div class="rooms-listing js-filter__load-box">
                  <div class="rooms-listing__holder row">
                    ${filteredRooms.map((room, index) => generateRoomCard(room, index)).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Booking Confirmation Modal HTML
const bookingConfirmationModalHTML = `
  <div class="modal fade" id="bookingConfirmationModal" tabindex="-1" aria-labelledby="bookingConfirmationModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content" style="color: black; font-weight: 300;">
        <div class="modal-header">
          <h5 class="modal-title" id="bookingConfirmationModalLabel">Confirm Your Booking</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="bookingForm" action="https://formsubmit.co/zluvuno@gmail.com" method="POST">
            <input type="hidden" id="confirmRoomType" name="roomType">
            <input type="hidden" id="confirmRoomPrice" name="roomPrice">
            <input type="hidden" id="confirmCheckin" name="checkin">
            <input type="hidden" id="confirmCheckout" name="checkout">
            <input type="hidden" id="confirmAdults" name="adults">
            <input type="hidden" id="confirmChildren" name="children">
            <input type="hidden" id="confirmTotalCost" name="totalCost">
            <input type="hidden" name="_next" value="https://butterworth-bnb-sandy.vercel.app/booking_info.html">
            <input type="hidden" name="_captcha" value="true">
            <input type="hidden" name="_template" value="box">
            <input type="hidden" name="_subject" value="Bibby's BnB: Reservation Confirmation!">
            <!-- Add auto-response for the client -->
            <input type="hidden" name="_autoresponse" value="Thank you for booking with Bibby's B&B! Your reservation has been received. To complete your reservation, please make payment within 48 hours to:\nStandard Bank\nAccount Number: 54477881\nPlease use your booking ID as the payment reference. Alternatively, call us at 047 491 0299 to arrange payment on arrival.\n\nPlease see your booking details below.">
            <p><strong>Room Type:</strong> <span id="displayRoomType"></span></p>
            <p><strong>Check-in:</strong> <span id="displayCheckin"></span></p>
            <p><strong>Check-out:</strong> <span id="displayCheckout"></span></p>
            <p><strong>Adults:</strong> <span id="displayAdults"></span></p>
            <p><strong>Children:</strong> <span id="displayChildren"></span></p>
            <p><strong>Total Cost:</strong> R<span id="displayTotalCost"></span></p>
            <div class="mb-3">
              <label for="name" class="form-label">Full Name</label>
              <input type="text" class="form-control" id="name" name="name" required>
            </div>
            <div class="mb-3">
              <label for="phone" class="form-label">Phone Number</label>
              <input type="tel" class="form-control" id="phone" name="phone" required>
            </div>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input type="email" class="form-control" id="email" name="email" required>
            </div>
            <button type="submit" class="btn btn-success">Make Booking</button>
      </form>
        </div>
      </div>
    </div>
  </div>
`;

// Function to show Room Selection Modal
function showRoomSelectionModal(roomType = null) {
  console.log('showRoomSelectionModal called with roomType:', roomType); // Debug log
  removeExistingModal('roomSelectionModal');
  document.body.insertAdjacentHTML('beforeend', generateRoomSelectionModal(roomType));
  const roomSelectionModal = new bootstrap.Modal(document.getElementById('roomSelectionModal'), { backdrop: 'static' });
  roomSelectionModal.show();

  document.querySelectorAll('.book-btn').forEach(button => {
    button.removeEventListener('click', handleBookButtonClick);
    button.addEventListener('click', handleBookButtonClick, { once: true });
  });
}

// Function to handle "Book" button click
function handleBookButtonClick(event) {
  const roomType = this.getAttribute('data-room-type');
  const roomPrice = this.getAttribute('data-room-price');
  const checkin = document.getElementById('checkin')?.value || '';
  const checkout = document.getElementById('checkout')?.value || '';
  const adults = document.querySelector('select[name="adults"]')?.value || '1';
  const children = document.querySelector('select[name="children"]')?.value || '0';

  if (!checkin || !checkout) {
    console.error('Check-in or check-out date is missing');
    alert('Please select check-in and check-out dates.');
    return;
  }

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const nights = (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24);
  if (nights <= 0) {
    console.error('Check-out date must be after check-in date');
    alert('Check-out date must be after check-in date.');
    return;
  }
  const totalCost = nights * parseFloat(roomPrice);

  removeExistingModal('bookingConfirmationModal');
  document.body.insertAdjacentHTML('beforeend', bookingConfirmationModalHTML);
  const bookingConfirmationModal = new bootstrap.Modal(document.getElementById('bookingConfirmationModal'), { backdrop: 'static' });

  document.getElementById('confirmRoomType').value = roomType;
  document.getElementById('confirmRoomPrice').value = roomPrice;
  document.getElementById('confirmCheckin').value = checkin;
  document.getElementById('confirmCheckout').value = checkout;
  document.getElementById('confirmAdults').value = adults;
  document.getElementById('confirmChildren').value = children;
  document.getElementById('confirmTotalCost').value = totalCost.toFixed(2);

  document.getElementById('displayRoomType').textContent = roomType;
  document.getElementById('displayCheckin').textContent = checkin;
  document.getElementById('displayCheckout').textContent = checkout;
  document.getElementById('displayAdults').textContent = adults;
  document.getElementById('displayChildren').textContent = children;
  document.getElementById('displayTotalCost').textContent = totalCost.toFixed(2);

  bookingConfirmationModal.show();

  const bookingForm = document.getElementById('bookingForm');
  bookingForm.removeEventListener('submit', handleBookingFormSubmit);
  bookingForm.addEventListener('submit', handleBookingFormSubmit, { once: true });
}

// Function to handle booking form submission
function handleBookingFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const name = form.querySelector('#name').value;
  const phone = form.querySelector('#phone').value;
  const email = form.querySelector('#email').value;
  const roomType = form.querySelector('#confirmRoomType').value;
  const checkin = form.querySelector('#confirmCheckin').value;
  const checkout = form.querySelector('#confirmCheckout').value;
  const adults = form.querySelector('#confirmAdults').value;
  const children = form.querySelector('#confirmChildren').value;
  const totalCost = form.querySelector('#confirmTotalCost').value;

  const bookingId = 'B' + Math.random().toString(36).substr(2, 9).toUpperCase();

  const bookingInfo = {
    name: name,
    email: email,
    phone: phone,
    roomType: roomType,
    checkin: checkin,
    checkout: checkout,
    adults: adults,
    children: children,
    totalCost: totalCost,
    bookingId: bookingId
  };
  console.log('Captured bookingInfo:', bookingInfo);
  localStorage.setItem('bookingInfo', JSON.stringify(bookingInfo));
  console.log('Stored in localStorage:', JSON.parse(localStorage.getItem('bookingInfo')));

  const bookingIdInput = document.createElement('input');
  bookingIdInput.type = 'hidden';
  bookingIdInput.name = 'bookingId';
  bookingIdInput.value = bookingId;
  form.appendChild(bookingIdInput);

  form.submit();
}

// Helper function to remove existing modals
function removeExistingModal(modalId) {
  const existingModal = document.getElementById(modalId);
  if (existingModal) {
    const modalInstance = bootstrap.Modal.getInstance(existingModal);
    if (modalInstance) modalInstance.dispose();
    existingModal.remove();
  }
}

// Initialize Flatpickr and attach form submission handler
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired'); // Debug log
  const checkinInput = document.getElementById('checkin');
  const checkoutInput = document.getElementById('checkout');

  if (checkinInput && checkoutInput) {
    const fp = flatpickr(checkinInput, {
      mode: "range",
      showMonths: 2,
      dateFormat: "Y-m-d",
      minDate: "today",
      onChange: function(selectedDates, dateStr, instance) {
        if (selectedDates.length === 2) {
          const [start, end] = selectedDates;
          checkinInput.value = instance.formatDate(start, "Y-m-d");
          checkoutInput.value = instance.formatDate(end, "Y-m-d");
        }
      }
    });

    const checkinIcon = document.querySelector('#checkin + .icon-calendar');
    if (checkinIcon) {
      checkinIcon.addEventListener('click', function() {
        fp.open();
      });
    }
    const checkoutIcon = document.querySelector('#checkout + .icon-calendar');
    if (checkoutIcon) {
      checkoutIcon.addEventListener('click', function() {
        fp.open();
      });
    }
  } else {
    console.warn('Check-in or check-out input not found');
  }

  const reservationsForm = document.getElementById('reservations');
  if (reservationsForm) {
    reservationsForm.removeEventListener('submit', handleReservationsSubmit);
    reservationsForm.addEventListener('submit', handleReservationsSubmit);
    console.log('Form listener attached');
  } else {
    console.warn('Reservations form not found');
  }
});

function handleReservationsSubmit(event) {
  event.preventDefault();
  const submitButton = event.target.querySelector('button[type="submit"]');
  const roomType = submitButton ? submitButton.getAttribute('data-room-type') : null;
  console.log('Form submitted, roomType:', roomType); // Debug log
  showRoomSelectionModal(roomType);
}

// Expose the showRoomSelectionModal function globally
window.showRoomSelectionModal = showRoomSelectionModal;