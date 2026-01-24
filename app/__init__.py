from flask import Flask
from .config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Register Blueprints (will be imported after they are created to avoid circular imports during setup)
    from .api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from .api.guests import guests_bp
    from .api.staff import staff_bp
    from .api.admin import admin_bp

    app.register_blueprint(guests_bp, url_prefix='/api/guests')
    app.register_blueprint(staff_bp, url_prefix='/api/staff')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Main frontend routes
    from flask import render_template
    
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/login')
    def login_page():
        return render_template('login.html')

    @app.route('/register')
    def register_page():
        return render_template('register.html')

    @app.route('/guest/dashboard')
    def guest_dashboard():
        return render_template('guest/dashboard.html')

    @app.route('/staff/dashboard')
    def staff_dashboard():
        return render_template('staff/dashboard.html')

    @app.route('/admin/dashboard')
    def admin_dashboard():
        return render_template('admin/dashboard.html')

    return app
