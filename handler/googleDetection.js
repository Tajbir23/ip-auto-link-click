async function googleDetection(page) {
    const isGoogle = await page.evaluate(() => {
        // Check multiple Google-specific elements
        const googleIndicators = [
            // Main search box
            document.querySelector('input[name="q"]'),
            // Google logo
            document.querySelector('img[alt="Google"]'),
            // Search button
            document.querySelector('input[value="Google Search"]'),
            // Results stats element
            document.querySelector('#result-stats'),
            // Google search URL
            window.location.hostname.includes('google.'),
            // Search results container
            document.querySelector('#search'),
            // Google's main content div
            document.querySelector('#main'),
            // reCAPTCHA element
            document.querySelector('div.g-recaptcha'),
            // Google's consent form
            document.querySelector('form[action*="consent.google.com"]')
        ];

        // If any of these elements exist, it's likely a Google page
        return googleIndicators.some(indicator => indicator);
    });

    if (isGoogle) {
        console.log('Detected Google search page or related Google service');
    }

    return isGoogle;
}

module.exports = googleDetection;
