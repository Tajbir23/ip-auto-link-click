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
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        
        // Check for Google detection immediately after navigation
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
}

module.exports = handleFacebookAddress;