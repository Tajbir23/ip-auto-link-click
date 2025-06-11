const fs = require('fs')

const removeProxy = async(proxyToRemove, filePath = "uploads/proxy.txt") => {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`${filePath} does not exist`);
            return false;
        }

        // Read the current proxies
        const data = fs.readFileSync(filePath, 'utf-8');
        if (!data.trim()) {
            console.log('Proxy file is empty');
            return false;
        }

        const proxies = data.split('\n').map(line => line.trim()).filter(line => line !== '');
        if (proxies.length === 0) {
            console.log('No valid proxies in file');
            return false;
        }

        // Remove the specified proxy
        const updatedProxies = proxies.filter(proxy => proxy.trim() !== proxyToRemove.trim());

        // If no proxies were removed, log and return
        if (proxies.length === updatedProxies.length) {
            console.log('Proxy not found in file');
            return false;
        }

        // Write the updated proxies back to file
        fs.writeFileSync(filePath, updatedProxies.join('\n') + (updatedProxies.length > 0 ? '\n' : ''));
        console.log(`Removed proxy: ${proxyToRemove}`);
        return true;

    } catch (err) {
        console.error('Error removing proxy:', err);
        return false;
    }
}

module.exports = removeProxy