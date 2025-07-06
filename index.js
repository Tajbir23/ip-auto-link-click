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
    logger.info('Stopping scrape process...');
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

// WebSocket endpoint for real-time terminal logs
app.get('/terminal-logs', terminalLogs);

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
            logger.info('Checking for updates...');
            try {
                // Fetch latest changes
                execSync('git fetch', { stdio: 'inherit' });
                
                // Get current branch name
                const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
                logger.info(`Current branch: ${currentBranch}`);
                
                // Check if we're behind the remote
                const behindCount = execSync(`git rev-list HEAD..origin/${currentBranch} --count`).toString().trim();
                
                if (parseInt(behindCount) > 0) {
                    logger.info('Updates found, attempting to merge...');
                    
                    try {
                        // Try to merge with auto-stash and theirs strategy
                        execSync('git config pull.rebase false', { stdio: 'inherit' });
                        execSync('git stash', { stdio: 'inherit' });
                        execSync(`git pull -X theirs`, { stdio: 'inherit' });
                        
                        // Try to apply stashed changes
                        try {
                            execSync('git stash pop', { stdio: 'inherit' });
                        } catch (stashError) {
                            logger.warn('Note: Stashed changes could not be applied, but update succeeded');
                        }
                        
                        // Install dependencies
                        logger.info('Installing dependencies...');
                        execSync('npm install', { stdio: 'inherit' });
                        
                        logger.info('Successfully updated, merged changes, and installed dependencies');
                    } catch (mergeError) {
                        logger.error('Error during merge: ' + mergeError.message);
                        // Attempt to abort any pending merge
                        try {
                            execSync('git merge --abort', { stdio: 'inherit' });
                        } catch (abortError) {
                            // Ignore abort errors
                        }
                        logger.warn('Merge aborted. Please resolve conflicts manually');
                    }
                } else {
                    logger.info('Already up to date');
                }
            } catch (error) {
                logger.error('Error during git operations: ' + error.message);
            }
            
            console.log(`Server is running on http://localhost:${PORT}`);
            logger.info(`Server is running on http://localhost:${PORT}`);
        } catch (error) {
            logger.error('Error during update check: ' + error.message);
        }
    });
});