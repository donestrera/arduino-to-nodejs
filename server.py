from flask import Flask, request, jsonify
from flask_cors import CORS
from app.models.user import db, User
import os

app = Flask(__name__)
CORS(app)

# Ensure instance directory exists
os.makedirs('instance', exist_ok=True)

# Database configuration with absolute path
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'instance', 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key'

# Initialize database
db.init_app(app)

# Create database tables
with app.app_context():
    try:
        db.create_all()
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")

@app.route('/api/v1/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({"success": False, "message": "Missing credentials"}), 400

        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
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
        print('Login error:', str(e))
        return jsonify({
            "success": False,
            "message": "An error occurred during login"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)