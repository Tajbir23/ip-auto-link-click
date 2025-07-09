const fs = require('fs')
const path = require('path')

const remainingIp = async (req, res) => {
    try {
        const proxyPath = path.join('uploads', 'proxy.txt')
        if (!fs.existsSync(proxyPath)) {
            return res.json({
                success: false,
                message: 'Proxy file not found'
            })
        }

        const absolutePath = path.resolve(proxyPath)
        return res.sendFile(absolutePath)
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

module.exports = remainingIp