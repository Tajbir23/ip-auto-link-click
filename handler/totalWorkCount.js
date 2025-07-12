const fs = require('fs')
const logger = require('./logger')

const totalWorkCount = async () => {
    try {
        const data = fs.readFileSync('workCount.json', 'utf8')
        const workCount = JSON.parse(data)
        
        // Sum up totalCount from each day
        return Object.values(workCount).reduce((total, day) => total + (day.totalCount || 0), 0)
    } catch (error) {
        logger.error(`totalWorkCount.js 11 line - Error reading workCount.json: ${error}`)
        return 0
    }
}

module.exports = totalWorkCount