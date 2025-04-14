// Room Selection Modal HTML (unchanged)
const roomSelectionModalHTML = `
  <div class="modal fade" id="roomSelectionModal" tabindex="-1" aria-labelledby="roomSelectionModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content custom-room-modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="roomSelectionModalLabel" style="color: black; font-weight: 600;">SELECT A ROOM</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="l-wrapper">
            <div class="rooms-listing__wrap">
              <div class="rooms-listing js-filter__load-box">
                <div class="rooms-listing__holder row">
                  <!-- Sharing Room -->
                  <div class="col-12 col-lg-12 mb-4" style="padding: 20px;">
                    <div class="room-item-card room-item-card--listing js-filter__load-item">
                      <div class="room-item-card__inner d-flex">
                        <div class="room-item-card__img-box">
                          <picture class="room-item-card__img-hld">
                            <div id="carouselSharing" class="carousel slide" data-bs-ride="carousel">
                              <div class="carousel-inner">
                                <div class="carousel-item active">
                                  <img src="assets/img/bibby's3.jpg" class="d-block w-100" alt="Sharing Room 1">
                                </div>
                                <div class="carousel-item">
                                  <img src="assets/img/bibby's16.jpg" class="d-block w-100" alt="Sharing Room 2">
                                </div>
                              </div>
                              <button class="carousel-control-prev" type="button" data-bs-target="#carouselSharing" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                <span class="visually-hidden">Previous</span>
                              </button>
                              <button class="carousel-control-next" type="button" data-bs-target="#carouselSharing" data-bs-slide="next">
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
                                <span class="value text-primary">R700</span>
                                <span class="rate">/night</span>
                              </div>
                            </div>
                            <div class="room-item-card__room-location-hld text-muted">
                              <span class="bi bi-geo-alt me-2"></span>
                              <p class="room-item-card__room-location-value">Butterwork B&B</p>
                            </div>
                            <div class="room-item-card__title-hld">
                              <h2 class="room-item-card__title">Sharing Room</h2>
                            </div>
                            <div class="room-item-card__special-info d-flex">
                              <div class="room-item-card__special-info-item me-3">
                                <span class="bi bi-rulers me-2"></span>
                                <span class="text">45 m<sup>2</sup></span>
                              </div>
                              <div class="room-item-card__special-info-item">
                                <span class="bi bi-person me-2"></span>
                                <span class="text">max. 4 pers.</span>
                              </div>
                            </div>
                            <div class="room-item-card__amenities mt-3">
                              <h5>Amenities</h5>
                              <ul class="list-unstyled">
                                <li><span class="bi bi-wifi me-2"></span>Free Wi-Fi</li>
                                <li><span class="bi bi-cup-hot me-2"></span>Coffee Maker</li>
                                <li><span class="bi bi-water me-2"></span>Bathroom with Shower</li>
                              </ul>
                            </div>
                          </div>
                          <div class="room-item-card__buttons d-flex gap-2">
                            <a href="room_shared.html" class="btn btn-outline-dark btn-arrow">
                              <span class="text">Details</span>
                              <span class="bi bi-arrow-right ms-2"></span>
                            </a>
                            <button class="btn btn-success book-btn" data-room-type="Sharing Room" data-room-price="700">
                              <span class="text">Book</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

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
          <form id="bookingForm" action="https://formsubmit.co/bibbys.gh@gmail.com" method="POST">
            <input type="hidden" id="confirmRoomType" name="roomType">
            <input type="hidden" id="confirmRoomPrice" name="roomPrice">
            <input type="hidden" id="confirmCheckin" name="checkin">
            <input type="hidden" id="confirmCheckout" name="checkout">
            <input type="hidden" id="confirmAdults" name="adults">
            <input type="hidden" id="confirmChildren" name="children">
            <input type="hidden" id="confirmTotalCost" name="totalCost">
            <input type="hidden" name="_next" value="https://butterworth-bnb-sandy.vercel.app/booking_info.html">
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

// Function to show Room Selection Modal
function showRoomSelectionModal() {
  removeExistingModal('roomSelectionModal');
  document.body.insertAdjacentHTML('beforeend', roomSelectionModalHTML);
  const roomSelectionModal = new bootstrap.Modal(document.getElementById('roomSelectionModal'));
  roomSelectionModal.show();

  document.querySelectorAll('.book-btn').forEach(button => {
    button.addEventListener('click', handleBookButtonClick);
  });
}

// Function to handle "Book" button click
function handleBookButtonClick() {
  const roomType = this.getAttribute('data-room-type');
  const roomPrice = this.getAttribute('data-room-price');
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const adults = document.querySelector('select[name="adults"]').value;
  const children = document.querySelector('select[name="children"]').value;

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const nights = (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24);
  const totalCost = nights * parseFloat(roomPrice);

  removeExistingModal('bookingConfirmationModal');
  document.body.insertAdjacentHTML('beforeend', bookingConfirmationModalHTML);
  const bookingConfirmationModal = new bootstrap.Modal(document.getElementById('bookingConfirmationModal'));

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

  document.getElementById('bookingForm').addEventListener('submit', handleBookingFormSubmit);
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
  console.log('Captured bookingInfo:', bookingInfo); // Debug: Check values before storage
  localStorage.setItem('bookingInfo', JSON.stringify(bookingInfo));
  console.log('Stored in localStorage:', JSON.parse(localStorage.getItem('bookingInfo'))); // Debug: Verify storage

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
  if (existingModal) existingModal.remove();
}

// Initialize Flatpickr and attach form submission handler
document.addEventListener('DOMContentLoaded', function() {
  flatpickr('#checkin', { dateFormat: 'Y-m-d' });
  flatpickr('#checkout', { dateFormat: 'Y-m-d' });

  document.getElementById('reservations').addEventListener('submit', function(event) {
    event.preventDefault();
    showRoomSelectionModal();
  });
});

window.showRoomSelectionModal = showRoomSelectionModal;