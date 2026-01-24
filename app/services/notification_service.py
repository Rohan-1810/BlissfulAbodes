class NotificationService:
    def __init__(self):
        # Removed SNS Client
        pass

    def send_booking_confirmation(self, email, booking_details):
        print("--------------------------------------------------")
        print(f"[SIMULATION] Sending Booking Confirmation to: {email}")
        print(f"Booking ID: {booking_details['bookingId']}")
        print(f"Room ID:   {booking_details['roomId']}")
        print(f"Price:     ${booking_details['price']}")
        print("--------------------------------------------------")

    def subscribe_email(self, email):
        print(f"[SIMULATION] Subscribing email {email} to notifications.")
