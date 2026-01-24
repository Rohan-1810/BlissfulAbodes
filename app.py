from app import create_app
from app.services.auth_service import AuthService
from app.services.room_service import RoomService

app = create_app()

def seed_data():
    """Pre-populate the in-memory DB with roles and rooms for testing."""
    with app.app_context():
        auth_service = AuthService()
        room_service = RoomService()
        
        # Check if already seeded (not strictly necessary for in-memory, but good practice)
        from app.db import users
        if users: return 

        print("🌱 Seeding data...")
        
        # Create Admin
        try:
            auth_service.register_user('System Admin', 'admin@blissful.com', 'admin123', role='admin')
            print("   - Created Admin: admin@blissful.com / admin123")
        except: pass

        # Create Staff
        try:
            auth_service.register_user('Hotel Staff', 'staff@blissful.com', 'staff123', role='staff')
            print("   - Created Staff: staff@blissful.com / staff123")
        except: pass
        
        # Create Guest
        try:
            auth_service.register_user('John Guest', 'guest@blissful.com', 'guest123', role='guest')
            print("   - Created Guest: guest@blissful.com / guest123")
        except: pass

        # Create Sample Rooms
        room_service.create_room('Deluxe Suite', 15000.0, ['Ocean View', 'Wifi', 'Mini Bar'], 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')
        room_service.create_room('Standard King', 5000.0, ['Wifi', 'TV'], 'https://images.unsplash.com/photo-1590490360182-f33efe29a795?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')
        print("   - Created sample rooms.")
        print("🌱 Seeding complete.\n")

if __name__ == '__main__':
    seed_data()
    app.run(debug=True, host='0.0.0.0', port=5000)
