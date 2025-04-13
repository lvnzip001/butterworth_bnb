import supabase from './supabase-client.js';

console.log('booking.js loaded');

window.submitBooking = async (bookingData) => {
  console.log('submitBooking called with:', bookingData);

  // Validation
  if (!bookingData.name || !bookingData.email || !bookingData.phone || !bookingData.checkin || !bookingData.checkout) {
    throw new Error('Please fill in all required fields.');
  }

  if (new Date(bookingData.checkout) <= new Date(bookingData.checkin)) {
    throw new Error('Check-out date must be after check-in date.');
  }

  if (isNaN(bookingData.totalCost) || bookingData.totalCost <= 0) {
    throw new Error('Invalid total cost.');
  }

  if (!bookingData.bnbId || !bookingData.roomTypeId) {
    throw new Error('No BnB or room type selected.');
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        bnb_id: bookingData.bnbId,
        room_type_id: bookingData.roomTypeId,
        checkin_date: bookingData.checkin,
        checkout_date: bookingData.checkout,
        guest_name: bookingData.name,
        guest_email: bookingData.email,
        guest_phone: bookingData.phone,
        total_cost: bookingData.totalCost,
        adults: bookingData.adults,
        children: bookingData.children,
        status: 'pending'
      }])
      .select();

    if (error) throw error;
    console.log('Booking Created in Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error saving booking:', error);
    throw error;
  }
};

console.log('window.submitBooking defined:', typeof window.submitBooking);