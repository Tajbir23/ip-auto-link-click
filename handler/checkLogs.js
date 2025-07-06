const path = require('path')
const fs = require('fs')
const logger = require('./logger')


const checkLogs = async (req, res) => {
    const logsDir = path.join(__dirname, '..', 'logs')
    const { date, level, startTime, endTime } = req.query

    try {
        // Get list of log files
        const files = fs.readdirSync(logsDir)

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0]

        // Default to today's log and ERROR level if no filters specified
        const selectedDate = date || today
        const selectedLevel = level || 'ERROR'
        const logFile = path.join(logsDir, `${selectedDate}.log`)

        let logs = []
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf8')
            logs = content.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const match = line.match(/\[(.*?)\] \[(.*?)\] (.*)/)
                    if (match) {
                        const timestamp = match[1]
                        const time = timestamp.split('T')[1].split('.')[0] // Extract HH:mm:ss
                        return {
                            timestamp,
                            time,
                            level: match[2],
                            message: match[3]
                        }
                    }
                    return null
                })
                .filter(log => log !== null)
        }

        // Filter by log level if specified
        if (selectedLevel !== 'ALL') {
            logs = logs.filter(log => log.level.toLowerCase() === selectedLevel.toLowerCase())
        }

        // Filter by time range if specified
        if (startTime && endTime) {
            logs = logs.filter(log => {
                return log.time >= startTime && log.time <= endTime
            })
        }

        // Get available dates from log files
        const dates = files
            .filter(file => file.endsWith('.log'))
            .map(file => file.replace('.log', ''))
            .sort()
            .reverse()

        res.render('checkLogs', {
            logs,
            dates,
            selectedDate,
            selectedLevel,
            startTime: startTime || '',
            endTime: endTime || ''
        })
    } catch (error) {
        logger.error('Error reading logs:', error)
        res.status(500).send('Error reading logs')
    }
}

module.exports = checkLogs