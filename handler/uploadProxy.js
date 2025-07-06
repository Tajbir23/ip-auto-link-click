const fs = require('fs')
const logger = require('./logger')

const uploadProxy = async (filePath) => {
    try {
        const proxies = fs.readFileSync(filePath, 'utf-8')
        fs.writeFileSync('uploads/proxy.txt', proxies)
        return true
    } catch (err) {
        logger.error(`uploadProxy.js 10 line - Error reading proxy file: ${err}`)
        return false
    }
}

module.exports = uploadProxy
