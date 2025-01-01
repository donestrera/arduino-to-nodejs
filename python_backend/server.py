from flask import Flask, request, jsonify
from flask_cors import CORS



app = Flask(__name__)
CORS(app)  # Enable CORS
# Dummy user data (you should replace this with a database)
users_db = {
    "testuser": {
        "username": "testuser",
        "password": "testpassword"  # In real scenarios, passwords should be hashed
    }


}

# Registration endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Check if the username already exists
    if username in users_db:
        return jsonify({"message": "Username already exists!"}), 400
    
    # Add the new user to the "database"
    users_db[username] = {"username": username, "password": password}
    return jsonify({"message": "User registered successfully!"}), 201

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Check if the username exists and if the password matches
    user = users_db.get(username)
    if user and user["password"] == password:
        return jsonify({"message": "Login successful!"}), 200
    return jsonify({"message": "Invalid username or password!"}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5001)