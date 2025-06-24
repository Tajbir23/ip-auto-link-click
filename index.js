const express = require('express')
const app = express()
const multer = require('multer')
const removeProxyFile = require('./handler/removeProxyFile')
const uploadProxy = require('./handler/uploadProxy')
const { runUrl, stopScraping } = require('./handler/runUrl')
const totalWorkCount = require('./handler/totalWorkCount')
const todayWorkCount = require('./handler/todayWorkCount')

const net = require('net');
const fs = require('fs');

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
    await runUrl(url)
    res.send('Proxy uploaded and renamed to proxy.txt')
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
    console.log('Stopping scrape process...');
    stopScraping();
    res.redirect('/');
})

app.get('/resume-scrape', (req, res) => {
    res.render('resumeScrape')
})

app.post('/resume-scrape', async(req, res) => {
    await runUrl(req.body.url)
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
            console.log('Checking for updates...');
            try {
                // Fetch latest changes
                execSync('git fetch', { stdio: 'inherit' });
                
                // Get current branch name
                const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
                console.log(`Current branch: ${currentBranch}`);
                
                // Check if we're behind the remote
                const behindCount = execSync(`git rev-list HEAD..origin/${currentBranch} --count`).toString().trim();
                
                if (parseInt(behindCount) > 0) {
                    console.log('Updates found, attempting to merge...');
                    
                    try {
                        // Try to merge with auto-stash and theirs strategy
                        execSync('git config pull.rebase false', { stdio: 'inherit' });
                        execSync('git stash', { stdio: 'inherit' });
                        execSync(`git pull -X theirs`, { stdio: 'inherit' });
                        
                        // Try to apply stashed changes
                        try {
                            execSync('git stash pop', { stdio: 'inherit' });
                        } catch (stashError) {
                            console.log('Note: Stashed changes could not be applied, but update succeeded');
                        }
                        
                        // Install dependencies
                        console.log('Installing dependencies...');
                        execSync('npm install', { stdio: 'inherit' });
                        
                        console.log('Successfully updated, merged changes, and installed dependencies');
                    } catch (mergeError) {
                        console.error('Error during merge:', mergeError.message);
                        // Attempt to abort any pending merge
                        try {
                            execSync('git merge --abort', { stdio: 'inherit' });
                        } catch (abortError) {
                            // Ignore abort errors
                        }
                        console.log('Merge aborted. Please resolve conflicts manually');
                    }
                } else {
                    console.log('Already up to date');
                }
            } catch (error) {
                console.error('Error during git operations:', error.message);
            }
            
            console.log(`Server is running on http://localhost:${PORT}`);
        } catch (error) {
            console.error('Error during update check:', error.message);
        }
    });
});