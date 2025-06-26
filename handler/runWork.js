const fs = require('fs')
const { runUrl } = require('./runUrl')

// Shared state for all browser instances
let globalGoogleErrorCount = 0;
let activeBrowsers = new Set();

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
        // Check if we should stop due to too many Google detections
        console.log(`Current global Google error count: ${globalGoogleErrorCount}, Active browsers: ${activeBrowsers.size}`);
        
        if (globalGoogleErrorCount >= 5) {
            console.log('Stopping all browsers due to too many Google detections');
            globalGoogleErrorCount = 0;
            activeBrowsers.clear();
            // Close all active browsers
            active = [];
            return;
        }

        // Fill up to BATCH_SIZE
        while (active.length < BATCH_SIZE && index < proxies.length) {
            const proxy = proxies[index++];
            const browserId = `browser_${Date.now()}_${Math.random()}`;
            activeBrowsers.add(browserId);
            
            const startDelay = active.length === 0 ? 0 : (5000 + Math.random() * 2000);
            const promise = delay(startDelay).then(async () => {
                try {
                    const result = await runUrl(url, proxy, globalGoogleErrorCount, browserId);
                    if (result) {
                        if (result.isGoogleDetected) {
                            globalGoogleErrorCount++;
                            console.log(`Browser ${browserId} detected Google. New global count: ${globalGoogleErrorCount}`);
                        }
                        if (!result.success) {
                            activeBrowsers.delete(browserId);
                        }
                    }
                } catch (error) {
                    console.error(`Error in browser ${browserId}:`, error);
                    activeBrowsers.delete(browserId);
                }
            }).then(() => {
                // Remove finished promise from active
                active = active.filter(p => p !== promise);
                activeBrowsers.delete(browserId);
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