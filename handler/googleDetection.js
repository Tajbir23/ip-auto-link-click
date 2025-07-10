const logger = require("./logger");

async function googleDetection(page) {
    let isGoogleDetection = false;
    try {
        // Helper function to check if a URL is Google search-related
        const isGoogleSearchUrl = (url) => {
            // Only match Google search URLs
            const googleSearchPatterns = [
                // Match Google search domains but not subdomains like play.google.com
                /^https?:\/\/(www\.)?google\.[a-z]+\/search/i,
                /^https?:\/\/(www\.)?google\.co\.[a-z]+\/search/i,
                /^https?:\/\/(www\.)?google\.com\.?[a-z]*\/search/i,
                // Match Google search result pages
                /\?q=[^&]+(&|$)/i,
                // Match Google search-related paths
                /\/webhp$/i,
                /\/complete\/search/i
            ];
            
            return googleSearchPatterns.some(pattern => pattern.test(url));
        };

        // Create a promise that resolves when navigation occurs
        const navigationPromise = new Promise(resolve => {
            const urls = new Set();
            
            // Listen for all requests
            page.on('request', request => {
                const url = request.url();
                urls.add(url);
                
                // Check if this request is to Google Search
                if (isGoogleSearchUrl(url)) {
                    logger.info(`googleDetection.js 35 line - Google Search detected in request: ${url}`);
                    resolve(true);
                    isGoogleDetection = true;
                    return;
                }
            });

            // Listen for responses
            page.on('response', response => {
                const url = response.url();
                urls.add(url);
                
                // Check if this response is from Google Search
                if (isGoogleSearchUrl(url)) {
                    logger.info(`googleDetection.js 48 line - Google Search detected in response: ${url}`);
                    resolve(true);
                    isGoogleDetection = true;
                    return;
                }
            });

            // Listen for redirects
            page.on('framenavigated', frame => {
                const url = frame.url();
                urls.add(url);
                
                // Check if this navigation is to Google Search
                if (isGoogleSearchUrl(url)) {
                    logger.info(`googleDetection.js 63 line - Google Search detected in navigation: ${url}`);
                    resolve(true);
                    isGoogleDetection = true;
                    return;
                }
            });

            // Set a timeout to resolve the promise
            setTimeout(() => {
                logger.info(`googleDetection.js 72 line - All URLs encountered: ${Array.from(urls)}`);
                resolve(false);
            }, 5000);
        });

        // Wait for either navigation events or timeout
        const isGoogleNavigation = await navigationPromise;
        if (isGoogleNavigation) {
            isGoogleDetection = true;
            return true;
        }

        // Get current URL
        const url = await page.url();
        
        // Check current URL
        if (isGoogleSearchUrl(url)) {
            logger.info(`googleDetection.js 89 line - Google Search detected in current URL: ${url}`);
            isGoogleDetection = true;
            return true;
        }

        // Get browser location
        const location = await page.evaluate(() => window.location.href);
        logger.info(`googleDetection.js 97 line - Browser location: ${location}`);
        
        // Check browser location
        if (isGoogleSearchUrl(location)) {
            logger.info(`googleDetection.js 101 line - Google Search detected in browser location: ${location}`);
            isGoogleDetection = true;
            return true;
        }

        // Check page content for Google Search elements
        const hasGoogleElements = await page.evaluate(() => {
            // Check for Google search-specific elements
            const searchIndicators = [
                'google search',
                'search results',
                'search tools',
                'advanced search'
            ];
            
            // Check title
            if (document.title && searchIndicators.some(indicator => 
                document.title.toLowerCase().includes(indicator))) {
                return true;
            }

            // Check visible text if body exists
            if (document.body) {
                const bodyText = document.body.innerText.toLowerCase();
                return searchIndicators.some(indicator => bodyText.includes(indicator));
            }

            return false;
        });

        if (hasGoogleElements) {
            logger.info('googleDetection.js 143 line - Google Search elements found in page content');
            isGoogleDetection = true;
            return true;
        }

        // Check for specific Google Search elements
        const hasGoogleUI = await page.evaluate(() => {
            // Check for Google search elements
            if (document.querySelector('input[name="q"]') ||
                document.querySelector('div#searchform') ||
                document.querySelector('div.g') || // Google search result container
                document.querySelector('div#search') || // Main search container
                document.querySelector('div#rcnt') || // Search results container
                document.querySelector('div#main')) { // Main content area
                return true;
            }

            return false;
        });

        if (hasGoogleUI) {
            logger.info('googleDetection.js 172 line - Google Search UI elements detected');
            isGoogleDetection = true;
            return true;
        }

        logger.info('googleDetection.js 177 line - No Google Search indicators detected');
        isGoogleDetection = false;
        return isGoogleDetection;

    } catch (error) {
        logger.error(`googleDetection.js 182 line - Error in Google detection: ${error}`);
        // If there's an error, return true to be safe
        return true;
    }
}

module.exports = googleDetection;