const fs = require('fs');
const logger = require('./logger');

const workCountIncrease = async (url) => {
    logger.info('workCountIncrease.js 5 line - Starting workCountIncrease function');
    try {
        const filePath = 'workCount.json';
        let data = {};

        // Try to read existing file
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            logger.info('workCountIncrease.js 13 line - Reading existing workCount.json');
            data = JSON.parse(fileContent);
            logger.info('workCountIncrease.js 15 line - Current data:', data);
        } catch (err) {
            logger.info('workCountIncrease.js 17 line - workCount.json does not exist, creating new file');
        }

        const dateKey = new Date().toISOString().split('T')[0];

        // Initialize date entry if it doesn't exist
        if (!data[dateKey]) {
            logger.info('workCountIncrease.js 23 line - First entry for today');
            data[dateKey] = {
                urls: {}
            };
        }

        // Initialize or increment URL count for today
        if (!data[dateKey].urls[url]) {
            logger.info(`workCountIncrease.js - First entry for URL ${url} today`);
            data[dateKey].urls[url] = 1;
        } else {
            logger.info(`workCountIncrease.js - Incrementing count for URL ${url} from ${data[dateKey].urls[url]}`);
            data[dateKey].urls[url]++;
        }

        // Calculate total count for today
        data[dateKey].totalCount = Object.values(data[dateKey].urls).reduce((sum, count) => sum + count, 0);

        // Write updated data back to file
        logger.info('workCountIncrease.js 31 line - Writing updated data:', data);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        logger.info('workCountIncrease.js 33 line - Successfully updated work count');

        return true;
    } catch (error) {
        logger.error(`workCountIncrease.js 36 line - Error in workCountIncrease: ${error}`);
        return false;
    }
};

module.exports = workCountIncrease;