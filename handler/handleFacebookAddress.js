const isLoadingPage = require("./isLoadingPage");

const handleFacebookAddress = async (page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, googleErrorCount, success) => {
    let isLinkClicked = false;
    // Wait for the target div to appear
    await frameHandle.waitForSelector('div.x1iorvi4.xjkvuk6.x1g0dm76.xpdmqnj');

    // Find all <a href> inside the target div
    const links = await frameHandle.$$eval('div.x1iorvi4.xjkvuk6.x1g0dm76.xpdmqnj a[href]', anchors =>
        anchors.map(a => a.href)
    );

    if (links.length > 0) {
        const randomIndex = Math.floor(Math.random() * links.length);
        const randomLink = links[randomIndex];

        // Optional: wait a bit before clicking
        if (randomDelay) await randomDelay(300, 700);

        // Click the random link
        isLinkClicked = await frameHandle.evaluate((url) => {
            const anchor = Array.from(document.querySelectorAll('div.x1iorvi4.xjkvuk6.x1g0dm76.xpdmqnj a[href]')).find(a => a.href === url);
            if (anchor) {
                anchor.click();
                return true;
            }
            return false;
        }, randomLink);

    } else {
        console.log('No links found in the target Facebook post div.');
    }
    
    if(isLinkClicked) {
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

        success = true;
        
        // Final actions with remaining time
        await randomDelay(800, 1200);
        await humanScroll(page);
        
        await workCountIncrease()
        await isLoadingPage(page);
    }
}

module.exports = handleFacebookAddress;