const fs = require('fs')
const logger = require('./logger')

const totalWorkCount = async () => {
    try {
        const data = fs.readFileSync('workCount.json', 'utf8')
        const workCount = JSON.parse(data)
        return Object.values(workCount).reduce((total, day) => total + day.count, 0)
    } catch (error) {
        logger.error('Error reading workCount.json:', error)
        return 0
    }
}

module.exports = totalWorkCount