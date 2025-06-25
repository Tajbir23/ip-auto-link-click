const fs = require('fs');

const workCountIncrease = () => {
    console.log('Starting workCountIncrease function');
    const today = new Date();
    const dateKey = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
    
    // Initialize data
    let data = {};
    
    try {
        // Check if file exists and read it
        if (fs.existsSync('workCount.json')) {
            console.log('Reading existing workCount.json');
            const fileContent = fs.readFileSync('workCount.json', 'utf8');
            data = JSON.parse(fileContent);
            console.log('Current data:', data);
        } else {
            console.log('workCount.json does not exist, creating new file');
        }

        // Update or create count for today
        if (!data[dateKey]) {
            console.log('First entry for today');
            data[dateKey] = { count: 1 };
        } else {
            console.log('Incrementing count for today from', data[dateKey].count);
            data[dateKey].count++;
        }

        // Write updated data synchronously
        console.log('Writing updated data:', data);
        fs.writeFileSync('workCount.json', JSON.stringify(data, null, 2));
        console.log('Successfully updated work count');
        
        return data[dateKey].count;
    } catch (error) {
        console.error('Error in workCountIncrease:', error);
        throw error;
    }
};

module.exports = workCountIncrease;