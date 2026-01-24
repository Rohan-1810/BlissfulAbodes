from flask import Blueprint, request, jsonify
from ..services.room_service import RoomService
from ..utils import staff_required

staff_bp = Blueprint('staff', __name__)

@staff_bp.route('/rooms/<room_id>/status', methods=['PATCH'])
@staff_required
def update_room_status(room_id):
    data = request.get_json()
    if 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
    
    # Validate status (simplified list)
    valid_statuses = ['Available', 'Booked', 'Maintenance']
    if data['status'] not in valid_statuses:
         return jsonify({'error': 'Invalid status'}), 400

    service = RoomService()
    if not service.get_room(room_id):
        return jsonify({'error': 'Room not found'}), 404

    updated = service.update_room(room_id, {'status': data['status']})
    return jsonify(updated), 200

@staff_bp.route('/occupancy', methods=['GET'])
@staff_required
def get_occupancy():
    # Simple occupancy: get all rooms and count
    service = RoomService()
    all_rooms = service.get_rooms(status=None) # Get all
    
    total = len(all_rooms)
    booked = sum(1 for r in all_rooms if r['status'] == 'Booked')
    available = sum(1 for r in all_rooms if r['status'] == 'Available')
    maintenance = sum(1 for r in all_rooms if r['status'] == 'Maintenance')
    
    return jsonify({
        'total': total,
        'booked': booked,
        'available': available,
        'maintenance': maintenance
    }), 200
