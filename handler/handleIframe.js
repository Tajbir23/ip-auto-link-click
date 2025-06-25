const isLoadingPage = require("./isLoadingPage");

const handleIframe = async (page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, googleErrorCount, success) => {
// Wait for iframes and interact
await page.waitForSelector('iframe[src*="facebook.com/plugins/post.php"]');
const frames = await page.$$('iframe[src*="facebook.com/plugins/post.php"]');

const randomFrameIndex = Math.floor(Math.random() * frames.length);
const selectedFrame = frames[randomFrameIndex];

// Wait for the iframe's content to be fully loaded
const frameHandle = await selectedFrame.contentFrame();
if (!frameHandle) {
    console.log('Could not access iframe content');
    return;
}
// Wait for the iframe's DOM to be fully loaded
await frameHandle.waitForFunction('document.readyState === "complete"');
console.log('Iframe loaded');

try {
    await frameHandle.waitForSelector('[data-testid="post_message"]', { timeout: 10000 });
    
    // Quick delay before clicking
    await randomDelay(500, 800);

    const linkClicked = await frameHandle.evaluate(() => {
        const postMessage = document.querySelector('[data-testid="post_message"]');
        if (!postMessage) return false;

        const links = Array.from(postMessage.querySelectorAll('a[href]'));
        if (links.length > 0) {
            const randomLink = links[Math.floor(Math.random() * links.length)];
            randomLink.click();
            return true;
        }
        return false;
    });

    if (linkClicked) {
        console.log('linkClicked iframe');
        
        // Wait for navigation to complete
        try {
            await page.waitForNavigation({ 
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000 
            });
        } catch (error) {
            console.log('Navigation timeout, continuing with detection...');
        }

        // Wait a bit to ensure the page is stable
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for search engine detection
        const isSearchEngine = await googleDetection(page);
        if(isSearchEngine) {
            googleErrorCount++;
            console.log('Search engine detection triggered. Error count:', googleErrorCount);
            success = false;  // Mark this attempt as unsuccessful
            await removeProxy(proxy, 'uploads/proxy.txt');
            return;  // Exit this proxy attempt
        }

        console.log('success iframe');
        success = true;
        
        // Final actions with remaining time
        await randomDelay(800, 1200);
        await humanScroll(page);

        try {
            console.log('Starting workCountIncrease...');
            workCountIncrease();
            console.log('workCountIncrease iframe');
        } catch (error) {
            console.error('Failed to increase work count:', error);
        }

        await isLoadingPage(page);
    }
} catch (error) {
    console.log('Error interacting with iframe:', error.message);
}
}

module.exports = handleIframe;