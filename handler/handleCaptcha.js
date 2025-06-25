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
                document.querySelector('div[style*="z-index: 2000000000"]')
            ];

            return captchaIndicators.some(indicator => indicator);
        });

        if (!hasCaptcha) {
            console.log('No reCAPTCHA detected');
            return false;
        }

        console.log('reCAPTCHA detected, waiting for frames to load...');

        // Wait for reCAPTCHA iframe to be ready
        await page.waitForFunction(() => {
            const frames = document.querySelectorAll('iframe');
            return Array.from(frames).some(frame => 
                frame.src.includes('recaptcha') || 
                frame.title.includes('recaptcha') ||
                frame.name.startsWith('c-')
            );
        }, { timeout: 5000 }).catch(() => console.log('Timeout waiting for reCAPTCHA frames'));

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
        }

        // Wait for potential challenge frame
        await page.waitForFunction(() => {
            const frames = document.querySelectorAll('iframe');
            return Array.from(frames).some(frame => 
                frame.src.includes('bframe') || 
                (frame.title && frame.title.includes('challenge'))
            );
        }, { timeout: 5000 }).catch(() => console.log('No challenge frame appeared'));

        // Give some time for the challenge to load if it appears
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if verification button exists and try to click it
        const hasVerifyButton = await page.evaluate(() => {
            const verifyButton = document.querySelector('#recaptcha-verify-button') || 
                               document.querySelector('button[type="submit"]');
            if (verifyButton) {
                verifyButton.click();
                return true;
            }
            return false;
        });

        if (hasVerifyButton) {
            console.log('Clicked verify button');
            // Wait for navigation or page changes
            await isLoadingPage(page);
        }

        // Return true to indicate captcha was detected and handled
        return true;

    } catch (error) {
        console.error('Error handling reCAPTCHA:', error.message);
        return false;
    }
}

module.exports = handleCaptcha; 