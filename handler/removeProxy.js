const fs = require('fs')
const logger = require('./logger')

const removeProxy = async (proxyToRemove) => {
    const filePath = 'uploads/proxy.txt'
    if (!fs.existsSync(filePath)) {
        logger.warn(`${filePath} does not exist`)
        return false
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8')
        if (!content.trim()) {
            logger.warn('Proxy file is empty')
            return false
        }

        let proxies = content.split('\n').map(line => line.trim()).filter(line => line !== '')
        if (proxies.length === 0) {
            logger.warn('No valid proxies in file')
            return false
        }

        // Find and remove the proxy
        const index = proxies.indexOf(proxyToRemove)
        if (index === -1) {
            logger.warn('Proxy not found in file')
            return false
        }

        proxies.splice(index, 1)
        fs.writeFileSync(filePath, proxies.join('\n'))
        logger.info(`Removed proxy: ${proxyToRemove}`)
        return true

    } catch (err) {
        logger.error('Error removing proxy:', err)
        return false
    }
}

module.exports = removeProxy