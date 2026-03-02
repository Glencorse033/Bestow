const http = require('http');

const data = JSON.stringify({
    title: 'Save the Ocean',
    description: 'This is a genuine campaign to clean plastic from the Pacific. It requires $50,000 for boats and nets. No guaranteed returns, just a clean ocean.',
    goal: '50000',
    creatorAddress: '0x1234567890123456789012345678901234567890'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/analyze-risk',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => console.log('API Response:', responseData));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
