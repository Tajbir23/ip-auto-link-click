const puppeteer = require('puppeteer')
const removeProxy = require('./removeProxy');
const removeProxyFile = require('./removeProxyFile');
const googleDetection = require('./googleDetection');
const workCountIncrease = require('./workCountIncrease');
const handleIframe = require('./handleIframe');
const handleFacebookAddress = require('./handleFacebookAddress');
const isLoadingPage = require('./isLoadingPage');
const handleCaptcha = require('./handleCaptcha');
const UserAgent = require('user-agents');
const findAds = require('./findAds');
const logger = require('./logger');

// Add a flag to control scraping
let isScrapingActive = true;
let proxyAuthErrorCount = 0;

// Function to stop scraping
function stopScraping() {
    isScrapingActive = false;
}

// Enhanced human-like mouse movement
async function moveMouseRandomly(page) {
    const viewportSize = await page.viewport();
    
    // Generate multiple points for natural movement
    const points = [];
    const numPoints = Math.floor(Math.random() * 3) + 2; // 2-4 points
    
    for (let i = 0; i < numPoints; i++) {
        points.push({
            x: Math.floor(Math.random() * viewportSize.width),
            y: Math.floor(Math.random() * viewportSize.height)
        });
    }
    
    // Move through each point with natural acceleration/deceleration
    for (const point of points) {
        await page.mouse.move(point.x, point.y, {
            steps: Math.floor(Math.random() * 20) + 20 // 20-40 steps for smooth movement
        });
        // Random pause between movements
        await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
    }
}

// Enhanced human-like scrolling
async function humanScroll(page) {
    await page.evaluate(async () => {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Get total scroll height
        const totalHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        let currentPosition = 0;
        
        while (currentPosition < totalHeight) {
            // Random scroll amount (between 100 and 400 pixels)
            const scrollAmount = Math.floor(Math.random() * 300) + 100;
            currentPosition += scrollAmount;
            
            // Smooth scroll with easing
            const startTime = Date.now();
            const startPosition = window.pageYOffset;
            const duration = Math.random() * 500 + 500; // 500-1000ms
            
            const easeInOutQuad = (t) => {
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            };
            
            while (Date.now() - startTime < duration) {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                const easedProgress = easeInOutQuad(progress);
                const scrollPos = startPosition + (scrollAmount * easedProgress);
                window.scrollTo(0, scrollPos);
                await delay(16); // Roughly 60fps
            }
            
            // Random pause between scrolls
            await delay(Math.random() * 500 + 500);
            
            // Random small scroll up (20% chance)
            if (Math.random() < 0.2) {
                const upScroll = Math.floor(Math.random() * 100) + 50;
                currentPosition -= upScroll;
                window.scrollBy(0, -upScroll);
                await delay(Math.random() * 300 + 200);
            }
        }
    });
}

// Enhanced random delay with natural distribution
async function randomDelay(min = 800, max = 1500) {
    // Use normal distribution for more natural timing
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 4;
    
    let delay;
    do {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        delay = Math.round(mean + stdDev * z);
    } while (delay < min || delay > max);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    logger.info(`runUrl.js 111 line - Natural delay: ${delay}`);
}

// Add random keyboard behavior
async function simulateKeyboardBehavior(page) {
    // Random key presses (like accidental tab or arrow keys)
    const keys = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (Math.random() < 0.3) { // 30% chance
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        await page.keyboard.press(randomKey);
        await randomDelay(100, 300);
    }
}

