

const findAds = async (page) => {
    console.log('findAds');
    try {


        // wait for document ready state complete
        await page.waitForFunction('document.readyState === "complete"');

        
        console.log('document ready state complete');
        // Query all probable ad links
        const adLinks = await page.evaluate(() => {
            // All selectors for possible ads
            const selectors = [
                'a.cnv[target="_blank"]',
                'a[href*="ad"]',
                'a[href*="click"]',
                'a[href*="track"]',
                'a[href*="sponsored"]',
                'a[href*="affiliate"]',
                'a[rel~="sponsored"]',
                'a[rel~="nofollow"]',
                'a[class*="ad"]',
                'a[class*="sponsor"]',
                'a[data-ad]',
                'a[target="_blank"]'
            ];

            // Collect all unique matching <a> elements
            const uniqueLinks = new Set();
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(a => {
                    if (a.offsetParent !== null && a.href) {
                        uniqueLinks.add(a);
                    }
                });
            });
            console.log('--------------------------------')
            console.log('uniqueLinks', uniqueLinks);
            // Return as array
            return Array.from(uniqueLinks).map(a => a.href);
        });

        if (!adLinks.length) {
            throw new Error('No likely ad links found!');
        }

        // Random pick one and click using Puppeteer, so browser event fires
        const idx = Math.floor(Math.random() * adLinks.length);
        const adLink = adLinks[idx];

        // Click that link in page context (by href)
        await page.evaluate((href) => {
            const link = Array.from(document.querySelectorAll('a')).find(a => a.href === href && a.offsetParent !== null);
            if (link) link.click();
        }, adLink);

        console.log('adLink', adLink);
        return adLink; // For logging/debug

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = findAds;