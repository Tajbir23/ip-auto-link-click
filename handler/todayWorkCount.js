const fs = require('fs')

const todayWorkCount = () => {
    const today = new Date()
    const dateKey = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`

    let data = {}
    if (fs.existsSync('workCount.json')) {
        try {
            data = JSON.parse(fs.readFileSync('workCount.json', 'utf8'))
        } catch (error) {
            console.error('Error reading workCount.json:', error)
        }
    }

    if (!data[dateKey]) {
        data[dateKey] = { count: 1 }
    } else {
        data[dateKey].count++
    }

    // ফাইলে লিখুন
    try {
        fs.writeFileSync('workCount.json', JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
        console.error('Error writing to workCount.json:', error)
    }

    // নতুন count রিটার্ন করুন
    return data[dateKey].count
}

module.exports = todayWorkCount