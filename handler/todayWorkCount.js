const fs = require('fs')

const todayWorkCount = () => {
    const today = new Date()
    const dateKey = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`

    if (!fs.existsSync('workCount.json')) {
        return 0
    }

    try {
        const data = fs.readFileSync('workCount.json', 'utf8')
        const jsonData = JSON.parse(data)
        
        // Return today's count if it exists, otherwise return 0
        return jsonData[dateKey]?.count || 0
    } catch (error) {
        console.error('Error reading workCount.json:', error)
        return 0
    }
}

module.exports = todayWorkCount