// Add random viewport resizing
async function simulateViewportResize(page) {
    if (Math.random() < 0.2) { // 20% chance
        const width = 1920 + Math.floor(Math.random() * 100) - 50;
        const height = 1080 + Math.floor(Math.random() * 100) - 50;
        await page.setViewport({ width, height });
        await randomDelay(200, 500);
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const runUrl = async (url, proxy, globalGoogleErrorCount, browserId) => {
    // Reset the flag when starting new scrape
    isScrapingActive = true;
    let success = true;
    let isGoogleDetected = false;

    try {
        if (!proxy) {
            logger.error('runUrl.js 145 line - No proxy provided');
            return { success: false, isGoogleDetected: false };
        }

        if(proxyAuthErrorCount >= 10) {
            await removeProxyFile()
            proxyAuthErrorCount = 0;
            stopScraping();
            return { success: false, isGoogleDetected: false };
        }
        
        // Check if scraping should stop
        if (!isScrapingActive) {
            logger.info('runUrl.js 158 line - Scraping stopped by user');
            return { success: false, isGoogleDetected: false };
        }

        
        if(globalGoogleErrorCount >= 5) {
            stopScraping();
            return { success: false, isGoogleDetected: false };
        }
        
        const [host, port, username, password] = proxy.split(':');
        
        let browser = null;
        let currentGoogleErrorCount = globalGoogleErrorCount || 0;

        // random user agent
        const userAgent = new UserAgent({
            deviceCategory: 'desktop',
            platform: 'Win32'
        }).toString();
        
       

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
                // Delete webdriver
                delete navigator.__proto__.webdriver;
                
                // Override permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );

                // Add plugins
                Object.defineProperty(navigator, 'plugins', {
                    get: () => {
                        return [
                            {
                                0: {type: "application/x-google-chrome-pdf"},
                                description: "Portable Document Format",
                                filename: "internal-pdf-viewer",
                                length: 1,
                                name: "Chrome PDF Plugin"
                            },
                            {
                                0: {type: "application/pdf"},
                                description: "Portable Document Format",
                                filename: "internal-pdf-viewer",
                                length: 1,
                                name: "Chrome PDF Viewer"
                            },
                            {
                                0: {type: "application/x-nacl"},
                                description: "Native Client",
                                filename: "internal-nacl-plugin",
                                length: 1,
                                name: "Native Client"
                            }
                        ];
                    }
                });

                // Add languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });

                // Add chrome runtime
                window.chrome = {
                    runtime: {
                        connect: () => {},
                        sendMessage: () => {},
                        onMessage: {
                            addListener: () => {},
                            removeListener: () => {}
                        }
                    },
                    webstore: {},
                    app: {
                        isInstalled: false,
                        InstallState: {
                            DISABLED: 'disabled',
                            INSTALLED: 'installed',
                            NOT_INSTALLED: 'not_installed'
                        },
                        RunningState: {
                            CANNOT_RUN: 'cannot_run',
                            READY_TO_RUN: 'ready_to_run',
                            RUNNING: 'running'
                        }
                    }
                };

                // Override webgl vendor and renderer
                const getParameter = WebGLRenderingContext.prototype.getParameter;
                WebGLRenderingContext.prototype.getParameter = function(parameter) {
                    if (parameter === 37445) {
                        return 'Intel Inc.';
                    }
                    if (parameter === 37446) {
                        return 'Intel Iris OpenGL Engine';
                    }
                    return getParameter.apply(this, [parameter]);
                };
            });

            // Set additional headers to appear more like a real browser
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Upgrade-Insecure-Requests': '1',
                'Connection': 'keep-alive'
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
                    logger.info(`runUrl.js 311 line - Auth error count: ${proxyAuthErrorCount}`);
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
                    logger.info(`runUrl.js 326 line - Auth error count: ${proxyAuthErrorCount}`);
                    await removeProxy(proxy, 'uploads/proxy.txt');
                    await browser.close();
                    logger.info('runUrl.js 329 line - Auth error, closing browser');
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
                    logger.info(`runUrl.js 345 line - Auth error count: ${proxyAuthErrorCount}`);
                    await removeProxy(proxy, 'uploads/proxy.txt');
                    await browser.close();
                    logger.info('runUrl.js 348 line - Auth error, closing browser');
                    return;
                }
            }

            // Enable requests after authentication
            authenticated = true;
            // Use user-agents package for a random user agent (no filters)
            await page.setUserAgent(userAgent);

            // Add more human-like behavior before navigation
            await randomDelay(1000, 2000);
            await moveMouseRandomly(page);
            await simulateKeyboardBehavior(page);
            await simulateViewportResize(page);

            await page.goto(url, { waitUntil: 'networkidle0'}).catch(e => logger.error(`runUrl.js 367 line - Initial navigation timeout: ${e}`));

            await isLoadingPage(page);
            
            // More natural behavior after page load
            await randomDelay(800, 1500);
            await moveMouseRandomly(page);
            await simulateKeyboardBehavior(page);
            
            

            // Natural scrolling behavior
            // await randomDelay(500, 1000);
            // await humanScroll(page);
            // await simulateKeyboardBehavior(page);

            // check facebook address or not
            const currentUrl = page.url();
            const isFacebookUrl = currentUrl.includes('facebook.com') || 
                     currentUrl.includes('fb.com') ||
                     currentUrl.includes('fb.me');
            if(isFacebookUrl) {
                
                const result = await handleFacebookAddress(page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, currentGoogleErrorCount, success, proxy);
                if (result) {
                    success = result.success;
                    if (!result.success) {
                        isGoogleDetected = true;
                        
                        return { success: false, isGoogleDetected: true };
                    }
                }
            }

            // check iframe or not
            const iframe = await page.evaluate(() => {
                const iframes = document.querySelectorAll('iframe');
                return iframes.length > 0;
            });
            
            if(iframe) {
                logger.info(`runUrl.js 408 line - Browser ${browserId} - Iframe found`);
                const result = await handleIframe(page, randomDelay, humanScroll, googleDetection, removeProxy, workCountIncrease, currentGoogleErrorCount, success, proxy);
                if (result) {
                    success = result.success;
                    if (!result.success) {
                        isGoogleDetected = true;
                        logger.info(`runUrl.js 414 line - Browser ${browserId} - Google detected in iframe handler`);
                        return { success: false, isGoogleDetected: true };
                    }
                }
            }

            // Check for captcha with natural timing
            const hasCaptcha = await handleCaptcha(page);
            if (hasCaptcha) {
                logger.info(`runUrl.js 422 line - Browser ${browserId} - Captcha detected and handled, waiting naturally...`);
                await randomDelay(2000, 4000);
                await moveMouseRandomly(page);
                await isLoadingPage(page);
            }

            // check google detection
            const isGoogleDetection = await googleDetection(page);
            if(isGoogleDetection) {
                logger.info(`runUrl.js 431 line - Browser ${browserId} - Google detection found`);
                isGoogleDetected = true;
                return { success: false, isGoogleDetected: true };
            }

            // check ads or not
            logger.info(`runUrl.js 438 line - Browser ${browserId} - Checking ads...`);
            await findAds(page);
            logger.info(`runUrl.js 440 line - Browser ${browserId} - Ads checked`);
            // increase work count
            if(success) {
                try {
                    logger.info(`runUrl.js 439 line - Browser ${browserId} - Starting workCountIncrease...`);
                    workCountIncrease();
                    logger.info(`runUrl.js 441 line - Browser ${browserId} - workCountIncrease completed`);
                } catch (error) {
                    logger.error(`runUrl.js 443 line - Browser ${browserId} - Failed to increase work count: ${error}`);
                }
            }

            
            // Clean up event listeners
            page.off('request', requestHandler);
            page.off('error', errorHandler);
            page.off('requestfailed', failedHandler);

        } catch (error) {
            logger.error(`runUrl.js 455 line - Browser ${browserId} - Session error: ${error}`);
            success = false;
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
        logger.error(`runUrl.js 468 line - Fatal error: ${error}`);
    }

    return { success, isGoogleDetected };
}

module.exports = { runUrl, stopScraping }
