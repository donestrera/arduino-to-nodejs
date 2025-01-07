const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const NodeWebcam = require('node-webcam');

// Express setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Arduino Serial Port Configuration
const portPath = '/dev/cu.usbserial-110'; // Update this to match your Arduino port
const baudRate = 9600;

// Create Serial Port instance
const serialPort = new SerialPort({
    path: portPath,
    baudRate: baudRate
});

// Create parser
const parser = new ReadlineParser();
serialPort.pipe(parser);

// Webcam configuration
const webcamOptions = {
    width: 1280,
    height: 720,
    quality: 100,
    delay: 0,
    saveShots: false,
    output: "jpeg",
    device: false,
    callbackReturn: "buffer"
};

const Webcam = NodeWebcam.create(webcamOptions);

// WebSocket Communication
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.emit('connectionStatus', { status: 'connected' });
    
    // Identify if this is the main computer
    socket.on('registerAsMain', () => {
        console.log('Main computer registered');
        socket.isMainComputer = true;
        socket.broadcast.emit('mainComputerStatus', { connected: true });
    });

    // Handle webcam frames from main computer
    socket.on('webcamFrame', (data) => {
        if (socket.isMainComputer) {
            // Broadcast frame to all clients except sender
            socket.broadcast.emit('receiveWebcamFrame', data);
        }
    });

    // Handle Arduino commands with validation
    socket.on('sendToArduino', (command) => {
        if (!command || typeof command !== 'string') {
            console.error('Invalid command format');
            socket.emit('error', { message: 'Invalid command format' });
            return;
        }

        console.log(`Sending to Arduino: ${command}`);
        if (serialPort.isOpen) {
            serialPort.write(`${command}\n`, (err) => {
                if (err) {
                    console.error('Error writing to serial port:', err);
                    socket.emit('error', { message: 'Failed to send command' });
                }
            });
        } else {
            console.error('Serial port is not open');
            socket.emit('error', { message: 'Device not connected' });
        }
    });

    socket.on('disconnect', () => {
        if (socket.isMainComputer) {
            io.emit('mainComputerStatus', { connected: false });
        }
        console.log('Client disconnected');
    });
});

// Handle data from Arduino with improved error handling
parser.on('data', (data) => {
    try {
        const parsedData = JSON.parse(data.trim());
        console.log('Received from Arduino:', parsedData);
        
        // Validate data structure
        if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Invalid data format');
        }
        
        io.emit('arduinoData', parsedData);
    } catch (error) {
        console.error('Error parsing Arduino data:', error.message);
        console.log('Raw data received:', data);
        io.emit('error', { message: 'Error processing device data' });
    }
});

// Error handling for serial port
serialPort.on('error', (err) => {
    console.error(`Serial port error: ${err.message}`);
    // Attempt to reconnect
    setTimeout(() => {
        if (!serialPort.isOpen) {
            serialPort.open((err) => {
                if (err) {
                    console.error('Failed to reconnect:', err.message);
                } else {
                    console.log('Successfully reconnected to serial port');
                }
            });
        }
    }, 5000);
});

// Authentication routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    if (req.session.authenticated) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }

    try {
        const response = await axios.post('http://127.0.0.1:5001/api/v1/login', {
            username,
            password
        });

        if (response.data.success) {
            req.session.authenticated = true;
            req.session.user = username;
            
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error saving session'
                    });
                }
                res.json({
                    success: true,
                    message: 'Login successful',
                    redirect_url: '/dashboard'
                });
            });
        } else {
            res.json(response.data);
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            res.status(503).json({
                success: false,
                message: 'Authentication service unavailable'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
});

// Add after all routes in app.js
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});