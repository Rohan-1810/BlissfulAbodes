# AWS Deployment Guide - Blissful Abodes

## 1. Launch EC2 Instance
1. Log in to AWS Console.
2. Launch a new **EC2 Instance** (Ubuntu 22.04 LTS recommended).
3. Configure Security Group:
   - Allow **SSH (22)** from your IP.
   - Allow **HTTP (80)** and **HTTPS (443)** from Anywhere (0.0.0.0/0).
4. Attach an **IAM Role** with `AmazonDynamoDBFullAccess` and `AmazonSNSFullAccess`.

## 2. Server Setup (SSH into EC2)
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx -y
```

## 3. Clone & Configure Application
```bash
git clone <your-repo-url> /home/ubuntu/BlissfulAbodes
cd /home/ubuntu/BlissfulAbodes

# Create Virtual Env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 4. Gunicorn Configuration
Create a systemd service file: `sudo nano /etc/systemd/system/blissful.service`

```ini
[Unit]
Description=Gunicorn instance to serve Blissful Abodes
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/BlissfulAbodes
Environment="PATH=/home/ubuntu/BlissfulAbodes/venv/bin"
Environment="AWS_REGION=us-east-1"
Environment="SECRET_KEY=prod-secret-key"
# Add other env vars here (TABLE_NAMES, etc.)
ExecStart=/home/ubuntu/BlissfulAbodes/venv/bin/gunicorn --workers 3 --bind unix:blissful.sock -m 007 run:app

[Install]
WantedBy=multi-user.target
```

Start and enable the service:
```bash
sudo systemctl start blissful
sudo systemctl enable blissful
```

## 5. Nginx Configuration
Create config: `sudo nano /etc/nginx/sites-available/blissful`

```nginx
server {
    listen 80;
    server_name your_domain_or_public_ip;

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/BlissfulAbodes/blissful.sock;
    }
}
```

Enable link and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/blissful /etc/nginx/sites-enabled
sudo systemctl restart nginx
```

## 6. Database Setup
Run the table creation script from the EC2 instance (uses attached IAM role):
```bash
source venv/bin/activate
python scripts/create_tables.py
```

## 7. SNS Setup
1. Create a Topic in AWS SNS console.
2. Add the ARN to the environment variables in `blissful.service` or `.env`.
3. (Optional) Run a script to subscribe users or manually subscribe test emails.
