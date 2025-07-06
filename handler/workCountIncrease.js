const fs = require('fs');
const logger = require('./logger');

const workCountIncrease = async () => {
    logger.info('Starting workCountIncrease function');
    try {
        const filePath = 'workCount.json';
        let data = {};

        // Try to read existing file
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            logger.info('Reading existing workCount.json');
            data = JSON.parse(fileContent);
            logger.info('Current data:', data);
        } catch (err) {
            logger.info('workCount.json does not exist, creating new file');
        }

        const dateKey = new Date().toISOString().split('T')[0];

        if (!data[dateKey]) {
            logger.info('First entry for today');
            data[dateKey] = { count: 1 };
        } else {
            logger.info('Incrementing count for today from', data[dateKey].count);
            data[dateKey].count++;
        }

        // Write updated data back to file
        logger.info('Writing updated data:', data);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        logger.info('Successfully updated work count');

        return true;
    } catch (error) {
        logger.error('Error in workCountIncrease:', error);
        return false;
    }
};

module.exports = workCountIncrease;