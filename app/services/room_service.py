from flask import current_app
from ..db import rooms, get_next_id, get_all_rooms

class RoomService:
    def __init__(self):
        pass

    def create_room(self, room_type, price, amenities, image_url=None):
        room_id = get_next_id('rooms')
        if not image_url:
            image_url = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80'

        item = {
            'roomId': room_id,
            'type': room_type,
            'price': float(price), # Store as float locally
            'status': 'Available',
            'amenities': amenities,
            'image_url': image_url
        }
        rooms[room_id] = item
        return item

    def get_rooms(self, status=None, room_type=None, max_price=None):
        all_rooms = get_all_rooms()
        results = []
        
        for r in all_rooms:
            if status and r['status'] != status:
                continue
            if room_type and r['type'] != room_type:
                continue
            if max_price and r['price'] > float(max_price):
                continue
            results.append(r)
            
        return results

    def get_room(self, room_id):
        return rooms.get(room_id)

    def update_room(self, room_id, update_data):
        if room_id not in rooms:
            return None
        
        curr = rooms[room_id]
        
        # Apply updates
        for k, v in update_data.items():
            # Basic validation/type conversion if needed
            if k == 'price':
                 curr[k] = float(v)
            else:
                 curr[k] = v
        
        rooms[room_id] = curr
        return curr

    def delete_room(self, room_id):
        if room_id in rooms:
            del rooms[room_id]
