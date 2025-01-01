# app/__init__.py

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config.config import Config
import os

db = SQLAlchemy()

def create_app(config_class=Config):
    # Create Flask app with the correct static folder path
    app = Flask(__name__, static_folder='../public')
    app.config.from_object(config_class)
    
    CORS(app)
    db.init_app(app)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)
    
    # Add a route to serve your HTML files from the public folder
    @app.route('/')
    def serve_login():
        return send_from_directory('../public', 'login.html')
        
    @app.route('/<path:path>')
    def serve_public(path):
        return send_from_directory('../public', path)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app