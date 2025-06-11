const express = require('express')
const app = express()
const multer = require('multer')
const removeProxyFile = require('./handler/removeProxyFile')
const uploadProxy = require('./handler/uploadProxy')
const { runUrl, stopScraping } = require('./handler/runUrl')


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
app.listen(3000, () => {
    console.log(`server is running on http://localhost:3000`)
})