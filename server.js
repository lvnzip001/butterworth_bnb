const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.post('/initiate-payment', async (req, res) => {
    console.log('Received payment request:', req.body);

    if (!req.body.amount || !req.body.transactionReference) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing amount or transactionReference' });
    }

    const paymentData = {
        siteCode: 'EFU-EFU-001', // Replace with your actual site code
        countryCode: 'ZA',
        currencyCode: 'ZAR',
        amount: req.body.amount,
        transactionReference: req.body.transactionReference,
        bankReference: 'TEST-INV-12345',
        cancelUrl: 'https://81af-165-0-43-43.ngrok-free.app/cancel.html',
        errorUrl: 'https://81af-165-0-43-43.ngrok-free.app/error.html',
        successUrl: 'https://81af-165-0-43-43.ngrok-free.app/success.html',
        notifyUrl: 'https://81af-165-0-43-43.ngrok-free.app/notify',
        isTest: true
    };
    console.log('Payment Data:', paymentData);

    const privateKey = 'b15f477b60dc4374991493b6a0d8f5a3'; // Replace with your actual private key
    const signatureString = [
        paymentData.siteCode,
        paymentData.countryCode,
        paymentData.currencyCode,
        paymentData.amount,
        paymentData.transactionReference,
        paymentData.bankReference,
        paymentData.cancelUrl,
        paymentData.errorUrl,
        paymentData.successUrl,
        paymentData.notifyUrl,
        paymentData.isTest
    ].map(String).join('').toLowerCase() + privateKey.toLowerCase();
    console.log('Signature String:', signatureString);

    paymentData.hashCheck = crypto.createHash('sha512').update(signatureString).digest('hex');
    console.log('Generated hashCheck:', paymentData.hashCheck);

    const apiUrl = 'https://stagingapi.ozow.com/PostPaymentRequest';
    const apiKey = '4951cd35ef734aa9b4d2c460ef8262fe'; // Replace with your actual API key
    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'ApiKey': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
    };
    console.log('Sending request to OZOW:', requestOptions);

    try {
        const response = await fetch(apiUrl, requestOptions);
        const result = await response.json();
        console.log('OZOW Response Status:', response.status);
        console.log('OZOW Response Body:', result);

        if (!response.ok) {
            console.error('OZOW API Error:', result);
            return res.status(500).json({ error: 'Failed to initiate payment', details: result });
        }

        console.log('Payment initiation successful');
        res.json({ paymentUrl: result.paymentUrl });
    } catch (error) {
        console.error('Unexpected Error:', error.message, error.stack);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.post('/notify', (req, res) => {
    console.log('Notification from OZOW:', req.body);
    res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on port 3000'));