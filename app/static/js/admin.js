document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
        window.location.href = '/login';
    }

    async function loadAnalytics() {
        try {
            const res = await fetch('/api/admin/analytics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            document.getElementById('anl-revenue').innerText = '$' + data.total_revenue;
            document.getElementById('anl-occupancy').innerText = data.occupancy_rate + '%';
            document.getElementById('anl-bookings').innerText = data.total_bookings;
            document.getElementById('anl-rooms').innerText = data.total_rooms;
        } catch (e) {
            console.error(e);
        }
    }

    async function loadRooms() {
        const container = document.getElementById('admin-rooms-list');
        try {
            const res = await fetch('/api/guests/rooms', { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rooms = await res.json();
            
            container.innerHTML = '';
            rooms.forEach(r => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-body">
                        <h4>${r.type} <small>($${r.price})</small></h4>
                        <p>Status: ${r.status}</p>
                        <button class="btn btn-accent" onclick="deleteRoom('${r.roomId}')">Delete</button>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            console.error(e);
        }
    }

    document.getElementById('addRoomForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('new-type').value;
        const price = document.getElementById('new-price').value;
        const image_url = document.getElementById('new-image').value;
        const amenities = document.getElementById('new-amenities').value.split(',').map(s => s.trim());

        try {
            const res = await fetch('/api/admin/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type, price, amenities, image_url })
            });

            if (res.ok) {
                alert('Room Created');
                document.getElementById('add-room-modal').style.display = 'none';
                loadRooms();
                loadAnalytics();
            } else {
                alert('Failed to create room');
            }
        } catch (e) {
            alert('Error');
        }
    });

    window.deleteRoom = async (roomId) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/admin/rooms/${roomId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                loadRooms();
                loadAnalytics();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            alert('Error');
        }
    };

    loadAnalytics();
    loadRooms();
});
