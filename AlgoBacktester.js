// nodemon AlgoBacktester.js
//  --- 1.  SETUP ---------------------------------------------------
const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;
const multiparty = require('multiparty');
const fs = require('fs');
app.use(express.json()); // for AJAX
// --- 2. Middleware --------------------------------------------

// Middleware for static files and URL encoded
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


// --- 3. ROUTES ------------------------------------------------

// 2) Serving of static files from a directory
// serving static files from this html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// downloading the CSV data files using URl
const FILES_DIR = path.join(__dirname, 'public'); // where files live
// we used this sanitize so users can’t trick the server into loading dangerous paths like
// ../../../../etc/passwd (which would try to read files outside your project).
function sanitize(filename) {
    // remove slashes and weird characters from files
    // only keeps letters(A-Z), numbers(0-9), dot,dash,- and remove everything else
    return filename.replace(/[^a-zA-Z0-9._-]/g, '');
}
// /files/sample.csv -> trigger a download
app.get('/files/:name', (req, res) => {
    const requested = sanitize(req.params.name || '');
    // If nothing given or bad name
    if (!requested) return res.status(400).send('Invalid filename.');
    res.download(requested, requested, { root: FILES_DIR }, (err) => {
        if (err) {
            // Send proper error if file not found
            if (!res.headersSent) {
                res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
            }
            return;
        }
        console.log(`File downloaded: ${requested}`);
    });
});

// Example route to test 500 error
app.get('/error', (req, res, next) => {
    next(new Error('Simulated server crash 500'));
});

// Example route to test 404 error
app.get('/404', (req, res, next) => {
    next();
});


// 3)  ROUTE PARAMETERS AND Querystring parameters
// go to http://localhost:3000/dataset/TSLA
app.get('/dataset/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    if (!symbol) return res.status(400).send('Invalid symbol.');
    res.send(
        `
    <h1>Selected dataset: ${symbol}</h1>
    <p>This proves route parameters work.</p>
    <a href="/">Home</a>
  `);
});
// Querystring parameters
// to http://localhost:3000/backtest?fast=5&slow=20  fast/slow = MOVING Average Trading in stock stratergie
app.get('/backtest', (req, res) =>{
    /*
I am doing these querystring as integers because In Algorithmic Backtester, these fast and slow values represent:
Moving average window sizes (e.g. 5-day vs 20-day) They’re used in math calculations
If I don’t convert them to integers, the algorithm would break or give wrong results
because it would be trying to do math with strings, not numbers.
     */
    const fast = parseInt(req.query.fast || '3', 10);  // default = 3  and radix = 10 means base 10 decimal (comp ARC concept)
    const slow = parseInt(req.query.slow || '5', 10);  // default = 5
    if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
        return res.status(400).send(`
            <h1>Invalid parameters</h1>
            <p>Please use the format: <b>/backtest?fast=3&slow=5</b></p>
            <p>Ensure both are positive numbers and fast &lt; slow.</p>
            <a href="/">Home</a>
            `);
    }
    res.send(`<h1>Backtest Parameters</h1>
                   <p><b>Fast Moving Average (MA):</b> ${fast}</p>
                   <p><b>Slow Moving Average (MA):</b> ${slow}</p>
            <p>These values will later feed into the moving average strategy.</p>
            <a href="/">Home</a>
  `);
});

// 4) Handle information from http-bodies (url-encoded, or general form-data through a body-parser
app.post('/backtest', (req, res) => {
    const fast = parseInt(req.body.fast || '3', 10);
    const slow = parseInt(req.body.slow || '5', 10);
    if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
        return res.status(400).send(`
      <h1>Invalid parameters</h1>
      <p>Submit positive integers with fast &lt; slow.</p>
      <a href="/">Home</a>
    `);
    }
    // For just Now, (algorithm wiring comes later)
    res.send(`
    <h1>Backtest (POST body received)</h1>
    <p><b>Fast MA:</b> ${fast}</p>
    <p><b>Slow MA:</b> ${slow}</p>
    <p>Parsed from req.body using urlencoded parser.</p>
    <a href="/">Home</a>
  `);
});

// 6) B. Upload files via multiparty
const fields = {}; // Stores any text fields (non-file inputs) that come along with the upload.
let uploadedFile = null;
let rejectedFile = false;
app.post('/upload', (req, res) => {
    const form = new multiparty.Form({ uploadDir: FILES_DIR }); // Multiparty form parser
    form.on('field', (name, value) => {
        fields[name] = value;
    });

    form.on('file', (name, file) => {
        console.log(`Received file: ${file.originalFilename}`);

        const isCsv =
            /\.csv$/i.test(file.originalFilename) ||
            /csv/i.test(file.headers['content-type'] || '');
        if (!isCsv) {
            console.log(` -Rejected non-CSV file: ${file.originalFilename}`);
            rejectedFile = true;
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error('Error deleting non-CSV file:', err);
            }
        } else {
            uploadedFile = file;
        }
    });

    form.on('error', (err) => {
        console.error('Multiparty error:', err);
        res
            .status(400)
            .send(`<h1>Upload error</h1><p>${err.message}</p><a href="/">Back</a>`);
    });

    //  When parsing finishes
    form.on('close', () => {
        if (rejectedFile) {
            return res
                .status(400)
                .send('<h1>Only CSV files are allowed </h1><a href="/">Back</a>');
        }

        if (!uploadedFile) {
            return res
                .status(400)
                .send('<h1>No file uploaded</h1><a href="/">Back</a>');
        }


        res.send(`
      <h1> Upload Successful</h1>
      <p><b>Original name:</b> ${uploadedFile.originalFilename }</p>
      <p><b>Saved to:</b> ${uploadedFile.path}</p>
      <p><b>Size:</b> ${uploadedFile.size / 1024} KB</p>
      <a href="/">Home</a>
    `);
    });

    form.parse(req);
});

// 7) AJAX USING FETCH()
// after reciving the jSON from the script "fast": 3, "slow": 5
app.post('/api/backtest-preview', (req, res) => {
    const fast = parseInt(req.body.fast, 10);
    const slow = parseInt(req.body.slow, 10);

    if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
        return res.status(400).json({ ok: false, message: 'Use positive integers and fast MA < slow MA' });
    }
    // TEMP SENDING TO JSON (MA logic for later)
    res.json({
        ok: true,
        fast,
        slow,
        note: 'These parameters are valid and ready for backtest.'
    });
});

// --- 4. Custom Handlers-----------------------------------------------

// 1) • Custom 404- and 500-handlers
// Custom 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Custom 500  (4 parameters)
// we need all 4 arguments because if we only have (req, res), Express thinks it’s a normal route (like 404).
// now express will recognize it as error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});