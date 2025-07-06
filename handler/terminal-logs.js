const path = require('path')
const fs = require('fs');
const logger = require('./logger');


const terminalLogs = async(req, res) => {
    const { lines = 100 } = req.query;
    const logsDir = path.join(__dirname, '..', 'logs');
    
    try {
        // Get today's log file
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `${today}.log`);
        
        if (fs.existsSync(logFile)) {
            // Read last N lines from the file
            const content = fs.readFileSync(logFile, 'utf8');
            const allLines = content.split('\n').filter(line => line.trim());
            const lastLines = allLines.slice(-lines);
            
            res.json({ logs: lastLines });
        } else {
            res.json({ logs: [] });
        }
    } catch (error) {
        logger.error(`terminal-logs.js 26 line - Error reading terminal logs: ${error}`);
        res.status(500).json({ error: 'Error reading logs' });
    }
}

module.exports = terminalLogs