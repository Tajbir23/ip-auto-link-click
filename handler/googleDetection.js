async function googleDetection(page) {
    console.log('Checking if page is a search engine page');
    
    try {
        // Wait for the page to be fully loaded
        await page.waitForFunction('document.readyState === "complete"', { timeout: 10000 });
        
        // Wait a bit to ensure dynamic content is loaded
        await new Promise(resolve => setTimeout(resolve, 2000));

        const isSearchEngine = await page.evaluate(() => {
            // Check URL first - more comprehensive checks
            const currentUrl = window.location.href.toLowerCase();
            const urlIndicators = [
                'google.com/sorry',
                'google.com/search',
                'google.',
                'bing.com',
                'recaptcha',
                '/sorry/index',
                'consent.google'
            ];
            
            if (urlIndicators.some(indicator => currentUrl.includes(indicator))) {
                console.log('Search engine detected via URL:', currentUrl);
                return true;
            }

            // Check for reCAPTCHA or verification page specific elements
            const verificationIndicators = [
                document.querySelector('.g-recaptcha'),
                document.querySelector('form#captcha-form'),
                document.querySelector('input[name="continue"]'),
                document.querySelector('#recaptcha'),
                document.querySelector('img[alt="captcha"]'),
                document.querySelector('form[action*="/sorry/index"]')
            ];

            if (verificationIndicators.some(indicator => indicator)) {
                console.log('Google verification/reCAPTCHA page detected');
                return true;
            }

            // Check multiple Google-specific elements
            const googleIndicators = [
                // Main search box
                document.querySelector('input[name="q"]'),
                // Google logo
                document.querySelector('img[alt="Google"]'),
                // Search button
                document.querySelector('input[value="Google Search"]'),
                document.querySelector('button[aria-label="Google Search"]'),
                // Results stats element
                document.querySelector('#result-stats'),
                // Search results container
                document.querySelector('#search'),
                document.querySelector('#rcnt'),
                // Google's main content div
                document.querySelector('#main'),
                // Google's consent form
                document.querySelector('form[action*="consent.google.com"]'),
                // Additional Google indicators
                document.querySelector('.google-logo'),
                document.querySelector('#searchform')
            ];

            // Check Bing-specific elements
            const bingIndicators = [
                // Bing search box
                document.querySelector('#sb_form_q'),
                // Bing logo
                document.querySelector('.b_logo'),
                // Bing results container
                document.querySelector('#b_results'),
                // Bing header
                document.querySelector('#b_header'),
                // Additional Bing indicators
                document.querySelector('#b_content'),
                document.querySelector('.b_searchbox'),
                document.querySelector('#b_tween')
            ];

            // Check if any indicators are found
            const hasGoogleIndicators = googleIndicators.some(indicator => indicator);
            const hasBingIndicators = bingIndicators.some(indicator => indicator);

            if (hasGoogleIndicators) {
                console.log('Google indicators found');
                return true;
            }
            if (hasBingIndicators) {
                console.log('Bing indicators found');
                return true;
            }

            return false;
        });

        if (isSearchEngine) {
            console.log('Detected search engine page');
        } else {
            console.log('No search engine detected');
        }

        return isSearchEngine;
    } catch (error) {
        console.error('Error in search engine detection:', error.message);
        // If there's an error, we assume it's not a search engine page
        return false;
    }
}

module.exports = googleDetection;
