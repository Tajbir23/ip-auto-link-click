const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, '..', 'logs');
        this.currentDate = null;
        this.logStream = null;
        this.ensureLogsDirectory();
    }

    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    getLogFileName() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}.log`;
    }

    checkAndUpdateStream() {
        const today = new Date().toDateString();
        if (this.currentDate !== today) {
            // Close existing stream if it exists
            if (this.logStream) {
                this.logStream.end();
            }

            // Create new stream for today
            const logFile = path.join(this.logsDir, this.getLogFileName());
            this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
            this.currentDate = today;
        }
    }

    formatMessage(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}\n`;
    }

    log(message, level = 'INFO') {
        this.checkAndUpdateStream();
        const formattedMessage = this.formatMessage(message, level);
        
        // Only write to file, not to console
        this.logStream.write(formattedMessage);
    }

    info(message) {
        this.log(message, 'INFO');
    }

    error(message) {
        this.log(message, 'ERROR');
    }

    warn(message) {
        this.log(message, 'WARN');
    }

    // Clean up method to be called when the application exits
    cleanup() {
        if (this.logStream) {
            this.logStream.end();
        }
    }
}

// Create and export a singleton instance
const logger = new Logger();

// Register cleanup on process exit
process.on('exit', () => {
    logger.cleanup();
});

// Also handle other termination signals
process.on('SIGINT', () => {
    logger.cleanup();
    process.exit();
});

process.on('SIGTERM', () => {
    logger.cleanup();
    process.exit();
});

module.exports = logger; 