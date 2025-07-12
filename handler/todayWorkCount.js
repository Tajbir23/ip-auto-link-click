const fs = require('fs')
const logger = require('./logger')

const todayWorkCount = async () => {
    try {
        const data = fs.readFileSync('workCount.json', 'utf8')
        const workCount = JSON.parse(data)
        const today = new Date().toISOString().split('T')[0]
        
        // Return totalCount for today if exists, otherwise 0
        return workCount[today]?.totalCount || 0
    } catch (error) {
        logger.error(`todayWorkCount.js 12 line - Error reading workCount.json: ${error}`)
        try {
            // Create file if it doesn't exist
            fs.writeFileSync('workCount.json', JSON.stringify({}))
            return 0
        } catch (error) {
            logger.error(`todayWorkCount.js 18 line - Error writing to workCount.json: ${error}`)
            return 0
        }
    }
}

module.exports = todayWorkCount