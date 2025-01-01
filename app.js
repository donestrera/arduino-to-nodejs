const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const http = require('http');
const axios = require('axios');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');

// Express setup
const app = express();
const server = http.createServer(app);

// Static files
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Middleware
const sessionMiddleware = session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
});

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO setup
const io = new Server(server);

// Wrap session middleware for Socket.IO
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// Routes
app.get('/', (req, res) => {
    if (req.session.authenticated) {
        res.redirect('/dashboard');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Serve register.html on /register
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
 

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const response = await axios.post('http://127.0.0.1:5001/login', {
            username,
            password,
        });

        if (response.data.success) {
            req.session.authenticated = true;
            req.session.user = username;
            res.json({ 
                success: true, 
                redirect: '/dashboard'
            });
        } else {
            res.json(response.data);
        }
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const response = await axios.post('http://127.0.0.1:5001/register', {
            username,
            password,
        });

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

app.get('/dashboard', (req, res) => {
    if (req.session.authenticated) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/');
    }
});

// Arduino Serial Port Configuration
const portPath = '/dev/cu.usbserial-110'; // Update this to match your Arduino port
const baudRate = 9600;

// Create Serial Port instance
const serialPort = new SerialPort({
    path: portPath,
    baudRate: baudRate
});

const parser = new ReadlineParser();
serialPort.pipe(parser);

// Socket.IO connection handling
// WebSocket Communication
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('sendToArduino', (command) => {
        console.log(`Sending to Arduino: ${command}`);
        if (serialPort.isOpen) {
            serialPort.write(`${command}\n`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
// Handle data from Arduino with proper error handling
parser.on('data', (data) => {
    try {
        const parsedData = JSON.parse(data.trim());
        console.log('Received from Arduino:', parsedData);
        io.emit('arduinoData', parsedData);
    } catch (error) {
        console.error('Error parsing Arduino data:', error.message);
        console.log('Raw data received:', data);
    }
});

// Error handling for serial port
serialPort.on('error', (err) => {
    console.error(`Serial port error: ${err.message}`);
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});