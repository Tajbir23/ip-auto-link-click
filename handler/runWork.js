const fs = require('fs')
const { runUrl } = require('./runUrl')


const runWork = async (url) => {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // Read proxies from file
    let proxyFile = fs.readFileSync('uploads/proxy.txt', 'utf-8')
    let proxies = proxyFile.split('\n').map(line => line.trim()).filter(line => line !== '')

    const BATCH_SIZE = 3;
    let index = 0;
    let active = [];

    while (index < proxies.length || active.length > 0) {
        // Fill up to BATCH_SIZE
        while (active.length < BATCH_SIZE && index < proxies.length) {
            const proxy = proxies[index++];
            const startDelay = active.length === 0 ? 0 : (5000 + Math.random() * 2000);
            const promise = delay(startDelay).then(() => runUrl(url, proxy)).then(() => {
                // Remove finished promise from active
                active = active.filter(p => p !== promise);
            });
            active.push(promise);
        }
        // Wait for any one to finish before continuing
        if (active.length > 0) {
            await Promise.race(active);
        }
        // Re-read proxies in case the file was updated (proxies removed)
        proxyFile = fs.readFileSync('uploads/proxy.txt', 'utf-8')
        proxies = proxyFile.split('\n').map(line => line.trim()).filter(line => line !== '')
    }
}

module.exports = runWork 