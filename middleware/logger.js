// middleware/logger.js

const winston = require('winston');
const morgan = require('morgan');
const path = require('path');

// Configure Winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'arduino-web-service' },
    transports: [
        // Write all logs with importance level 'error' or less to 'error.log'
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error' 
        }),
        // Write all logs with importance level 'info' or less to 'combined.log'
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log') 
        })
    ]
});

// Add console logging if not in production
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Create custom Morgan token for request body
morgan.token('body', (req) => JSON.stringify(req.body));

// Create custom Morgan format
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :body';

// Create Morgan middleware with Winston
const httpLogger = morgan(morganFormat, {
    stream: {
        write: (message) => logger.info(message.trim())
    }
});

module.exports = {
    logger,
    httpLogger
};