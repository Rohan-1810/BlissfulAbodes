document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/login';

    const bookingsContainer = document.getElementById('my-bookings');
    const roomsContainer = document.getElementById('rooms-list');
    const typeFilter = document.getElementById('type-filter');
    const priceFilter = document.getElementById('price-filter');
    const filterBtn = document.getElementById('filter-btn');

    // Load Bookings
    async function loadBookings() {
        try {
            const res = await fetch('/api/guests/bookings/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            const bookings = await res.json();
            
            bookingsContainer.innerHTML = '';
            if (bookings.length === 0) {
                bookingsContainer.innerHTML = '<p>No bookings found.</p>';
                return;
            }

            bookings.forEach(b => {
                const card = document.createElement('div');
                card.className = 'stat-card'; // Reuse styled card
                card.style.textAlign = 'left';
                card.innerHTML = `
                    <h4>Booking #${b.bookingId.substring(0,8)}</h4>
                    <p><strong>Status:</strong> ${b.status}</p>
                    <p><strong>Dates:</strong> ${b.dates}</p>
                    <p><strong>Room:</strong> ${b.roomId}</p>
                `;
                bookingsContainer.appendChild(card);
            });
        } catch (e) {
            bookingsContainer.innerHTML = '<p>Error loading bookings.</p>';
        }
    }

    // Load Rooms
    async function loadRooms() {
        let url = '/api/guests/rooms?status=Available';
        if (typeFilter.value) url += `&type=${typeFilter.value}`;
        if (priceFilter.value) url += `&max_price=${priceFilter.value}`;

        try {
            const res = await fetch(url);
            const rooms = await res.json();
            
            roomsContainer.innerHTML = '';
            if (rooms.length === 0) {
                roomsContainer.innerHTML = '<p>No rooms available matching criteria.</p>';
                return;
            }

            rooms.forEach(r => {
                const card = document.createElement('div');
                card.className = 'card';
                // Use dynamic image url or fallback
                const img = r.image_url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80';
                
                card.innerHTML = `
                    <div style="height: 200px; background-color: #ddd;">
                        <img src="${img}" style="width:100%; height:100%; object-fit:cover;" alt="${r.type}">
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${r.type}</h3>
                        <div class="card-price">₹${r.price}</div>
                        <p>Amenities: ${r.amenities.join(', ')}</p>
                        <button class="btn btn-primary" onclick="openBookingModal('${r.roomId}', '${r.price}')">Book Now</button>
                    </div>
                `;
                roomsContainer.appendChild(card);
            });
        } catch (e) {
            roomsContainer.innerHTML = '<p>Error loading rooms.</p>';
        }
    }

    // Modal Logic
    window.openBookingModal = (roomId, price) => {
        const modal = document.getElementById('booking-modal');
        document.getElementById('modal-room-id').innerText = roomId;
        document.getElementById('modal-room-price').innerText = price;
        modal.style.display = 'flex';
        modal.dataset.roomId = roomId;
    };

    document.getElementById('confirm-booking-btn').addEventListener('click', async () => {
        const modal = document.getElementById('booking-modal');
        const roomId = modal.dataset.roomId;
        const dates = document.getElementById('booking-dates').value;

        if (!dates) {
            alert('Please enter dates');
            return;
        }

        try {
            const res = await fetch('/api/guests/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roomId, dates })
            });
            const data = await res.json();
            
            if (res.ok) {
                alert('Booking Confirmed! Confirmation email sent.');
                modal.style.display = 'none';
                loadBookings();
                loadRooms(); // Refresh to update status if backend changes it immediately (our MVP does)
            } else {
                alert(data.error || 'Booking failed');
            }
        } catch (e) {
            alert('Error processing booking');
        }
    });

    filterBtn.addEventListener('click', loadRooms);

    // Init
    loadBookings();
    loadRooms();
});
