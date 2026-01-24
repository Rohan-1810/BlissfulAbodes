import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
from ..db import users, get_next_id, find_user_by_email

class AuthService:
    def __init__(self):
        # cloud dependencies removed
        pass

    def register_user(self, name, email, password, role='guest'):
        if role not in ['guest', 'staff', 'admin']:
            return {'error': 'Invalid role'}, 400

        # Check if email exists
        if find_user_by_email(email):
            return {'error': 'Email already registered'}, 409

        user_id = get_next_id('users')
        password_hash = generate_password_hash(password)

        new_user = {
            'userId': user_id,
            'name': name,
            'email': email,
            'passwordHash': password_hash,
            'role': role,
            'createdAt': datetime.datetime.utcnow().isoformat()
        }

        # Save to in-memory dict
        users[user_id] = new_user
        
        return {'message': 'User registered successfully', 'userId': user_id}, 201

    def login_user(self, email, password):
        user = find_user_by_email(email)

        if not user:
            return {'error': 'Invalid credentials'}, 401
        
        # Verify password
        if not check_password_hash(user['passwordHash'], password):
             return {'error': 'Invalid credentials'}, 401

        # Generate JWT (keep this logic as requested)
        import jwt
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
