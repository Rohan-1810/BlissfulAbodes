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
            
            document.getElementById('anl-revenue').innerText = '₹' + data.total_revenue;
            document.getElementById('anl-occupancy').innerText = data.occupancy_rate + '%';
            document.getElementById('anl-bookings').innerText = data.total_bookings;
            document.getElementById('anl-rooms').innerText = data.total_rooms;
        } catch (e) {
            console.error(e);
        }
    }

    let currentRooms = [];

    async function loadRooms() {
        const tbody = document.getElementById('admin-rooms-list');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
        
        try {
            const res = await fetch('/api/guests/rooms', { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            currentRooms = await res.json();
            renderTable(currentRooms);
        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading rooms</td></tr>';
        }
    }

    function renderTable(rooms) {
        const tbody = document.getElementById('admin-rooms-list');
        tbody.innerHTML = '';
        
        if (rooms.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No rooms found</td></tr>';
            return;
        }

        rooms.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${r.type}</strong><br>
                    <small style="color:#95a5a6">${r.amenities.slice(0, 2).join(', ')}...</small>
                </td>
                <td>₹${r.price}</td>
                <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-accent btn-sm" onclick="deleteRoom('${r.roomId}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Search Logic
    const searchInput = document.getElementById('room-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = currentRooms.filter(r => 
                r.type.toLowerCase().includes(term) || 
                r.status.toLowerCase().includes(term)
            );
            renderTable(filtered);
        });
    }

    // Sort Logic
    window.sortTable = (n) => {
        // Simple client-side sort for demo
        const isAsc = searchInput.dataset.order === 'asc';
        currentRooms.sort((a, b) => {
            let valA = n === 0 ? a.type : a.price;
            let valB = n === 0 ? b.type : b.price;
            if (valA < valB) return isAsc ? -1 : 1;
            if (valA > valB) return isAsc ? 1 : -1;
            return 0;
        });
        searchInput.dataset.order = isAsc ? 'desc' : 'asc';
        renderTable(currentRooms);
    };

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
