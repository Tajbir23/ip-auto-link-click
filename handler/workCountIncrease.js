const fs = require('fs')

const workCountIncrease = () => {
    const today = new Date();
    const dateKey = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
    let attempts = 0;
    const maxAttempts = 5;

    function tryIncrement(resolve, reject) {
        attempts++;
        let data = {};
        try {
            if (fs.existsSync('workCount.json')) {
                data = JSON.parse(fs.readFileSync('workCount.json', 'utf8'));
            }
        } catch (error) {
            if (attempts < maxAttempts) {
                setTimeout(() => tryIncrement(resolve, reject), 100);
                return;
            }
            console.error('Error reading workCount.json:', error);
            return reject(error);
        }

        if (!data[dateKey]) {
            data[dateKey] = { count: 1 };
        } else {
            data[dateKey].count++;
        }

        try {
            fs.writeFileSync('workCount.json', JSON.stringify(data, null, 2), 'utf8');
            resolve();
        } catch (error) {
            if (attempts < maxAttempts) {
                setTimeout(() => tryIncrement(resolve, reject), 100);
            } else {
                console.error('Error writing to workCount.json:', error);
                reject(error);
            }
        }
    }

    return new Promise(tryIncrement);
};

module.exports = workCountIncrease