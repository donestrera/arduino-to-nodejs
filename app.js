const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');

// Express setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

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

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});