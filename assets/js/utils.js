import supabase from './supabase-client.js';


export async function getBnb() {
  const { data, error } = await supabase
    .from('bnb')
    .select('id, name,description, address, contact_email, contact_phone');
  if (error) {
    console.error('Bnb error:', error);
    alert('Failed to load available bnb');
    return [];
  }
  return data;
}

// Fetch bnb_id by bnbName
export async function getBnbIdByName(bnbName) {
  bnbName = 'Bibbys BnB Butterworth'; // Hardcoded for testing
  const bnbData = await getBnb();
  const bnb = bnbData.find(b => b.name === bnbName);
  if (!bnb) {
    console.error(`Bnb not found for name: ${bnbName}`);
    alert(`B&B "${bnbName}" not found. Please try again.`);
    return null;
  }
  console.log(`Bnb ID for ${bnbName}:`, bnb.id);
  return bnb.id;
}

// Fetch room types (shared across Bookings and Pricing)
export async function getRoomTypes(bnbId) {
  const { data, error } = await supabase
    .from('bnb_room_type')
    .select('id, bnb_id, accomodation_type, description, price_per_night, quantity, amenities, photos')
    .eq('bnb_id', bnbId)
    .order('accomodation_type');
    
  if (error) {
    console.error('Room types error:', error);
    alert('Failed to load room types');
    return [];
  }
  return data;
}

// Fetch room types with specified columns
export async function getRoomTypesWithColumns(bnbId, columns) {
  // Convert columns to string if provided as an array
  const selectColumns = Array.isArray(columns) ? columns.join(', ') : columns;
  
  const { data, error } = await supabase
    .from('bnb_room_type')
    .select(selectColumns)
    .eq('bnb_id', bnbId)
    .order('accomodation_type');
    
  if (error) {
    console.error(`Room types error for columns "${selectColumns}":`, error);
    alert('Failed to load room types');
    return [];
  }
  console.log(`Fetched Room Types with columns "${selectColumns}":`, data);
  return data;
}

// Adjust availability for status changes
export async function adjustAvailability(bk, delta) {
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
    throw error;
  }
}

// Logout
export function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/login.html';
}