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
                bookingsContainer.innerHTML = '<p style="padding: 1rem;">No upcoming bookings. Time to plan a trip!</p>';
                return;
            }

            bookings.forEach(b => {
                const ticket = document.createElement('div');
                ticket.className = 'booking-ticket';
                ticket.innerHTML = `
                    <h4 style="margin-bottom:0.5rem; color:var(--guest-gold)">${b.roomId}</h4>
                    <p style="font-size:0.9rem; margin-bottom:0.5rem;"><strong>${b.dates}</strong></p>
                    <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
                    <div style="font-size:0.8rem; color:#95a5a6; margin-top:1rem;">ID: #${b.bookingId.substring(0,8)}</div>
                `;
                bookingsContainer.appendChild(ticket);
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
                card.className = 'room-card-modern';
                
                // Use dynamic image url or fallback
                const img = r.image_url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80';
                
                // Image Wrapper
                const imgWrap = document.createElement('div');
                imgWrap.className = 'room-img-wrapper';
                imgWrap.innerHTML = `<img src="${img}" alt="${r.type}">`;
                card.appendChild(imgWrap);

                // Body
                const body = document.createElement('div');
                body.className = 'rc-body';
                body.innerHTML = `
                    <div class="rc-head">
                        <h3 class="card-title">${r.type}</h3>
                        <div class="card-price">₹${r.price}</div>
                    </div>
                    <div class="rc-amenities">${r.amenities.join(' • ')}</div>
                `;

                // Book Button
                const btn = document.createElement('button');
                btn.className = 'btn-book-glass';
                btn.innerText = 'Reserve Now';
                btn.onclick = () => openBookingModal(r.roomId, r.price);
                
                body.appendChild(btn);
                card.appendChild(body);
                roomsContainer.appendChild(card);
            });
        } catch (e) {
            roomsContainer.innerHTML = '<p>Error loading rooms.</p>';
        }
    }

    // Modal Logic
    window.openBookingModal = (roomId, price) => {
        console.log("Opening modal for:", roomId, price);
        const modal = document.getElementById('booking-modal');
        document.getElementById('modal-room-id').innerText = roomId || 'Error';
        document.getElementById('modal-room-price').innerText = price || '0';
        modal.style.display = 'flex';
        modal.dataset.roomId = roomId;
    };

    document.getElementById('confirm-booking-btn').addEventListener('click', async () => {
        const modal = document.getElementById('booking-modal');
        const roomId = modal.dataset.roomId;
        const checkIn = document.getElementById('checkin-date').value;
        const checkOut = document.getElementById('checkout-date').value;

        if (!checkIn || !checkOut) {
            alert('Please select both Check-in and Check-out dates');
            return;
        }

        if (checkIn >= checkOut) {
            alert('Check-out date must be after Check-in date');
            return;
        }

        // Format for backend (keeping simple string for this MVP)
        const dates = `${checkIn} to ${checkOut}`;

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
