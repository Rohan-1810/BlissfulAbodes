from flask import Blueprint, request, jsonify, g
from ..services.room_service import RoomService
from ..services.booking_service import BookingService
from ..services.notification_service import NotificationService
from ..utils import token_required

guests_bp = Blueprint('guests', __name__)

@guests_bp.route('/bookings', methods=['POST'])
@token_required
def create_booking():
    data = request.get_json()
    if 'roomId' not in data or 'dates' not in data:
        return jsonify({'error': 'Missing roomId or dates'}), 400
    
    booking_service = BookingService()
    # Pass user_id from token (g.current_user)
    booking, status = booking_service.create_booking(g.current_user['user_id'], data['roomId'], data['dates'])
    
    if status == 201:
        # Send notification
        try:
            notif_service = NotificationService()
            email = g.current_user.get('email')
            if email:
                notif_service.send_booking_confirmation(email, booking)
        except Exception as e:
            print(f"Notification error: {e}")

    return jsonify(booking), status

@guests_bp.route('/bookings/my', methods=['GET'])
@token_required
def get_my_bookings():
    service = BookingService()
    bookings = service.get_user_bookings(g.current_user['user_id'])
    return jsonify(bookings), 200

@guests_bp.route('/rooms', methods=['GET'])
def get_rooms():
    # Filter params
    status = request.args.get('status', 'Available') # Default to available for guests
    room_type = request.args.get('type')
    max_price = request.args.get('max_price')

    service = RoomService()
    rooms = service.get_rooms(status=status, room_type=room_type, max_price=max_price)
    return jsonify(rooms), 200

@guests_bp.route('/rooms/<room_id>', methods=['GET'])
def get_room_details(room_id):
    service = RoomService()
    room = service.get_room(room_id)
    if room:
        return jsonify(room), 200
    return jsonify({'error': 'Room not found'}), 404
