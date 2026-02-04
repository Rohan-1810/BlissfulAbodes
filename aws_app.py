import os
import datetime
import boto3
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from flask import g


# Initialize Boto3 Resources (Lazy loading handled by standard AWS SDK usage)
# We assume environment has AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION provided by EC2 Role or Env

# Table Names (Configurable)
TABLE_USERS = os.environ.get('TABLE_USERS', 'Users')
TABLE_ROOMS = os.environ.get('TABLE_ROOMS', 'Rooms')
TABLE_BOOKINGS = os.environ.get('TABLE_BOOKINGS', 'Bookings')
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:539247495126:BlissfullAbodes_topic:fb71ad39-c20d-4143-9255-db6002ccba18'  # REPLACE WITH ACTUAL TOPIC ARN
REGION = os.environ.get('AWS_REGION', 'us-east-1')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
sns_client = boto3.client('sns', region_name=REGION)

class AWSAuthService:
    def __init__(self):
        self.table = dynamodb.Table(TABLE_USERS)

    def register_user(self, name, email, password, role='guest'):
        # Check if user exists (Scan is not efficient but okay for this scale assignment)
        # Production would use a GSI on email
        response = self.table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('email').eq(email)
        )
        if response['Items']:
            return {'error': 'Email already registered'}, 409

        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)
        timestamp = datetime.datetime.utcnow().isoformat()

        item = {
            'userId': user_id,
            'name': name,
            'email': email,
            'passwordHash': password_hash,
            'role': role,
            'createdAt': timestamp
        }

        self.table.put_item(Item=item)
        return {'message': 'User registered successfully', 'userId': user_id}, 201

    def login_user(self, email, password):
        # Scan for email (Again, GSI recommended for prod)
        response = self.table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('email').eq(email)
        )
        items = response.get('Items')
        
        if not items:
            return {'error': 'Invalid credentials'}, 401
        
        user = items[0]

        if not check_password_hash(user['passwordHash'], password):
             return {'error': 'Invalid credentials'}, 401

        # Generate Token (Import inside to avoid circular issues if any)
        import jwt
        from flask import current_app
        token = jwt.encode({
            'user_id': user['userId'],
            'email': user['email'],
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        return {
            'token': token,
            'user': {
                'userId': user['userId'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }, 200

class AWSRoomService:
    def __init__(self):
        self.table = dynamodb.Table(TABLE_ROOMS)

    def create_room(self, room_type, price, amenities, image_url=None):
        room_id = str(uuid.uuid4())
        if not image_url:
            image_url = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80'

        item = {
            'roomId': room_id,
            'type': room_type,
            'price': str(price), # DynamoDB prefers mapping Decimals or Strings for floats usually, but string is safest for currency
            'status': 'Available',
            'amenities': amenities,
            'image_url': image_url
        }
        # In this simple app, we might need price as number for sorting, but Decimal is standard. 
        # Making it Decimal for consistency with boto3 or keep as number if frontend handles it.
        # Ideally: item['price'] = Decimal(str(price))
        # For simplicity in this demo, strict types might be tricky with JSON serialization.
        # Let's simple store as Number type via standard python types
        item['price'] = str(price) # Storing as string to avoid Decimal serialization issues for now, or we implement a JSON encoder.
        # Actually, let's store as native float for standard usage, simplejson handles it usually
        # But boto3 returns Decimals. We need to handle that. 
        # Strategy: Store as string, cast on retrieval or use a DecimalEncoder helper. 
        # Let's stick to simple types.
        
        # NOTE: To fix Decimal JSON serialization, we usually add a custom encoder.
        # For this assignment, we will cast to float/int immediately on retrieval.
        
        self.table.put_item(Item=item)
        return item

    def get_rooms(self, status=None, room_type=None, max_price=None):
        # Scan with Filter
        from boto3.dynamodb.conditions import Attr
        
        filter_exp = None
        
        if status:
            filter_exp = Attr('status').eq(status)
        
        if room_type:
            c = Attr('type').eq(room_type)
            filter_exp = c if not filter_exp else filter_exp & c
            
        if max_price:
            # Price stored as string? or number?
            # If stored as string, comparison is lexicographical (bad for numbers).
            # We will fetch and filter in python for 'max_price' simpler query logic in this assignment context
            pass 

        if filter_exp:
            response = self.table.scan(FilterExpression=filter_exp)
        else:
            response = self.table.scan()
            
        items = response.get('Items', [])
        
        # Manual Filter for Price & Type Conversion
        results = []
        for i in items:
            # Handle Decimal conversion if needed
            if 'price' in i:
                i['price'] = float(i['price'])
            
            if max_price and i['price'] > float(max_price):
                continue
            results.append(i)
            
        return results

    def get_room(self, room_id):
        response = self.table.get_item(Key={'roomId': room_id})
        item = response.get('Item')
        if item and 'price' in item:
            item['price'] = float(item['price'])
        return item

    def update_room(self, room_id, update_data):
        # Construct UpdateExpression
        # For simplicity using put_item to overwrite or just updating status
        # UpdateExpression is better but more verbose
        # Let's do simple get-update-put for assignment clarity
        
        item = self.get_room(room_id)
        if not item:
            return None
        
        for k, v in update_data.items():
            if k == 'price':
                 item[k] = str(v)
            else:
                 item[k] = v
                 
        # remove id from update data if present? no, just put item
        self.table.put_item(Item=item)
        
        if 'price' in item:
            item['price'] = float(item['price'])
        return item

    def delete_room(self, room_id):
        self.table.delete_item(Key={'roomId': room_id})

class AWSBookingService:
    def __init__(self):
        self.bookings_table = dynamodb.Table(TABLE_BOOKINGS)
        self.rooms_table = dynamodb.Table(TABLE_ROOMS)

    def create_booking(self, user_id, room_id, dates):
        # Check room status
        room_resp = self.rooms_table.get_item(Key={'roomId': room_id})
        room = room_resp.get('Item')
        
        if not room:
             return {'error': 'Room not found'}, 404
             
        if room['status'] != 'Available':
             return {'error': 'Room is not available'}, 400
             
        booking_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat()
        
        item = {
            'bookingId': booking_id,
            'userId': user_id,
            'roomId': room_id,
            'dates': dates, 
            'status': 'Confirmed',
            'price': room['price'], # Keep as stored (likely string or Decimal)
            'timestamp': timestamp
        }
        
        self.bookings_table.put_item(Item=item)
        
        # Update Room Status
        self.rooms_table.update_item(
            Key={'roomId': room_id},
            UpdateExpression="set #s = :s",
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':s': 'Booked'}
        )
        
        # Convert price for response
        if 'price' in item:
            item['price'] = float(item['price'])
            
        return item, 201

    def get_user_bookings(self, user_id):
        from boto3.dynamodb.conditions import Attr
        response = self.bookings_table.scan(
            FilterExpression=Attr('userId').eq(user_id)
        )
        items = response.get('Items', [])
        for i in items:
            if 'price' in i: i['price'] = float(i['price'])
        return items

    def get_all_bookings(self):
        response = self.bookings_table.scan()
        items = response.get('Items', [])
        for i in items:
            if 'price' in i: i['price'] = float(i['price'])
        return items

class AWSNotificationService:
    def __init__(self):
        self.sns = sns_client
        self.topic_arn = SNS_TOPIC_ARN

    def send_booking_confirmation(self, email, booking_details):
        if not self.topic_arn:
            print("[AWS] No SNS API Topic ARN configured. Skipping email.")
            return

        message = (
            f"Booking Confirmed!\n\n"
            f"Booking ID: {booking_details['bookingId']}\n"
            f"Room ID: {booking_details['roomId']}\n"
            f"Dates: {booking_details['dates']}\n"
            f"Price: ₹{booking_details['price']}\n\n"
            f"Thank you using Blissful Abodes."
        )
        
        try:
            self.sns.publish(
                TopicArn=self.topic_arn,
                Message=message,
                Subject="Blissful Abodes - Booking Confirmation"
            )
            print(f"[AWS] SNS Notification sent to topic for {email}")
        except Exception as e:
            print(f"[AWS] Failed to send SNS: {e}")

    def subscribe_email(self, email):
        # Optional: Subscribe user logic would go here
        pass

# =========================================================
# SERVICE INJECTION (The Magic Config)
# =========================================================
import app.services.room_service
import app.services.booking_service
import app.services.auth_service
import app.services.notification_service

# Overwrite the Class References in the modules
app.services.room_service.RoomService = AWSRoomService
app.services.booking_service.BookingService = AWSBookingService
app.services.auth_service.AuthService = AWSAuthService
app.services.notification_service.NotificationService = AWSNotificationService

print("✅ AWS Services Injected Successfully")

# =========================================================
# App Execution
# =========================================================
from app import create_app

app = create_app()

if __name__ == '__main__':
    # This is for running on EC2 as 'python aws_app.py' or via Gunicorn 'aws_app:app'
    app.run(host='0.0.0.0', port=5000)
