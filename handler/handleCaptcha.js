const isLoadingPage = require('./isLoadingPage');

async function handleCaptcha(page) {
    try {
        console.log('Checking for reCAPTCHA...');
        
        // Check if reCAPTCHA is present
        const hasCaptcha = await page.evaluate(() => {
            // Check for various reCAPTCHA elements
            const captchaIndicators = [
                // Standard reCAPTCHA elements
                document.querySelector('.g-recaptcha'),
                document.querySelector('iframe[src*="recaptcha"]'),
                document.querySelector('iframe[title*="recaptcha"]'),
                document.querySelector('div[class*="g-recaptcha"]'),
                // Google's verification page elements
                document.querySelector('form#captcha-form'),
                document.querySelector('input[name="continue"]'),
                document.querySelector('#recaptcha'),
                document.querySelector('img[alt="captcha"]'),
                document.querySelector('form[action*="/sorry/index"]'),
                // Additional verification elements
                document.querySelector('iframe[name*="c-"]'),
                document.querySelector('div[style*="z-index: 2000000000"]'),
                // Additional captcha indicators
                document.querySelector('div[class*="captcha"]'),
                document.querySelector('div[id*="captcha"]'),
                document.querySelector('iframe[src*="captcha"]'),
                document.querySelector('div[aria-label*="challenge"]')
            ];

            return captchaIndicators.some(indicator => indicator);
        });

        if (!hasCaptcha) {
            console.log('No reCAPTCHA detected');
            return false;
        }

        console.log('reCAPTCHA detected, waiting for frames to load...');

        // Wait for reCAPTCHA iframe to be ready with increased timeout
        await page.waitForFunction(() => {
            const frames = document.querySelectorAll('iframe');
            return Array.from(frames).some(frame => 
                frame.src.includes('recaptcha') || 
                frame.title.includes('recaptcha') ||
                frame.name.startsWith('c-')
            );
        }, { timeout: 10000 }).catch(() => console.log('Timeout waiting for reCAPTCHA frames'));

        // Get all frames
        const frames = await page.frames();
        const recaptchaFrame = frames.find(frame => 
            frame.url().includes('recaptcha') || 
            frame.name().startsWith('c-')
        );

        if (!recaptchaFrame) {
            console.log('Could not find reCAPTCHA frame');
            return false;
        }

        console.log('Found reCAPTCHA frame, checking type...');

        // Check if it's a checkbox reCAPTCHA
        const hasCheckbox = await recaptchaFrame.evaluate(() => {
            return !!document.querySelector('.recaptcha-checkbox');
        }).catch(() => false);

        if (hasCheckbox) {
            console.log('Checkbox reCAPTCHA found, attempting to click...');
            await recaptchaFrame.click('.recaptcha-checkbox').catch(() => console.log('Failed to click checkbox'));
            
            // Wait longer for the challenge frame
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Wait for challenge frame with increased timeout
        const challengeFrame = await page.waitForFunction(() => {
            const frames = document.querySelectorAll('iframe');
            return Array.from(frames).find(frame => 
                frame.src.includes('bframe') || 
                (frame.title && frame.title.includes('challenge'))
            );
        }, { timeout: 10000 }).catch(() => {
            console.log('No challenge frame appeared');
            return null;
        });

        if (challengeFrame) {
            console.log('Challenge frame detected, human intervention required');
            // Wait for human to solve the challenge
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            // Check if the challenge was solved
            const isSolved = await page.evaluate(() => {
                const successIndicators = [
                    document.querySelector('.recaptcha-success'),
                    document.querySelector('[aria-label="You are verified"]'),
                    !document.querySelector('.recaptcha-checkbox-unchecked'),
                    document.querySelector('.recaptcha-checkbox-checked')
                ];
                return successIndicators.some(indicator => indicator);
            });

            if (isSolved) {
                console.log('Challenge appears to be solved');
                await isLoadingPage(page);
                return true;
            }
        }

        // Check for verification button with expanded selectors
        const hasVerifyButton = await page.evaluate(() => {
            const verifySelectors = [
                '#recaptcha-verify-button',
                'button[type="submit"]',
                'input[type="submit"]',
                'button[class*="verify"]',
                'button[class*="submit"]'
            ];
            
            for (const selector of verifySelectors) {
                const button = document.querySelector(selector);
                if (button) {
                    console.log('Found verify button:', selector);
                    button.click();
                    return true;
                }
            }
            return false;
        });

        if (hasVerifyButton) {
            console.log('Clicked verify button');
            await isLoadingPage(page);
            // Wait a bit longer after verification
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Return true to indicate captcha was detected and handled
        return true;

    } catch (error) {
        console.error('Error handling reCAPTCHA:', error.message);
        return false;
    }
}

module.exports = handleCaptcha; 