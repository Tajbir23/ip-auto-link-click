const fs = require('fs')
const removeProxyFile = (filePath = "uploads/proxy.txt") => {
    if(fs.existsSync(filePath)){
        fs.unlink(filePath, (err) => {
            if(err) console.log(err)
            console.log(`${filePath} has been deleted`)
        })
    }else{
        console.log(`${filePath} does not exist`)
    }
}

module.exports = removeProxyFile
