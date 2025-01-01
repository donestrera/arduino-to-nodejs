from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config.config import Config
from werkzeug.middleware.proxy_fix import ProxyFix
import bcrypt
import os
from dotenv import load_dotenv
from functools import wraps

# Load environment variables
load_dotenv()

# Initialize Flask extensions
db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # CORS configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Middleware
    app.wsgi_app = ProxyFix(app.wsgi_app)
    db.init_app(app)
    
    # Error handling
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad Request", "message": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not Found", "message": str(error)}), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal Server Error", "message": str(error)}), 500
    
    with app.app_context():
        db.create_all()
    
    return app

# API version decorator
def api_version(version):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapper
    return decorator

app = create_app()

# Dummy user data (you should replace this with database models)
users_db = {
    "testuser": {
        "username": "testuser",
        "password": "testpassword"  # In real scenarios, passwords should be hashed
    }
}

# Password hashing functions
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

@app.route('/api/v1/register', methods=['POST'])
@api_version('v1')
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({"error": "Missing required fields"}), 400

        if username in users_db:
            return jsonify({"error": "Username already exists"}), 400
        
        hashed_password = hash_password(password)
        users_db[username] = {
            "username": username,
            "password": hashed_password
        }
        
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/login', methods=['POST'])
@api_version('v1')
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({"error": "Missing credentials"}), 400

        user = users_db.get(username)
        if user and check_password(password, user["password"]):
            return jsonify({
                "success": True,
                "message": "Login successful",
                "redirect_url": "/dashboard"
            }), 200
        
        return jsonify({
            "success": False,
            "message": "Invalid credentials"
        }), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(
        debug=os.getenv('FLASK_DEBUG', 'False') == 'True',
        port=int(os.getenv('FLASK_PORT', 5001))
    )