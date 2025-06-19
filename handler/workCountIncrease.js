const fs = require('fs')

const workCountIncrease = () => {
    let data = {}
    const today = new Date()
    const dateKey = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`

    // Try to read existing data
    try {
        if (fs.existsSync('workCount.json')) {
            const fileContent = fs.readFileSync('workCount.json', 'utf8')
            data = JSON.parse(fileContent)
        }
    } catch (error) {
        console.error('Error reading workCount.json:', error)
    }

    // Initialize or increment count for today
    if (!data[dateKey]) {
        data[dateKey] = { count: 1 }
    } else {
        data[dateKey].count++
    }

    // Write updated data back to file
    try {
        fs.writeFileSync('workCount.json', JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
        console.error('Error writing to workCount.json:', error)
    }
}

module.exports = workCountIncrease