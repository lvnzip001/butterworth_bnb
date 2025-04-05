// document.getElementById('bookingForm').addEventListener('submit', async (e) => {
//     e.preventDefault()
    
//     const bookingData = {
//       bnbId: 'YOUR_BNB_UUID',
//       checkin: document.getElementById('checkin').value,
//       checkout: document.getElementById('checkout').value,
//       guestName: document.getElementById('name').value,
//       guestEmail: document.getElementById('email').value,
//       roomTypeId: selectedRoomType // Get from UI
//     }
  
//     try {
//       const response = await fetch('/api/create-booking', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(bookingData)
//       })
      
//       if (!response.ok) throw new Error('Booking failed')
//       alert('Booking successful!')
//     } catch (error) {
//       alert(error.message)
//     }
//   })

import supabase from './supabase-server.js'

export default async (req, res) => {
  const bookingData = req.body;
  
  try {
    const { data, error } = await supabase.rpc('create_booking', {
      p_bnb_id: bookingData.bnb_id,
      // ... other params
    });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}