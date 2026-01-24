from flask import Blueprint, request, jsonify
from ..services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    required = ['name', 'email', 'password']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400

    service = AuthService()
    # Default to guest registration; admin creation should be separate or seeded
    response, status = service.register_user(data['name'], data['email'], data['password'], role='guest')
    return jsonify(response), status

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
         return jsonify({'error': 'Missing email or password'}), 400
    
    service = AuthService()
    response, status = service.login_user(data['email'], data['password'])
    return jsonify(response), status
