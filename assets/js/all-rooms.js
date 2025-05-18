import { getRoomTypes, getBnb } from './utils.js';
import supabase from './supabase-client.js';
// Static mappings for fields not in the database
const roomDetailsMap = {
  'Standard Room': {
    size: '40 m²',
    capacity: 'max. 2 pers.',
    detailsLink: 'room_standard.html',
    images: ['assets/img/standard_room.jpeg', 'assets/img/bibby\'s1.jpg', 'assets/img/gallery/bathroom/bibbys_bath_1.jpg']
  },
  'Sharing Room': {
    size: '45 m²',
    capacity: 'max. 4 pers.',
    detailsLink: 'room_shared.html',
    images: ['assets/img/two_single_bed.jpeg', 'assets/img/bibby\'s19.jpg', 'assets/img/gallery/bathroom/bibbys_bath_1.jpg']
  },
  'Family Room': {
    size: '60 m²',
    capacity: 'max. 5 pers.',
    detailsLink: 'room_family.html',
    images: ['assets/img/gallery/double_room.jpg', 'assets/img/gallery/king_bed.jpg', 'assets/img/gallery/bathroom/bibbys_bath_1.jpg']
  }
};


// Fetch room data from Supabase, filtered by bnb name
async function fetchRoomsData() {
  console.log('Fetching room data from Supabase...');
  
  // Fetch bnb data to get the id for the specified B&B
  const bnbName = 'Bibbys BnB Butterworth';
  const bnbData = await getBnb();
  const bnb = bnbData.find(b => b.name === bnbName);
  if (!bnb) {
    console.error(`Bnb not found for name: ${bnbName}`);
    alert(`B&B "${bnbName}" not found. Please try again.`);
    return [];
  }
  const bnbId = bnb.id;
  console.log('Bnb ID for', bnbName, ':', bnbId);

  // Fetch room types filtered by bnb_id
  const roomTypes = await getRoomTypes(bnbId);

  console.log('Raw Room Types:', roomTypes);
  const roomsData = roomTypes.map(room => ({
    type: room.accomodation_type,
    price: room.price_per_night,
    location: bnbName,
    size: roomDetailsMap[room.accomodation_type]?.size || 'Unknown',
    capacity: roomDetailsMap[room.accomodation_type]?.capacity || 'Unknown',
    amenities: room.amenities || ['Free Wi-Fi', 'TV', 'Bathroom with Shower'],
    images: room.photos || roomDetailsMap[room.accomodation_type]?.images || ['assets/img/default_room.jpg'],
    detailsLink: roomDetailsMap[room.accomodation_type]?.detailsLink || '#',
    bnb_id: room.bnb_id,
    room_type_id: room.id
  }));
  console.log('Fetched Rooms Data:', roomsData);
  return roomsData;
}

function showRoomSelectionModal(roomType = null) {
  console.log('showRoomSelectionModal called with roomType:', roomType);
  if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
    console.error('Bootstrap Modal is not available. Check script inclusion.');
    alert('Error: Unable to open room selection modal. Please try again later.');
    return;
  }
  removeExistingModal('roomSelectionModal');
  generateRoomSelectionModal(roomType).then(modalHTML => {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    // Wait for DOM update before initializing modal
    setTimeout(() => {
      const modalElement = document.getElementById('roomSelectionModal');
      if (!modalElement) {
        console.error('Modal element not found in DOM');
        return;
      }
      try {
        const roomSelectionModal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
        roomSelectionModal.show();
        // Attach event listeners to book buttons
        const bookButtons = modalElement.querySelectorAll('.book-btn');
        console.log(`Found ${bookButtons.length} book buttons in modal`);
        bookButtons.forEach(button => {
          button.removeEventListener('click', handleBookButtonClick);
          button.addEventListener('click', handleBookButtonClick, { once: true });
        });
      } catch (error) {
        console.error('Failed to initialize modal:', error);
        alert('Error: Unable to open modal. Please try again.');
      }
    }, 0);
  }).catch(error => {
    console.error('Failed to generate modal HTML:', error);
    alert('Error: Unable to load room data. Please try again.');
  });
}

async function generateRoomSelectionModal(roomFilter = null) {
  console.log('Generating room selection modal...');
  const roomsData = await fetchRoomsData();
  console.log('Rooms Data for Modal:', roomsData);
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
              <button class="btn btn-success book-btn" 
                data-room-type="${room.type}" 
                data-room-price="${room.price}" 
                data-bnb-id="${room.bnb_id}" 
                data-room-type-id="${room.room_type_id}">
                <span class="text">Book</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

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
            <input type="hidden" id="confirmBnbId" name="bnbId">
            <input type="hidden" id="confirmRoomTypeId" name="roomTypeId">
            <input type="hidden" name="_next" value="http://127.0.0.1:5501/booking_info.html">
            <input type="hidden" name="_captcha" value="false">
            <input type="hidden" name="_template" value="box">
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

function handleBookButtonClick(event) {
  const roomType = this.getAttribute('data-room-type');
  const roomPrice = this.getAttribute('data-room-price');
  const bnbId = this.getAttribute('data-bnb-id');
  const roomTypeId = this.getAttribute('data-room-type-id');
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
  document.getElementById('confirmBnbId').value = bnbId;
  document.getElementById('confirmRoomTypeId').value = roomTypeId;

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

async function handleBookingFormSubmit(event) {
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
  const bnbId = form.querySelector('#confirmBnbId').value;
  const roomTypeId = form.querySelector('#confirmRoomTypeId').value;
  const bookingId = 'B' + Math.random().toString(36).substr(2, 9).toUpperCase();

  const bookingData = {
    bnbId,
    roomTypeId,
    checkin,
    checkout,
    name,
    email,
    phone,
    totalCost: parseFloat(totalCost),
    adults: parseInt(adults),
    children: parseInt(children),
    bookingId
  };

  try {
    console.log('Calling window.submitBooking with:', bookingData);
    await window.submitBooking(bookingData);
    console.log('Booking saved to Supabase');
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    alert('Failed to save booking: ' + error.message);
    return;
  }

  const bookingInfo = {
    name,
    email,
    phone,
    roomType,
    checkin,
    checkout,
    adults,
    children,
    totalCost,
    bookingId
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

function removeExistingModal(modalId) {
  const existingModal = document.getElementById(modalId);
  if (existingModal) {
    const modalInstance = bootstrap.Modal.getInstance(existingModal);
    if (modalInstance) modalInstance.dispose();
    existingModal.remove();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired');
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
  console.log('Form submitted, roomType:', roomType);
  showRoomSelectionModal(roomType);
}

window.showRoomSelectionModal = showRoomSelectionModal;