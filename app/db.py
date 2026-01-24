# In-memory "Database"
ids = {
    'users': 0,
    'rooms': 0,
    'bookings': 0
}

users = {}     # Key: userId
rooms = {}     # Key: roomId
bookings = {}  # Key: bookingId

def get_next_id(collection_name):
    # UUIDs are also fine, but simple ints are easier to debug locally if desired.
    # The prompt says "IDs can be integers or UUIDs". 
    # Let's stick to UUIDs to minimize code changes in services (which expect strings).
    import uuid
    return str(uuid.uuid4())

# Mock index helpers
def find_user_by_email(email):
    for u in users.values():
        if u.get('email') == email:
            return u
    return None

def find_bookings_by_user(user_id):
    return [b for b in bookings.values() if b.get('userId') == user_id]

def get_all_rooms():
    return list(rooms.values())
