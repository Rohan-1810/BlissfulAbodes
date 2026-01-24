document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || (role !== 'staff' && role !== 'admin')) {
        window.location.href = '/login';
    }

    // Load Occupancy
    async function loadOccupancy() {
        try {
            const res = await fetch('/api/staff/occupancy', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            document.getElementById('stat-total').innerText = data.total;
            document.getElementById('stat-booked').innerText = data.booked;
            document.getElementById('stat-available').innerText = data.available;
            document.getElementById('stat-maintenance').innerText = data.maintenance;
        } catch (e) {
            console.error('Failed to load occupancy', e);
        }
    }

    // Load Rooms for Status Update
    async function loadRooms() {
        const container = document.getElementById('rooms-list');
        try {
            // Staff needs to see all rooms, so we filter nothing or specifically ask for all
            // Ideally backend 'get_rooms' returns all if no filter.
            const res = await fetch('/api/guests/rooms', { // Reusing guest API without filters returns all
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rooms = await res.json();
            
            container.innerHTML = '';
            rooms.forEach(r => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-body">
                        <h4 class="card-title">${r.type} <small>(ID: ${r.roomId.substring(0,4)})</small></h4>
                        <div class="card-price">Current Status: 
                            <span class="badge badge-${r.status.toLowerCase()}">${r.status}</span>
                        </div>
                        <div style="margin-top: 1rem;">
                            <label>Update Status:</label>
                            <select onchange="updateStatus('${r.roomId}', this.value)" class="form-control" style="margin-bottom: 0.5rem;">
                                <option value="" disabled selected>Select...</option>
                                <option value="Available">Available</option>
                                <option value="Booked">Booked</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = '<p>Error loading rooms.</p>';
        }
    }

    window.updateStatus = async (roomId, newStatus) => {
        if (!newStatus) return;
        try {
            const res = await fetch(`/api/staff/rooms/${roomId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (res.ok) {
                // simple reload
                loadOccupancy();
                loadRooms();
                alert('Status updated');
            } else {
                alert('Update failed');
            }
        } catch(e) {
            alert('Error updating status');
        }
    };

    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadOccupancy();
        loadRooms();
    });

    loadOccupancy();
    loadRooms();
});
