const findAds = require("./findAds");
const isLoadingPage = require("./isLoadingPage");
const googleDetection = require('./googleDetection')
const logger = require('./logger')

const handleFacebookAddress = async (page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, googleErrorCount, success, proxy) => {
    let isLinkClicked = false;
    try {
        // Wait for the target div to appear
        await frameHandle.waitForSelector('div.x1iorvi4.xjkvuk6.x1g0dm76.xpdmqnj');

        // Get browser context
        const context = page.browser().defaultBrowserContext();
        
        // Track all new targets (pages/popups)
        const allTargets = new Set();
        const targetCreatedPromise = new Promise(resolve => {
            context.on('targetcreated', async (target) => {
                console.log('New target created:', target.url());
                allTargets.add(target);
                
                // Check if target URL is Google
                if (target.url().includes('google.') || target.url().match(/google\.[a-z]+/)) {
                    console.log('Google detected in new target:', target.url());
                    resolve(true);
                }
            });
        });

        // Track all target changes
        const targetChangedPromise = new Promise(resolve => {
            context.on('targetchanged', async (target) => {
                console.log('Target changed:', target.url());
                
                // Check if target URL is Google
                if (target.url().includes('google.') || target.url().match(/google\.[a-z]+/)) {
                    console.log('Google detected in target change:', target.url());
                    resolve(true);
                }
            });
        });

        // Find all <a href> inside the target div
        const links = await frameHandle.$$eval('div.x1iorvi4.xjkvuk6.x1g0dm76.xpdmqnj a[href]', anchors =>
            anchors.map(a => ({ href: a.href }))
        );

        if (links.length > 0) {
            const randomIndex = Math.floor(Math.random() * links.length);
            const randomLink = links[randomIndex];

            // Optional: wait a bit before clicking
            if (randomDelay) await randomDelay(300, 700);

            // Click the random link
            console.log('Clicking link:', randomLink.href);
            isLinkClicked = await frameHandle.evaluate((url) => {
                const anchor = Array.from(document.querySelectorAll('div.x1iorvi4.xjkvuk6.x1g0dm76.xpdmqnj a[href]')).find(a => a.href === url);
                if (anchor) {
                    anchor.click();
                    return true;
                }
                return false;
            }, randomLink.href);

        } else {
            console.log('No links found in the target Facebook post div.');
            return { success: false, googleErrorCount };
        }
        
        if(isLinkClicked) {
            console.log('Link clicked in Facebook post');

            // Wait for either target events or timeout
            const timeout = new Promise(resolve => setTimeout(() => resolve(false), 10000));
            const isGoogle = await Promise.race([
                targetCreatedPromise,
                targetChangedPromise,
                timeout
            ]);

            // Log all targets we've seen
            console.log('All targets encountered:', Array.from(allTargets).map(t => t.url()));

            // If Google was detected through target monitoring
            if (isGoogle) {
                console.log('Google detected through target monitoring');
                googleErrorCount++;
                // success = false;
                // if (proxy) {
                //     await removeProxy(proxy, 'uploads/proxy.txt');
                // }
                // return { success: false, googleErrorCount };
            }else{
                console.log('No Google detected, proceeding with success');
                googleErrorCount = 0;
            }

            // Additional check with googleDetection on main page
            const mainPageIsGoogle = await googleDetection(page);
            if (mainPageIsGoogle) {
                console.log('Google detected through googleDetection');
                googleErrorCount++;
                // success = false;
                // if (proxy) {
                //     await removeProxy(proxy, 'uploads/proxy.txt');
                // }
                // return { success: false, googleErrorCount };
            }else{
                console.log('No Google detected, proceeding with success');
                googleErrorCount = 0;
            }

            // Check any new pages that were opened
            for (const target of allTargets) {
                try {
                    const newPage = await target.page();
                    if (newPage) {
                        console.log('Checking new page:', await newPage.url());
                        const isGooglePage = await googleDetection(newPage);
                        if (isGooglePage) {
                            console.log('Google detected in new page');
                            googleErrorCount++;
                            console.log('google detect in facebook address');
                            // success = false;
                            // if (proxy) {
                            //     await removeProxy(proxy, 'uploads/proxy.txt');
                            // }
                            // await newPage.close();
                            // return { success: false, googleErrorCount };
                        }else{
                            console.log('No Google detected, proceeding with success');
                            googleErrorCount = 0;
                        }
                        // wait for complete load
                        await newPage.waitForFunction('document.readyState === "complete"');
                        // wait for 5 seconds
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        await findAds(newPage);
                        // await newPage.close();
                    }
                } catch (error) {
                    console.log('Error checking target:', error.message);
                }
            }

            console.log('No Google detected, proceeding with success');
            success = true;
            
            // Continue with remaining actions
            await randomDelay(800, 1200);
            await humanScroll(page);

            await isLoadingPage(page);
        }
    } catch (error) {
        console.log('Error in handleFacebookAddress:', error.message);
        return { success: false, googleErrorCount };
    }

    return { success, googleErrorCount };
}

module.exports = handleFacebookAddress;