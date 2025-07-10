const logger = require("./logger");

async function googleDetection(page) {
    let isGoogleDetection = false;
    try {
        // Helper function to safely check if a string is a valid URL
        const isValidUrl = (string) => {
            try {
                new URL(string);
                return true;
            } catch (err) {
                return false;
            }
        };

        // Helper function to check if a URL is Google search-related
        const isGoogleSearchUrl = (url) => {
            try {
                if (!url || typeof url !== 'string' || !isValidUrl(url)) {
                    return false;
                }

                // Only match Google search URLs
                const googleSearchPatterns = [
                    // Match Google search domains with /search path
                    /^https?:\/\/(www\.)?google\.[a-z]+\/search\?/i,
                    /^https?:\/\/(www\.)?google\.co\.[a-z]+\/search\?/i,
                    /^https?:\/\/(www\.)?google\.com\.?[a-z]*\/search\?/i,
                    // Match Google search result pages with q parameter
                    /^https?:\/\/(www\.)?google\.[a-z]+.*[?&]q=/i,
                    /^https?:\/\/(www\.)?google\.co\.[a-z]+.*[?&]q=/i,
                    /^https?:\/\/(www\.)?google\.com\.?[a-z]*.*[?&]q=/i
                ];
                
                try {
                    // Must match both the domain and search patterns
                    const urlObj = new URL(url);
                    const isGoogleDomain = /^(www\.)?google\.(com|co\.[a-z]+|[a-z]+)$/i.test(urlObj.hostname);
                    const hasSearchPattern = googleSearchPatterns.some(pattern => pattern.test(url));
                    
                    return isGoogleDomain && hasSearchPattern;
                } catch (err) {
                    logger.error(`googleDetection.js - Error parsing URL: ${url}, Error: ${err.message}`);
                    return false;
                }
            } catch (error) {
                logger.error(`googleDetection.js - Error in isGoogleSearchUrl: ${error.message}`);
                return false;
            }
        };

        // Create a promise that resolves when navigation occurs
        const navigationPromise = new Promise(resolve => {
            const urls = new Set();
            
            // Listen for all requests
            page.on('request', request => {
                try {
                    const url = request.url();
                    if (!url || typeof url !== 'string') return;
                    
                    urls.add(url);
                    
                    // Check if this request is to Google Search
                    if (isGoogleSearchUrl(url)) {
                        logger.info(`googleDetection.js 35 line - Google Search detected in request: ${url}`);
                        resolve(true);
                        isGoogleDetection = true;
                        return;
                    }
                } catch (error) {
                    logger.error(`googleDetection.js - Error handling request: ${error.message}`);
                }
            });

            // Listen for responses
            page.on('response', response => {
                try {
                    const url = response.url();
                    if (!url || typeof url !== 'string') return;
                    
                    urls.add(url);
                    
                    // Check if this response is from Google Search
                    if (isGoogleSearchUrl(url)) {
                        logger.info(`googleDetection.js 48 line - Google Search detected in response: ${url}`);
                        resolve(true);
                        isGoogleDetection = true;
                        return;
                    }
                } catch (error) {
                    logger.error(`googleDetection.js - Error handling response: ${error.message}`);
                }
            });

            // Listen for redirects
            page.on('framenavigated', frame => {
                try {
                    const url = frame.url();
                    if (!url || typeof url !== 'string') return;
                    
                    urls.add(url);
                    
                    // Check if this navigation is to Google Search
                    if (isGoogleSearchUrl(url)) {
                        logger.info(`googleDetection.js 63 line - Google Search detected in navigation: ${url}`);
                        resolve(true);
                        isGoogleDetection = true;
                        return;
                    }
                } catch (error) {
                    logger.error(`googleDetection.js - Error handling frame navigation: ${error.message}`);
                }
            });

            // Set a timeout to resolve the promise
            setTimeout(() => {
                const validUrls = Array.from(urls).filter(url => url && typeof url === 'string' && isValidUrl(url));
                logger.info(`googleDetection.js 72 line - All valid URLs encountered: ${validUrls}`);
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
        if (url && isGoogleSearchUrl(url)) {
            logger.info(`googleDetection.js 89 line - Google Search detected in current URL: ${url}`);
            isGoogleDetection = true;
            return true;
        }

        // Get browser location
        const location = await page.evaluate(() => window.location.href);
        logger.info(`googleDetection.js 97 line - Browser location: ${location}`);
        
        // Check browser location
        if (location && isGoogleSearchUrl(location)) {
            logger.info(`googleDetection.js 101 line - Google Search detected in browser location: ${location}`);
            isGoogleDetection = true;
            return true;
        }

        // Check page content for Google Search elements
        const hasGoogleElements = await page.evaluate(() => {
            // Check for Google search-specific elements
            const searchIndicators = [
                'google search results',
                'google advanced search',
                'google search tools'
            ];
            
            // Check title
            if (document.title && document.title.toLowerCase().includes('google search')) {
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
            // Check for Google search-specific elements
            const googleSearchSelectors = [
                'form[action*="google.com/search"]',
                'form[action*="google.co"]:has(input[name="q"])',
                'div#searchform:has(input[name="q"])',
                'div.g:has(h3.r)',  // Google search result container
                'div#search:has(div.g)',  // Main search container with results
                'div#rcnt:has(div#center_col)'  // Search results container
            ];

            return googleSearchSelectors.some(selector => document.querySelector(selector));
        });

        if (hasGoogleUI) {
            logger.info('googleDetection.js 172 line - Google Search UI elements detected');
            isGoogleDetection = true;
            return true;
        }

        logger.error('googleDetection.js 177 line - No Google Search indicators detected');
        isGoogleDetection = false;
        return isGoogleDetection;

    } catch (error) {
        logger.error(`googleDetection.js 182 line - Error in Google detection: ${error}`);
        // If there's an error, return true to be safe
        return true;
    }
}

module.exports = googleDetection;