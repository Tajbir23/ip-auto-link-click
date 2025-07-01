const findAds = require("./findAds");
const isLoadingPage = require("./isLoadingPage");

const handleIframe = async (page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, googleErrorCount, success, proxy) => {
    // Wait for iframes and interact
    await page.waitForSelector('iframe[src*="facebook.com/plugins/post.php"]');
    const frames = await page.$$('iframe[src*="facebook.com/plugins/post.php"]');

    const randomFrameIndex = Math.floor(Math.random() * frames.length);
    const selectedFrame = frames[randomFrameIndex];

    // Wait for the iframe's content to be fully loaded
    const frameHandle = await selectedFrame.contentFrame();
    if (!frameHandle) {
        console.log('Could not access iframe content');
        return { success: false, googleErrorCount };
    }

    // Wait for the iframe's DOM to be fully loaded
    await frameHandle.waitForFunction('document.readyState === "complete"');
    console.log('Iframe loaded');

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

        // Click the link in iframe
        const linkClicked = await frameHandle.evaluate(() => {
            const postMessage = document.querySelector('[data-testid="post_message"]');
            if (!postMessage) return false;

            const links = Array.from(postMessage.querySelectorAll('a[href]'));
            if (links.length > 0) {
                const randomLink = links[Math.floor(Math.random() * links.length)];
                // Store the href for logging
                const href = randomLink.href;
                console.log('Clicking link:', href);
                randomLink.click();
                return true;
            }
            return false;
        });

        if (linkClicked) {
            console.log('Link clicked in iframe');

            // Wait for either target events or timeout
            const timeout = new Promise(resolve => setTimeout(() => resolve(false), 10000));
            const isGoogle = await Promise.race([
                targetCreatedPromise,
                targetChangedPromise,
                timeout
            ]);

            // Log all targets we've seen
            console.log('All targets encountered:', Array.from(allTargets).map(t => t.url()));

            // If Google was detected
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

            console.log('Checking main page for Google');
            // Additional check with googleDetection
            const mainPageIsGoogle = await googleDetection(page);
            if (mainPageIsGoogle) {
                console.log('Google detected through googleDetection');
                googleErrorCount++;
                console.log('googleErrorCount', googleErrorCount);
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
                            console.log('googleErrorCount', googleErrorCount);
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
                        console.log('closing new page');
                        // wait for complete load
                        await newPage.waitForFunction('document.readyState === "complete"');
                        await findAds(newPage);
                        // wait for 5 seconds
                        await new Promise(resolve => setTimeout(resolve, 5000));
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
        console.log('Error interacting with iframe:', error.message);
        return { success: false, googleErrorCount };
    }

    return { success, googleErrorCount };
}

module.exports = handleIframe;