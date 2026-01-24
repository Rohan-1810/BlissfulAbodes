import datetime
from flask import current_app
from ..db import bookings, rooms, get_next_id, find_bookings_by_user

class BookingService:
    def __init__(self):
        pass
        
    def create_booking(self, user_id, room_id, dates):
        # 1. Check room availability
        room = rooms.get(room_id)
        
        if not room:
            return {'error': 'Room not found'}, 404
        
        if room['status'] != 'Available':
            return {'error': 'Room is not available'}, 400
        
        booking_id = get_next_id('bookings')
        timestamp = datetime.datetime.utcnow().isoformat()
        
        item = {
            'bookingId': booking_id,
            'userId': user_id,
            'roomId': room_id,
            'dates': dates, 
            'status': 'Confirmed',
            'price': room['price'],
            'timestamp': timestamp
        }
        
        # 3. Save booking
        bookings[booking_id] = item
        
        # 4. Update room status to Booked
        room['status'] = 'Booked'
        rooms[room_id] = room # In-memory dict reference, line above actually modifies it, but good to be explicit if structure changes
        
        return item, 201

    def get_user_bookings(self, user_id):
        return find_bookings_by_user(user_id)

    def get_all_bookings(self):
        return list(bookings.values())
