
const isLoadingPage = require("./isLoadingPage");
const logger = require("./logger");

// Helper function to check if a URL is a legitimate Google resource
const isLegitimateGoogleResource = (url) => {
    const legitimatePatterns = [
        /google\.com\/recaptcha\//,
        /gstatic\.com\/recaptcha\//,
        /google\.com\/js\//,
        /googleapis\.com\//,
        /google\.com\/maps\//,
        /google\.com\/analytics\//,
        /googletagmanager\.com\//,
        /google-analytics\.com\//
    ];
    return legitimatePatterns.some(pattern => pattern.test(url));
};

const handleIframe = async (page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, googleErrorCount, success, proxy) => {
    // Wait for iframes and interact
    await page.waitForSelector('iframe[src*="facebook.com/plugins/post.php"]');
    const frames = await page.$$('iframe[src*="facebook.com/plugins/post.php"]');

    const randomFrameIndex = Math.floor(Math.random() * frames.length);
    const selectedFrame = frames[randomFrameIndex];

    // Wait for the iframe's content to be fully loaded
    const frameHandle = await selectedFrame.contentFrame();
    if (!frameHandle) {
        logger.error('handleIframe.js 15 line - Could not access iframe content');
        return { success: false, googleErrorCount };
    }

    // Wait for the iframe's DOM to be fully loaded
    await frameHandle.waitForFunction('document.readyState === "complete"');
    logger.info('handleIframe.js 22 line - Iframe loaded');

    try {
        await frameHandle.waitForSelector('[data-testid="post_message"]', { timeout: 10000 });
        
        // Quick delay before clicking
        await randomDelay(500, 800);

        // Get browser context
        const context = page.browser().defaultBrowserContext();
        
        // Track all new targets (pages/popups)
        const allTargets = new Set();
        const targetCreatedPromise = new Promise(resolve => {
            context.on('targetcreated', async (target) => {
                const targetUrl = target.url();
                logger.info(`handleIframe.js 37 line - New target created: ${targetUrl}`);
                allTargets.add(target);
                
                // Check if target URL is Google but not a legitimate resource
                if ((targetUrl.includes('google.') || targetUrl.match(/google\.[a-z]+/)) && !isLegitimateGoogleResource(targetUrl)) {
                    logger.info(`handleIframe.js 42 line - Suspicious Google URL detected in new target: ${targetUrl}`);
                    resolve(true);
                }
            });
        });

        // Track all target changes
        const targetChangedPromise = new Promise(resolve => {
            context.on('targetchanged', async (target) => {
                const targetUrl = target.url();
                logger.info(`handleIframe.js 51 line - Target changed: ${targetUrl}`);
                
                // Check if target URL is Google but not a legitimate resource
                if ((targetUrl.includes('google.') || targetUrl.match(/google\.[a-z]+/)) && !isLegitimateGoogleResource(targetUrl)) {
                    logger.info(`handleIframe.js 54 line - Suspicious Google URL detected in target change: ${targetUrl}`);
                    resolve(true);
                }
            });
        });

        // Click the link in iframe
        let clickedHref = '';
        const linkClicked = await frameHandle.evaluate(() => {
            const postMessage = document.querySelector('[data-testid="post_message"]');
            if (!postMessage) return { clicked: false, href: '' };

            const links = Array.from(postMessage.querySelectorAll('a[href]'));
            if (links.length > 0) {
                const randomLink = links[Math.floor(Math.random() * links.length)];
                const href = randomLink.href;
                randomLink.click();
                return { clicked: true, href };
            }
            return { clicked: false, href: '' };
        });

        if (linkClicked.clicked) {
            logger.info(`handleIframe.js 79 line - Link clicked in iframe: ${linkClicked.href}`);

            // Wait for either target events or timeout
            const timeout = new Promise(resolve => setTimeout(() => resolve(false), 10000));
            const isGoogle = await Promise.race([
                targetCreatedPromise,
                targetChangedPromise,
                timeout
            ]);

            // Log all targets we've seen
            logger.info(`handleIframe.js 89 line - All targets encountered: ${Array.from(allTargets).map(t => t.url())}`);

            // If suspicious Google URL was detected
            if (isGoogle) {
                logger.info('handleIframe.js 93 line - Suspicious Google URL detected through target monitoring');
                googleErrorCount++;
            } else {
                logger.info('handleIframe.js 102 line - No suspicious Google URLs detected, proceeding with success');
                googleErrorCount = 0;
            }

            logger.info('handleIframe.js 105 line - Checking main page for Google');
            // Additional check with googleDetection
            const mainPageIsGoogle = await googleDetection(page);
            if (mainPageIsGoogle) {
                logger.info('handleIframe.js 110 line - Google search page detected through googleDetection');
                googleErrorCount++;
                logger.info(`handleIframe.js 112 line - googleErrorCount: ${googleErrorCount}`);
            } else {
                logger.info('handleIframe.js 116 line - No Google search page detected, proceeding with success');
                googleErrorCount = 0;
            }

            // Check any new pages that were opened
            for (const target of allTargets) {
                try {
                    const newPage = await target.page();
                    if (newPage) {
                        const newPageUrl = await newPage.url();
                        logger.info(`handleIframe.js 128 line - Checking new page: ${newPageUrl}`);
                        
                        // Skip Google detection for legitimate resources
                        if (isLegitimateGoogleResource(newPageUrl)) {
                            logger.info('handleIframe.js 131 line - Legitimate Google resource detected, skipping Google detection');
                            continue;
                        }
                        
                        const isGooglePage = await googleDetection(newPage);
                        if (isGooglePage) {
                            logger.info('handleIframe.js 131 line - Google search page detected in new page');
                            googleErrorCount++;
                            logger.info(`handleIframe.js 133 line - googleErrorCount: ${googleErrorCount}`);
                        } else {
                            logger.info('handleIframe.js 141 line - No Google search page detected, proceeding with success');
                            googleErrorCount = 0;
                        }
                        
                        logger.info('handleIframe.js 144 line - closing new page');
                        // wait for complete load
                        await newPage.waitForFunction('document.readyState === "complete"');
                        // wait for 5 seconds
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                } catch (error) {
                    logger.error(`handleIframe.js 153 line - Error checking target: ${error.message}`);
                }
            }

            logger.info('handleIframe.js 157 line - No Google search pages detected, proceeding with success');
            success = true;
            
            // Continue with remaining actions
            await randomDelay(800, 1200);
            await humanScroll(page);

            await isLoadingPage(page);
        }
    } catch (error) {
        logger.error(`handleIframe.js 168 line - Error interacting with iframe: ${error.message}`);
        return { success: false, googleErrorCount };
    }

    return { success, googleErrorCount };
}

module.exports = handleIframe;