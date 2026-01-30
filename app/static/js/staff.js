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
    // Load Rooms for Status Update
    async function loadRooms() {
        const tbody = document.getElementById('rooms-list');
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Loading...</td></tr>';

        try {
            // Staff needs to see all rooms, so we filter nothing
            const res = await fetch('/api/guests/rooms', { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const rooms = await res.json();
            
            tbody.innerHTML = '';
            rooms.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <strong>${r.type}</strong><br>
                        <small style="color:#bdc3c7">ID: ${r.roomId.substring(0,8)}</small>
                    </td>
                    <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
                    <td>
                        <select onchange="updateStatus('${r.roomId}', this.value)" class="form-control" style="width:auto; display:inline-block;">
                            <option value="" disabled selected>Change Status...</option>
                            <option value="Available">Available</option>
                            <option value="Booked">Booked</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Error loading rooms.</td></tr>';
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
