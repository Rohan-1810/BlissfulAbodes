# Blissful Abodes - Cloud-Based Hotel Booking Platform

Blissful Abodes is a production-ready, cloud-native hotel booking platform built with Flask (Python), Vanilla HTML/CSS/JS, and AWS Services (DynamoDB, SNS, EC2).

## Tech Stack
- **Backend:** Python Flask, Boto3 (AWS SDK)
- **Frontend:** HTML5, CSS3 (No Frameworks), Vanilla JavaScript
- **Database:** Amazon DynamoDB (NoSQL)
- **Notifications:** Amazon SNS (Simple Notification Service)
- **Deployment:** AWS EC2, Nginx, Gunicorn

## Features
- **Guest:** Register/Login, Browse Rooms (Filter by price/type), Book Rooms, Receive Email Confirmation (SNS).
- **Staff:** View Real-time Occupancy, Update Room Status (Available/Booked/Maintenance).
- **Admin:** System Analytics (Revenue, Occupancy), Manage Rooms (Add/Delete), Manage Bookings.

## Setup Instructions

### Prerequisites
- Python 3.8+
- AWS Account & Credentials (with DynamoDB and SNS access)

### Local Development
1. Clone the repository.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up Environment Variables in `.env` (or valid AWS CLI profile):
   ```
   AWS_REGION=us-east-1
   TABLE_USERS=BlissfulAbodes_Users
   TABLE_ROOMS=BlissfulAbodes_Rooms
   TABLE_BOOKINGS=BlissfulAbodes_Bookings
   SNS_TOPIC_ARN=<your-sns-topic-arn>
   SECRET_KEY=dev-key
   ```
4. Initialize Tables (Local or AWS):
   ```bash
   python scripts/create_tables.py
   ```
5. Run the application:
   ```bash
   python run.py
   ```
6. Access at `http://localhost:5000`.

## API Documentation
See `app/api/` folders or `IMPLEMENTATION.md` (if separate) for route details.
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/guests/rooms`
- `POST /api/guests/bookings`
- `PATCH /api/staff/rooms/<id>/status`
- `GET /api/admin/analytics`

## Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for AWS EC2 instructions.
