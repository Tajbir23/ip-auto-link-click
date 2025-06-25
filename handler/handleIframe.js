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
        // Check for Google detection immediately after navigation (if any)
        const isGoogle = await googleDetection(page);
        if(isGoogle) {
            googleErrorCount++;
            console.log('Google detection triggered. Error count:', googleErrorCount);
            success = false;  // Mark this attempt as unsuccessful
            await removeProxy(proxy, 'uploads/proxy.txt');
            return;  // Exit this proxy attempt
        }

        success = true;
        
        // Final actions with remaining time
        await randomDelay(800, 1200);
        await humanScroll(page);
        
        // Random final delay to reach 5-7 seconds total
        const remainingDelay = Math.floor(Math.random() * 2000) + 5000; // 5-7 seconds
        await sleep(remainingDelay - 19000); // Subtract approximate time of previous actions
        console.log('Remaining delay:', remainingDelay);
        await workCountIncrease()
    }
} catch (error) {
    console.log('Error interacting with iframe:', error.message);
}
}

module.exports = handleIframe;