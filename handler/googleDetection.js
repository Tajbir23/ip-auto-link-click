async function googleDetection(page) {
    let isGoogleDetection = false;
    try {
        // Helper function to check if a URL is Google-related
        const isGoogleUrl = (url) => {
            const googlePatterns = [
                /google\.[a-z]+/i,
                /google\.co\.[a-z]+/i,
                /google\.com\.?[a-z]*/i,
                /\/sorry\/index/i,
                /gstatic\.com/i,
                /googleusercontent\.com/i,
                /google\/gen_204/i,
                /google\/log/i
            ];
            
            return googlePatterns.some(pattern => pattern.test(url)) ||
                   url.includes('google.') ||
                   url.includes('Google');
        };

        // Create a promise that resolves when navigation occurs
        const navigationPromise = new Promise(resolve => {
            const urls = new Set();
            
            // Listen for all requests
            page.on('request', request => {
                const url = request.url();
                urls.add(url);
                
                // Check if this request is to Google
                if (isGoogleUrl(url)) {
                    console.log('Google detected in request:', url);
                    resolve(true);
                    isGoogleDetection = true;
                    return;
                }
            });

            // Listen for responses
            page.on('response', response => {
                const url = response.url();
                urls.add(url);
                
                // Check if this response is from Google
                if (isGoogleUrl(url)) {
                    console.log('Google detected in response:', url);
                    resolve(true);
                    isGoogleDetection = true;
                    return;
                }
            });

            // Listen for redirects
            page.on('framenavigated', frame => {
                const url = frame.url();
                urls.add(url);
                
                // Check if this navigation is to Google
                if (isGoogleUrl(url)) {
                    console.log('Google detected in navigation:', url);
                    resolve(true);
                    isGoogleDetection = true;
                    return;
                }
            });

            // Set a timeout to resolve the promise
            setTimeout(() => {
                console.log('All URLs encountered:', Array.from(urls));
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
        // console.log('Current URL:', url);
        
        // Check current URL
        if (isGoogleUrl(url)) {
            console.log('Google detected in current URL:', url);
            isGoogleDetection = true;
            return true;
        }

        // Get browser location
        const location = await page.evaluate(() => window.location.href);
        console.log('Browser location:', location);
        
        // Check browser location
        if (isGoogleUrl(location)) {
            console.log('Google detected in browser location:', location);
            isGoogleDetection = true;
            return true;
        }

        // Check page content for Google elements
        const hasGoogleElements = await page.evaluate(() => {
            // Check title
            if (document.title && document.title.toLowerCase().includes('google')) {
                return true;
            }

            // Check meta tags
            const metas = document.getElementsByTagName('meta');
            for (const meta of metas) {
                const content = (meta.content || '').toLowerCase();
                if (content.includes('google.') || content.includes('google')) {
                    return true;
                }
            }

            // Check visible text if body exists
            if (document.body) {
                const bodyText = document.body.innerText.toLowerCase();
                const googleIndicators = [
                    'google search',
                    'google chrome',
                    'sorry... we have detected unusual traffic',
                    'our systems have detected unusual traffic',
                    'please try your request again',
                    'why did this happen?',
                    'ip address',
                    'automated requests'
                ];
                
                return googleIndicators.some(indicator => bodyText.includes(indicator.toLowerCase()));
            }

            return false;
        });

        if (hasGoogleElements) {
            console.log('Google elements found in page content');
            isGoogleDetection = true;
            return true;
        }

        // Check for specific Google elements
        const hasGoogleUI = await page.evaluate(() => {
            // Check for Google's reCAPTCHA
            if (document.querySelector('iframe[src*="recaptcha"]') ||
                document.querySelector('div.g-recaptcha')) {
                return true;
            }

            // Check for Google's sorry page elements
            if (document.querySelector('form#captcha-form') ||
                document.querySelector('a[href*="google.com/sorry"]')) {
                return true;
            }

            // Check for Google search elements
            if (document.querySelector('input[name="q"]') ||
                document.querySelector('div#searchform')) {
                return true;
            }

            return false;
        });

        if (hasGoogleUI) {
            console.log('Google UI elements detected');
            isGoogleDetection = true;
            return true;
        }

        console.log('No Google indicators detected');
        isGoogleDetection = false;
        return isGoogleDetection;

    } catch (error) {
        console.error('Error in Google detection:', error);
        // If there's an error, return true to be safe
        return true;
    }
}

module.exports = googleDetection;