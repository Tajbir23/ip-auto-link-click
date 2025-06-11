const fs = require('fs')

const uploadProxy = async (file,filePath = 'uploads/proxy.txt') => {
    try {
        // const data = fs.readFileSync(filePath, 'utf-8')
        // const proxies = data.split(/\r?\n/).filter(line => line.trim() !== '')
        // console.log('Proxies:', proxies)
        // You can add your own logic here to process or store the proxies
        fs.renameSync(file, filePath)
    } catch (err) {
        console.error('Error reading proxy file:', err)
    }
}

module.exports = uploadProxy
