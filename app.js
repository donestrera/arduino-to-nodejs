const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const SerialPort = require('serialport');
const { ReadlineParser } = SerialPort.parsers;
const path = require('path');

// Express setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files (e.g., index.html)
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Arduino Serial Port Configuration
const portPath = '/dev/tty.wchusbserialfa1410'; // Replace with your Arduino port
const baudRate = 9600;

const serialPort = new SerialPort(portPath, { baudRate }, (err) => {
    if (err) {
        console.error(`Failed to open port: ${err.message}`);
        return;
    }
    console.log(`Connected to Arduino on ${portPath} at ${baudRate} baud.`);
});

const parser = new ReadlineParser({ delimiter: '\r\n' });
serialPort.pipe(parser);

// WebSocket Communication
io.on('connection', (socket) => {
    console.log('Client connected');

    // Receive commands from the client and send them to Arduino
    socket.on('sendToArduino', (command) => {
        console.log(`Sending to Arduino: ${command}`);
        if (serialPort.isOpen) {
            serialPort.write(`${command}\n`, (err) => {
                if (err) {
                    console.error(`Error writing to Arduino: ${err.message}`);
                }
            });
        } else {
            console.error('Serial port is not open.');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Handle data from Arduino and broadcast it to clients
parser.on('data', (data) => {
    console.log(`Received from Arduino: ${data}`);
    io.emit('arduinoData', data); // Broadcast to all connected clients
});

// Error handling
serialPort.on('error', (err) => {
    console.error(`Serial port error: ${err.message}`);
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});