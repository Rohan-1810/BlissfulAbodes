# Blissful Abodes - Hotel Booking System

**Blissful Abodes** is a fully functional cloud-based hotel booking application. It is designed to demonstrate a modern, role-based booking system supporting **Guests**, **Staff**, and **Admins**.

The project features a **Dual-Architecture** design that allows it to run completely locally (using in-memory data) or strictly on AWS (using DynamoDB and SNS), with zero code changes to the core logic.

---

## 1. Architecture Overview

To ensure safety and modularity, the application has two distinct entry points:

### `app.py` (Local Deployment)
-   **Purpose:** Local development and testing.
-   **Data Storage:** In-memory mock dictionaries (Simulates a database).
-   **Notifications:** Console print simulation.
-   **Dependencies:** No AWS usage. Runs purely on Python/Flask.

### `aws_app.py` (AWS Deployment)
-   **Purpose:** Production deployment on AWS EC2.
-   **Data Storage:** **AWS DynamoDB** (Users, Rooms, Bookings).
-   **Notifications:** **AWS SNS** (Email confirmations).
-   **Dependencies:** `boto3`, `gunicorn`.
-   **Mechanism:** Uses "Service Injection" to swap the local data layer with AWS-connected services at runtime, leaving `app.py` untouched.

---

## 2. Technologies Used

-   **Language:** Python 3.10+
-   **Backend Framework:** Flask
-   **Frontend:** HTML5, CSS3, Vanilla JavaScript (No heavy frameworks)
-   **Cloud Provider:** Amazon Web Services (AWS)
    -   **EC2:** Hosting the application code.
    -   **DynamoDB:** NoSQL Database for persistence.
    -   **SNS:** Sending booking confirmation emails.
    -   **IAM:** Managing secure access via Roles (No hardcoded keys).

---

## 3. Authentication Mechanism

The application uses a **stateless authentication system**:

-   **Method:** **JWT (JSON Web Tokens)**.
-   **Flow:**
    1.  User logins via API.
    2.  Server verifies credentials and issues a signed JWT.
    3.  Client stores JWT in `localStorage`.
    4.  Client sends JWT in the `Authorization` header for protected routes.
-   **Why:** Ensures consistency between Local and AWS environments (Session-free) and provides better scalability.
-   **Flask Session:** NOT used for authentication.

---

## 4. Database Design (DynamoDB)

For the AWS deployment, the application connects to **existing** DynamoDB tables. No table creation logic exists in the code (as per strict security rules).

### Tables Configuration
1.  **Users**
    -   **Partition Key:** `userId` (String)
    -   **Purpose:** Stores user profiles and password hashes.
2.  **Rooms**
    -   **Partition Key:** `roomId` (String)
    -   **Purpose:** Manage room inventory, prices, and amenities.
3.  **Bookings**
    -   **Partition Key:** `bookingId` (String)
    -   **Purpose:** Tracks reservations and status.

---

## 5. AWS Services Usage

### Compute: EC2
-   The Flask app runs on an EC2 instance (Linux).
-   Served via **Gunicorn** (WSGI Server) for production readiness.

### Security: IAM Roles
-   **No AWS Keys are stored in the code.**
-   An **IAM Role** with `AmazonDynamoDBFullAccess` and `AmazonSNSFullAccess` is attached directly to the EC2 instance.
-   `boto3` automatically retrieves temporary credentials from the instance metadata.

### Notifications: SNS
-   **Topic:** Manual SNS Topic created via Console.
-   **Topic ARN:** Configured as a constant in `aws_app.py`.
-   **Trigger:** When a booking is confirmed, an email is published to this topic.

---

## 6. Local Deployment Instructions

1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Run Application:**
    ```bash
    python app.py
    ```

3.  **Access:**
    Open `http://localhost:5000` in your browser.
    *Note: Data will reset when the server restarts.*

---

## 7. AWS Deployment Instructions

**Prerequisites:**
-   EC2 Instance running with Python 3 installed.
-   IAM Role attached to EC2.
-   DynamoDB tables created manually (`Users`, `Rooms`, `Bookings`).
-   SNS Topic created and ARN updated in `aws_app.py`.

**Steps:**
1.  **Connect to EC2** via SSH.
2.  **Clone/Copy Code** to the instance.
3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Run Application (Dev Mode):**
    ```bash
    python aws_app.py
    ```
5.  **Run Application (Production Mode):**
    ```bash
    gunicorn -w 4 -b 0.0.0.0:5000 aws_app:app
    ```

---

## 8. Project Structure

```
BlissfulAbodes/
├── app/
│   ├── api/            # Route controllers (Guests, Staff, Admin)
│   ├── services/       # Business Logic (Local Implementation)
│   ├── static/         # CSS, JS, Images
│   ├── templates/      # Jinja2 HTML Templates
│   ├── __init__.py     # Flask App Factory
│   └── utils.py        # Auth Decorators
├── app.py              # ENTRY POINT: Local Deployment
├── aws_app.py          # ENTRY POINT: AWS Deployment (Injects Cloud Logic)
├── requirements.txt    # Python Dependencies
└── README.md           # Documentation
```

---

## 9. Notes for Evaluation

-   **Why Manual Resources?**
    Infrastructure-as-Code (Terraform/CDK) was intentionally avoided to demonstrate understanding of **AWS Console operations** and **IAM Role attachment** mechanics during the viva.

-   **Why Two Entry Points?**
    To satisfy the requirement of "Keeping the local version safe and untouched." `aws_app.py` acts as an adapter that hot-swaps the storage layer only when running in the cloud.

-   **Security:**
    Strict adherence to the "No Hardcoded Credentials" rule is maintained by leveraging EC2 Instance Profiles (IAM Roles).
