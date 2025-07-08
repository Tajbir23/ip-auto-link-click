const fs = require('fs')
const logger = require('./logger')

const removeProxyFile = async () => {
    const filePath = 'uploads/proxy.txt'
    fs.unlink(filePath, (err) => {
        if(err) logger.error(`removeProxyFile.js 7 line - Error removing proxy file: ${err}`)
        else logger.info(`removeProxyFile.js 8 line - ${filePath} has been deleted`)
    })
}

module.exports = removeProxyFile
