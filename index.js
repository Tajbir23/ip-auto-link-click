const express = require('express')
const app = express()
const multer = require('multer')
const removeProxyFile = require('./handler/removeProxyFile')
const uploadProxy = require('./handler/uploadProxy')
const { runUrl, stopScraping } = require('./handler/runUrl')
const totalWorkCount = require('./handler/totalWorkCount')
const todayWorkCount = require('./handler/todayWorkCount')
const logger = require('./handler/logger')
const path = require('path')
const fs = require('fs')
const net = require('net')
const runWork = require('./handler/runWork')
const checkLogs = require('./handler/checkLogs')
const terminalLogs = require('./handler/terminal-logs')
const remainingIp = require('./handler/remaining-ip')

function findAvailablePort(startPort, callback) {
    const server = net.createServer();
    server.unref();
    server.on('error', () => findAvailablePort(startPort + 1, callback));
    server.listen({ port: startPort }, () => {
        const port = server.address().port;
        server.close(() => callback(port));
    });
}

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const upload = multer({ dest: 'uploads/' })

app.get('/', (req, res) => {
    res.render('index')
})


app.post('/scrape', upload.single('file'), async (req, res) => {
    const file = req.file?.path
    const { url } = req.body
    
    await removeProxyFile()
    await uploadProxy(file)

    await runWork(url)
    res.send('Proxy uploaded and all proxies processed')
})

app.get('/reset-ip', (req, res) => {
    res.render('resetIp')
})

app.post('/reset-ip', async(req, res) => {
    await removeProxyFile()
    res.redirect('/')
})

app.get('/stop-scrape', (req, res) => {
    res.render('stopScrape')
})

app.post('/stop-scrape', async(req, res) => {
    logger.info('index.js 64 line - Stopping scrape process...');
    stopScraping();
    res.redirect('/');
})

app.get('/resume-scrape', (req, res) => {
    res.render('resumeScrape')
})

app.post('/resume-scrape', async(req, res) => {
    await runWork(req.body.url)
    res.redirect('/')
})

app.get('/total-work-count', async(req, res) => {
    const workCount = await totalWorkCount()
    res.json({ total_ip_count: workCount })
})

app.get('/today-work-count', async(req, res) => {
    const workCount = await todayWorkCount()
    res.json({ today_ip_count: workCount })
})

// Add route for viewing logs
app.get('/logs', checkLogs)

// Add route for viewing terminal logs
app.get('/terminal', (req, res) => {
    res.render('terminal');
});

app.get('/restart-server', (req, res) => {
    const fs = require('fs');
    try {
        // Clear terminal
        process.stdout.write('\x1Bc');
        
        // Touch the file to trigger nodemon restart
        const time = new Date();
        fs.utimesSync('index.js', time, time);
        
        res.redirect('/');
    } catch (error) {
        console.error('Error during restart:', error);
        res.status(500).send('Restart failed');
    }
})

app.get('/server-list', (req, res) => {
    const { execSync } = require('child_process');
    try {
        // Get all Node.js process IDs
        const tasklistOutput = execSync('tasklist /FI "IMAGENAME eq node.exe" /NH').toString();
        const nodePids = tasklistOutput.split('\n')
            .filter(line => line.trim())
            .map(line => line.split(/\s+/)[1]);
        
        console.log('Node.js PIDs:', nodePids);
        
        // Using Windows netstat command
        const serverList = execSync('netstat -ano').toString().trim();
        
        const ports = serverList.split('\n')
            .filter(line => line.includes('LISTENING'))
            .map(line => {
                const parts = line.trim().split(/\s+/);
                const address = parts[1];
                const pid = parts[parts.length - 1];
                return {
                    port: address.split(':')[1],
                    pid: pid,
                    address: address
                };
            })
            .filter(item => item.port && nodePids.includes(item.pid))
            .map(item => ({
                port: item.port,
                pid: item.pid,
                address: item.address
            }));
        
        console.log('All Node.js ports:', ports);
        res.json({ server_list: ports });
    } catch (error) {
        logger.error('index.js 149 line - Error getting server list: ' + error.message);
        res.status(500).send('Failed to get server list');
    }
})

// WebSocket endpoint for real-time terminal logs
app.get('/terminal-logs', terminalLogs);

app.get('/remaining-ip', remainingIp)

findAvailablePort(3000, (PORT) => {
    app.listen(PORT, async () => {
        // Write PID file for this server
        fs.writeFileSync(`server-${PORT}.pid`, process.pid.toString());
        // Remove PID file on exit
        process.on('exit', () => { try { fs.unlinkSync(`server-${PORT}.pid`); } catch {} });
        process.on('SIGINT', () => { try { fs.unlinkSync(`server-${PORT}.pid`); } catch {} process.exit(); });
        process.on('SIGTERM', () => { try { fs.unlinkSync(`server-${PORT}.pid`); } catch {} process.exit(); });
        try {
            const { execSync } = require('child_process');
            
            // Check for updates from git
            logger.info('index.js 111 line - Checking for updates...');
            try {
                // Fetch latest changes
                execSync('git fetch', { stdio: 'inherit' });
                
                // Get current branch name
                const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
                logger.info(`index.js 118 line - Current branch: ${currentBranch}`);
                
                // Check if we're behind the remote
                const behindCount = execSync(`git rev-list HEAD..origin/${currentBranch} --count`).toString().trim();
                
                if (parseInt(behindCount) > 0) {
                    logger.info('index.js 124 line - Updates found, attempting to merge...');
                    
                    try {
                        // Try to merge with auto-stash and theirs strategy
                        execSync('git config pull.rebase false', { stdio: 'inherit' });
                        execSync('git stash', { stdio: 'inherit' });
                        execSync(`git pull -X theirs`, { stdio: 'inherit' });
                        
                        // Try to apply stashed changes
                        try {
                            execSync('git stash pop', { stdio: 'inherit' });
                        } catch (stashError) {
                            logger.warn('index.js 136 line - Note: Stashed changes could not be applied, but update succeeded');
                        }
                        
                        // Install dependencies
                        logger.info('index.js 139 line - Installing dependencies...');
                        execSync('npm install', { stdio: 'inherit' });
                        
                        logger.info('index.js 142 line - Successfully updated, merged changes, and installed dependencies');
                    } catch (mergeError) {
                        logger.error('index.js 145 line - Error during merge: ' + mergeError.message);
                        // Attempt to abort any pending merge
                        try {
                            execSync('git merge --abort', { stdio: 'inherit' });
                        } catch (abortError) {
                            // Ignore abort errors
                        }
                        logger.warn('index.js 153 line - Merge aborted. Please resolve conflicts manually');
                    }
                } else {
                    logger.info('index.js 156 line - Already up to date');
                }
            } catch (error) {
                logger.error('index.js 159 line - Error during git operations: ' + error.message);
            }
            
            logger.info(`index.js 162 line - Server is running on http://localhost:${PORT}`);
        } catch (error) {
            logger.error('index.js 165 line - Error during update check: ' + error.message);
        }
    });
});