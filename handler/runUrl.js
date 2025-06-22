const fs = require('fs')
const puppeteer = require('puppeteer')
const removeProxy = require('./removeProxy');
const removeProxyFile = require('./removeProxyFile');
const googleDetection = require('./googleDetection');
const workCountIncrease = require('./workCountIncrease');

// Add a flag to control scraping
let isScrapingActive = true;
let proxyAuthErrorCount = 0;
let googleErrorCount = 0;

// Function to stop scraping
function stopScraping() {
    isScrapingActive = false;
}

function getRandomChrome135UA() {
    // Windows 10 specific architectures and variations
    const architectures = [
        'Win64; x64',
        'WOW64',
        'Win64; Intel',
        'Windows NT 10.0'
    ];

    const architecture = architectures[Math.floor(Math.random() * architectures.length)];
    return `Mozilla/5.0 (Windows NT 10.0; ${architecture}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36`;
}

// Random delay between actions
const randomDelay = async (min = 800, max = 1500) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
};

// Simulate human-like mouse movement
async function moveMouseRandomly(page) {
    const viewportSize = await page.viewport();
    const x = Math.floor(Math.random() * viewportSize.width);
    const y = Math.floor(Math.random() * viewportSize.height);
    
    await page.mouse.move(x, y, { steps: 10 });
}


// Simulate human-like scrolling with faster timing
async function humanScroll(page) {
    await page.evaluate(async () => {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const height = document.documentElement.scrollHeight;
        const scrollSteps = Math.floor(Math.random() * 3) + 2; // 2-4 steps
        
        for (let i = 0; i < scrollSteps; i++) {
            const position = (height / scrollSteps) * (i + 1);
            window.scrollTo({
                top: position,
                behavior: 'smooth'
            });
            await delay(Math.random() * 500 + 300); // Faster scrolling
        }
    });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const runUrl = async (url) => {
    // Reset the flag when starting new scrape
    isScrapingActive = true;

    

    try {
        // Read and validate proxy file
        if (!fs.existsSync('uploads/proxy.txt')) {
            console.log('Proxy file does not exist');
            return;
        }

        const proxyFile = fs.readFileSync('uploads/proxy.txt', 'utf-8')
        const proxies = proxyFile.split('\n').map(line => line.trim()).filter(line => line !== '')
        
        if (proxies.length === 0) {
            console.log('No valid proxies found in file');
            return;
        }

        for (let i = 0; i < proxies.length; i++) {

            if(proxyAuthErrorCount >= 10) {
                await removeProxyFile()
                proxyAuthErrorCount = 0;
                stopScraping();
                return;
            }
            
            // Check if scraping should stop
            if (!isScrapingActive) {
                console.log('Scraping stopped by user');
                return;
            }

            if(googleErrorCount >= 5) {
                googleErrorCount = 0;
                stopScraping();
                return;
            }
            
            const proxy = proxies[i].trim()
            console.log(proxy)
            let browser = null;
            let success = false;

            try {
                // console.log(`\nTrying proxy ${i + 1}/${proxies.length}:`, proxy);
                const [host, port, username, password] = proxy.split(':')
                
                browser = await puppeteer.launch({
                    headless: false,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',
                        `--proxy-server=${host}:${port}`,
                        '--disable-blink-features=AutomationControlled',
                        '--disable-features=IsolateOrigins,site-per-process',
                        '--window-size=1920,1080'
                    ],
                    defaultViewport: {
                        width: 1920,
                        height: 1080
                    }
                });

                const page = await browser.newPage();

                // Mask webdriver
                await page.evaluateOnNewDocument(() => {
                    delete navigator.__proto__.webdriver;
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5]
                    });
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en']
                    });
                    window.chrome = {
                        runtime: {}
                    };
                });

                // Block all requests until authenticated
                await page.setRequestInterception(true);
                let authenticated = false;
                
                const requestHandler = request => {
                    if (!authenticated) {
                        request.abort();
                        return;
                    }
                    request.continue();
                };

                const errorHandler = async err => {
                    if (err.message && err.message.includes('auth')) {
                        proxyAuthErrorCount++;
                        console.log('Auth error count:', proxyAuthErrorCount);
                        await removeProxy(proxy, 'uploads/proxy.txt');
                    }
                };

                const failedHandler = async request => {
                    const failure = request.failure();
                    if (failure && (
                        failure.errorText.includes('ERR_PROXY_CONNECTION_FAILED') ||
                        failure.errorText.includes('ERR_TUNNEL_CONNECTION_FAILED') ||
                        failure.errorText.includes('ERR_HTTP_RESPONSE_CODE_FAILURE') ||
                        failure.errorText.includes('ERR_PROXY_AUTH_UNSUPPORTED') ||
                        failure.errorText.includes('ERR_AUTH_FAILED')
                    )) {
                        proxyAuthErrorCount++;
                        console.log('Auth error count:', proxyAuthErrorCount);
                        await removeProxy(proxy, 'uploads/proxy.txt');
                    }
                };

                

                // Set up event handlers
                page.on('request', requestHandler);
                page.on('error', errorHandler);
                page.on('requestfailed', failedHandler);

                // Set authentication
                if (username && password) {
                    try {
                        await page.authenticate({ username, password });
                    } catch (authError) {
                        proxyAuthErrorCount++;
                        console.log('Auth error count:', proxyAuthErrorCount);
                        await removeProxy(proxy, 'uploads/proxy.txt');
                        throw authError;
                    }
                }

                // Enable requests after authentication
                authenticated = true;
                await page.setUserAgent(getRandomChrome135UA());

                // Add human-like behavior before navigation
                await randomDelay(1000, 1500);
                await moveMouseRandomly(page);

                await page.goto(url, { 
                    waitUntil: 'networkidle2',
                    timeout: 60000 
                }).catch(e => console.log('Initial navigation timeout, continuing anyway...'));

                // First scroll
                await randomDelay(800, 1200);
                await humanScroll(page);

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
                } catch (error) {
                    console.log('Error interacting with iframe:', error.message);
                }

                // Clean up event listeners
                page.off('request', requestHandler);
                page.off('error', errorHandler);
                page.off('requestfailed', failedHandler);
                // page.off('response', responseHandler);

            } catch (error) {
                console.error('Session error:', error);
                if (!success) {
                    await removeProxy(proxy, 'uploads/proxy.txt');
                }
            } finally {
                if (browser) {
                    // Only remove proxy if the attempt wasn't successful
                    if (!success) {
                        await removeProxy(proxy, 'uploads/proxy.txt');
                    }
                    await browser.close();
                }
            }
        }
    } catch (error) {
        console.error('Fatal error:', error);
    }
}

module.exports = { runUrl, stopScraping }
