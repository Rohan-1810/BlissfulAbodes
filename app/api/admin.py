from flask import Blueprint, request, jsonify
from ..services.room_service import RoomService
from ..services.booking_service import BookingService
from ..utils import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/bookings', methods=['GET'])
@admin_required
def get_all_bookings():
    service = BookingService()
    bookings = service.get_all_bookings()
    return jsonify(bookings), 200

@admin_bp.route('/analytics', methods=['GET'])
@admin_required
def get_analytics():
    # 1. Occupancy
    room_service = RoomService()
    rooms = room_service.get_rooms()
    total_rooms = len(rooms)
    booked_rooms = sum(1 for r in rooms if r['status'] == 'Booked')
    occupancy_rate = (booked_rooms / total_rooms * 100) if total_rooms > 0 else 0

    # 2. Revenue & Bookings
    booking_service = BookingService()
    bookings = booking_service.get_all_bookings()
    total_bookings = len(bookings)
    
    # Calculate revenue (sum of price for confirmed bookings)
    # DynamoDB Decimal needs conversion to float for JSON
    total_revenue = 0
    for b in bookings:
        if b.get('status') == 'Confirmed':
            total_revenue += float(b.get('price', 0))

    return jsonify({
        'occupancy_rate': round(occupancy_rate, 2),
        'total_bookings': total_bookings,
        'total_revenue': total_revenue,
        'total_rooms': total_rooms
    }), 200

@admin_bp.route('/rooms', methods=['POST'])
@admin_required
def create_room():
    data = request.get_json()
    required = ['type', 'price', 'amenities']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    service = RoomService()
    room = service.create_room(data['type'], data['price'], data['amenities'], data.get('image_url'))
    return jsonify(room), 201

@admin_bp.route('/rooms/<room_id>', methods=['PUT'])
@admin_required
def update_room(room_id):
    data = request.get_json()
    service = RoomService()
    
    # Check if room exists
    if not service.get_room(room_id):
        return jsonify({'error': 'Room not found'}), 404

    updated_attributes = service.update_room(room_id, data)
    if updated_attributes:
        return jsonify(updated_attributes), 200
    return jsonify({'error': 'Update failed'}), 500

@admin_bp.route('/rooms/<room_id>', methods=['DELETE'])
@admin_required
def delete_room(room_id):
    service = RoomService()
    service.delete_room(room_id)
    return jsonify({'message': 'Room deleted'}), 200
