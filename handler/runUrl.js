const fs = require('fs')
const puppeteer = require('puppeteer')
const removeProxy = require('./removeProxy');
const removeProxyFile = require('./removeProxyFile');
const googleDetection = require('./googleDetection');
const workCountIncrease = require('./workCountIncrease');
const handleIframe = require('./handleIframe');
const handleFacebookAddress = require('./handleFacebookAddress');
const isLoadingPage = require('./isLoadingPage');
const UserAgent = require('user-agents');

// Add a flag to control scraping
let isScrapingActive = true;
let proxyAuthErrorCount = 0;
let googleErrorCount = 0;

// Function to stop scraping
function stopScraping() {
    isScrapingActive = false;
}

// Random delay between actions
const randomDelay = async (min = 800, max = 1500) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
    console.log('randomDelay', delay);
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

const runUrl = async (url, proxy) => {
    // Reset the flag when starting new scrape
    isScrapingActive = true;

    try {
        if (!proxy) {
            console.log('No proxy provided');
            return;
        }

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
        
        const [host, port, username, password] = proxy.split(':');
        console.log(proxy)
        let browser = null;
        let success = false;

        try {
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
                    await browser.close();
                    console.log('Auth error, closing browser');
                    return;
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
                    await browser.close();
                    console.log('Auth error, closing browser');
                    return;
                }
            }

            // Enable requests after authentication
            authenticated = true;
            // Use user-agents package for a random Chrome user agent
            const userAgent = new UserAgent({
                deviceCategory: 'desktop',
                platform: 'Win32',
                browserName: 'Chrome'
            });
            await page.setUserAgent(userAgent.toString());

            // Add human-like behavior before navigation
            await randomDelay(1000, 1500);
            await moveMouseRandomly(page);

            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            }).catch(e => console.log('Initial navigation timeout, continuing anyway...'));

            await isLoadingPage(page);
            
            // First scroll
            await randomDelay(800, 1200);
            await humanScroll(page);

            // check facebook address or not
            const currentUrl = page.url();
            const isFacebookUrl = currentUrl.includes('facebook.com') || 
                     currentUrl.includes('fb.com') ||
                     currentUrl.includes('fb.me');
            if(isFacebookUrl) {
                console.log('Facebook address found');
                await handleFacebookAddress(page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, googleErrorCount, success);
            }

            // check iframe or not
            const iframe = await page.evaluate(() => {
                const iframes = document.querySelectorAll('iframe');
                return iframes.length > 0;
            });
            
            if(iframe) {
                console.log('Iframe found');
                await handleIframe(page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, googleErrorCount, success);
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
                await sleep(30000);
                await browser.close();
            }
            // Always remove the proxy from the file after use
            await removeProxy(proxy, 'uploads/proxy.txt');
        }
    } catch (error) {
        console.error('Fatal error:', error);
    }
}

module.exports = { runUrl, stopScraping }
