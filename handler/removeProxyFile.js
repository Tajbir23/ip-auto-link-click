const fs = require('fs')
const logger = require('./logger')

const removeProxyFile = async () => {
    const filePath = 'uploads/proxy.txt'
    fs.unlink(filePath, (err) => {
        if(err) logger.error('Error removing proxy file:', err)
        else logger.info(`${filePath} has been deleted`)
    })
}

module.exports = removeProxyFile
