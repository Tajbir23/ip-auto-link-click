const fs = require('fs')

const totalWorkCount = () => {
    try {
        if (!fs.existsSync('workCount.json')) {
            return 0
        }
        const data = fs.readFileSync('workCount.json', 'utf8')
        const jsonData = JSON.parse(data)
        
        // Sum up all counts from each date
        const total = Object.values(jsonData).reduce((sum, dateData) => {
            return sum + (dateData.count || 0)
        }, 0)
        
        return total
    } catch (error) {
        console.error('Error reading workCount.json:', error)
        return 0
    }
}

module.exports = totalWorkCount