import supabase from './supabase-client.js';
import { getRoomTypes, getBnbIdByName } from './utils.js';

export async function initPricing() {
  const bnbID = await getBnbIdByName(); // Hardcoded for testing
  const roomTypes = await getRoomTypes(bnbID);
  const tbody = document.getElementById('room-types-body');
  if (tbody) {
    tbody.innerHTML = roomTypes.map(r => `
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