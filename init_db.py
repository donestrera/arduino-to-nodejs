from flask import Flask
from app.models.user import db, User
from config import Config
import os

def init_database():
    app = Flask(__name__)
    
    # Configure the Flask app
    app.config.from_object(Config)
    
    # Initialize the database with the app
    db.init_app(app)

    # Create the database tables within the application context
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database initialized successfully!")

        # Create a test user
        try:
            # Check if test user already exists
            existing_user = User.query.filter_by(username='test4user').first()
            if not existing_user:
                test_user = User(username='test4user')
                test_user.set_password('test4password')
                db.session.add(test_user)
                db.session.commit()
                print("Test user created successfully!")
            else:
                print("Test user already exists!")
        except Exception as e:
            print(f"Error creating test user: {e}")
            db.session.rollback()

if __name__ == '__main__':
    # Create instance directory if it doesn't exist
    os.makedirs('instance', exist_ok=True)
    init_database() 