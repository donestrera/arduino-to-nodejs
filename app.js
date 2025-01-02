const express = require('express');
const session = require('express-session');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const port = process.env.PORT || 3000;
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Serial Port configuration
const serialPort = new SerialPort.SerialPort({
    path: '/dev/cu.usbserial-110', // Change this to your Arduino port
    baudRate: 9600
});

const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

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

// Arduino data handling
parser.on('data', (data) => {
    console.log('Arduino Data:', data);
    io.emit('data', data);
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

// Start server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});