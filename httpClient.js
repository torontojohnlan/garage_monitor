//import * as https from 'https';
const https = require('https');
const options = {
    method: 'GET'
};
let request = https.request('https://garage-monitor.azurewebsites.net/', options, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Did not get an OK from the server. Code: ${res.statusCode}`);
        res.resume();
        return;
    }
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('close', () => {
        console.log('Retrieved all data');
        console.log(data);
    });
});
request.end();
request.on('error', (err) => {
    console.error(`Encountered an error trying to make a request: ${err.message}`);
});
//# sourceMappingURL=httpClient.js.map