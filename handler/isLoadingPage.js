const isLoadingPage = async (page) => {
    try {
        // Wait for network and document loading to complete
        await page.waitForFunction(() => {
            // Check document ready state
            if (document.readyState !== 'complete') return false;

            // Check for pending XHR requests
            const pendingXHR = window.XMLHttpRequest && 
                Array.from(window.performance.getEntriesByType('resource'))
                .filter(r => r.initiatorType === 'xmlhttprequest' && !r.responseEnd).length > 0;
            if (pendingXHR) return false;

            // Check for pending Fetch requests
            const pendingFetch = window.fetch && 
                Array.from(window.performance.getEntriesByType('resource'))
                .filter(r => r.initiatorType === 'fetch' && !r.responseEnd).length > 0;
            if (pendingFetch) return false;

            // Check for pending navigations
            const pendingNavigations = window.performance.getEntriesByType('navigation')
                .some(nav => !nav.loadEventEnd);
            if (pendingNavigations) return false;

            // All checks passed, loading is complete
            return true;
        }, { timeout: 30000 }); // Wait up to 30 seconds for loading to complete

        return true; // Return true if loading completed successfully

    } catch (error) {
        console.log('Timeout or error while waiting for page load:', error.message);
        await Promise.resolve(setTimeout(() => {
            return true;
        }, 5000));
        
    }
}

module.exports = isLoadingPage;