// document.getElementById('payWithOzow').addEventListener('click', function() {
//   // 1. Payment Data Configuration
//   const paymentData = {
//       siteCode: 'EFU-EFU-001',
//       countryCode: 'ZA',
//       currencyCode: 'ZAR',
//       amount: '0.01',  // Minimal amount from documentation
//       transactionReference: 'TEST-ORDER-' + Date.now(),
//       bankReference: 'TEST-INV-12345',
//       cancelUrl: 'http://localhost:5501/cancel.html',
//       errorUrl: 'http://localhost:5501/error.html',
//       successUrl: 'http://localhost:5501/success.html',
//       notifyUrl: 'http://localhost:5501/notify.html',
//       isTest: true
//   };

//   // 2. Generate HashCheck
//   const privateKey = 'REDACTED';  // Your test Private Key
//   paymentData.hashCheck = generateOzowSignature(paymentData, privateKey);
//   console.log('Generated HashCheck:', paymentData.hashCheck);

//   // 3. API Request Options
//   const apiKey = 'REDACTED';  // Replace with your actual test API Key

//   const options = {
//       method: 'POST',
//       headers: {
//           'Accept': 'application/json',
//           'ApiKey': apiKey,
//           'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(paymentData)
//   };
//   console.log('Request Payload:', JSON.stringify(paymentData, null, 2));

//   // 4. Make API Request
//   fetch('https://stagingapi.ozow.com/PostPaymentRequest', options)
//       .then(response => {
//           console.log('Response Status:', response.status);
//           console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
//           if (!response.ok) {
//               return response.text().then(text => {
//                   throw new Error(`HTTP error! Status: ${response.status}, Details: ${text}`);
//               });
//           }
//           return response.text();  // Expect plain text URL
//       })
//       .then(data => {
//           console.log('Payment URL:', data);
//           window.location.href = data;  // Redirect to payment URL
//       })
//       .catch(error => {
//           console.error('Payment failed:', error.message);
//           console.error('Full Error Object:', error);
//           alert('Payment initialization failed. Check console for details.');
//       });
// });

// // Signature Generation Function
function generateOzowSignature(data, privateKey) {
  const fields = [
      'siteCode', 'countryCode', 'currencyCode', 'amount', 'transactionReference',
      'bankReference', 'cancelUrl', 'errorUrl', 'successUrl', 'notifyUrl', 'isTest'
  ];
  let signatureString = '';
  fields.forEach(field => {
      signatureString += String(data[field]);
  });
  signatureString += privateKey;
  signatureString = signatureString.toLowerCase();
  console.log('Signature String:', signatureString);
  return CryptoJS.SHA512(signatureString).toString(CryptoJS.enc.Hex);
}

// document.getElementById('payWithOzow').addEventListener('click', function() {
//   // 1. Payment Data Configuration (FIXED)
//   const paymentData = {
//     siteCode: 'EFU-EFU-001',
//     countryCode: 'ZA',
//     currencyCode: 'ZAR',
//     amount: 0.01, // Changed to number type
//     transactionReference: 'TEST-ORDER-' + Date.now(),
//     bankReference: 'TEST-INV-12345',
//     cancelUrl: 'http://localhost:5501/cancel.html',
//     errorUrl: 'http://localhost:5501/error.html',
//     successUrl: 'http://localhost:5501/success.html',
//     notifyUrl: 'http://localhost:5501/notify.html',
//     isTest: true
//   };

//   // 2. Generate HashCheck (FIXED)
//   const privateKey = 'REDACTED';
//   paymentData.hashCheck = generateOzowSignature(paymentData, privateKey);
//   console.log('Generated HashCheck:', paymentData.hashCheck);

//   // 3. API Request Options (FIXED)
//   const apiKey = 'REDACTED';
//   const options = {
//     method: 'POST',
//     headers: {
//       'Accept': 'application/json',
//       'ApiKey': apiKey,
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       ...paymentData,
//       amount: paymentData.amount.toFixed(2) // Ensure 2 decimal places
//     })
//   };

//   // 4. Make API Request (FIXED ENDPOINT)
//   fetch('https://api.ozow.com/postpaymentrequest', options) // Correct endpoint
//     .then(handleResponse)
//     .catch(handleError);
// });

// // Signature Generation (FIXED IMPLEMENTATION)
// function generateOzowSignature(data, privateKey) {
//   // Exact field order required by Ozow
//   const signatureString = [
//     data.siteCode,
//     data.countryCode,
//     data.currencyCode,
//     data.amount.toFixed(2), // Format amount to 2 decimals
//     data.transactionReference,
//     data.bankReference,
//     data.cancelUrl,
//     data.errorUrl,
//     data.successUrl,
//     data.notifyUrl,
//     data.isTest,
//     privateKey
//   ].join('').toLowerCase();

//   console.log('Signature String:', signatureString);
//   return CryptoJS.SHA512(signatureString).toString(CryptoJS.enc.Hex);
// }

// // Response handler
// function handleResponse(response) {
//   console.log('Response Status:', response.status);
//   if (!response.ok) {
//     return response.json().then(err => { 
//       throw new Error(err.title || `HTTP Error ${response.status}`)
//     });
//   }
//   return response.json();
// }

// // Error handler
// function handleError(error) {
//   console.error('Payment Error:', error);
//   alert(`Payment failed: ${error.message}`);
// }



// document.getElementById('payWithOzow').addEventListener('click', function() {
//   // 1. Payment Data Configuration
//   const paymentData = {
//       SiteCode: 'EFU-EFU-001',
//       CountryCode: 'ZA',
//       CurrencyCode: 'ZAR',
//       Amount: '0.01',  // Minimal amount from documentation
//       TransactionReference: 'TEST-ORDER-' + Date.now(),
//       BankReference: 'TEST-INV-12345',
//       CancelUrl: 'http://localhost:5501/cancel.html',
//       ErrorUrl: 'http://localhost:5501/error.html',
//       SuccessUrl: 'http://localhost:5501/success.html',
//       NotifyUrl: 'http://localhost:5501/notify.html',
//       IsTest: true
//   };

//   // 2. Generate HashCheck
//   const privateKey = 'REDACTED';  // Your test Private Key
//   paymentData.HashCheck = generateOzowSignature(paymentData, privateKey);
//   console.log('Generated HashCheck:', paymentData.HashCheck);

//   // 3. API Request Options
//   const apiKey = 'REDACTED';  // Replace with your actual test API Key

//   const options = {
//       method: 'POST',
//       headers: {
//           'Accept': 'application/json',
//           'ApiKey': apiKey,
//           'Content-Type': 'application/json'
//       },
//       body: new URLSearchParams(paymentData).toString()
//   };
//   console.log('Request Payload:', JSON.stringify(paymentData, null, 2));

//   // 4. Make API Request
//   fetch('https://stagingapi.ozow.com/PostPaymentRequest', options)
//       .then(response => {
//           console.log('Response Status:', response.status);
//           console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
//           if (!response.ok) {
//               return response.text().then(text => {
//                   throw new Error(`HTTP error! Status: ${response.status}, Details: ${text}`);
//               });
//           }
//           return response.text();  // Expect plain text URL
//       })
//       .then(data => {
//           console.log('Payment URL:', data);
//           window.location.href = data;  // Redirect to payment URL
//       })
//       .catch(error => {
//           console.error('Payment failed:', error.message);
//           console.error('Full Error Object:', error);
//           alert('Payment initialization failed. Check console for details.');
//       });
// });

document.addEventListener('DOMContentLoaded', function() {
  const payButton = document.getElementById('payWithOzow');
  payButton.addEventListener('click', function() {
      // 1. Payment Data Configuration (corrected field names)
      const paymentData = {
          siteCode: 'EFU-EFU-001', // Use camelCase per Ozow docs
          countryCode: 'ZA',
          currencyCode: 'ZAR',
          amount: 0.01, // Number type instead of string
          transactionReference: 'TEST-ORDER-' + Date.now(),
          bankReference: 'TEST-INV-12345',
          cancelUrl: 'http://localhost:5501/cancel.html',
          errorUrl: 'http://localhost:5501/error.html',
          successUrl: 'http://localhost:5501/success.html',
          notifyUrl: 'http://localhost:5501/notify.html',
          isTest: true // Boolean value
      };

      // 2. Generate HashCheck
      const privateKey = 'REDACTED';
      paymentData.hashCheck = generateOzowSignature(paymentData, privateKey);
      console.log('Generated HashCheck:', paymentData.hashCheck);

      // 3. API Request Options (corrected headers)
      const apiKey = 'REDACTED';
      const options = {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'ApiKey': apiKey,
              'Content-Type': 'application/json' // Changed to JSON
          },
          body: JSON.stringify(paymentData)
      };

      // 4. Make API Request (correct endpoint)
      fetch('https://api.ozow.com/postpaymentrequest', options)
          .then(response => {
              console.log('Response Status:', response.status);
              if (!response.ok) {
                  return response.json().then(err => {
                      throw new Error(err.title || `HTTP error! Status: ${response.status}`);
                  });
              }
              return response.json();
          })
          .then(data => {
              console.log('Payment URL:', data.paymentUrl);
              window.location.href = data.paymentUrl;
          })
          .catch(error => {
              console.error('Payment failed:', error);
              alert(`Payment failed: ${error.message}`);
          });
  });
});

// Signature Generation Function (fixed implementation)
function generateOzowSignature(data, privateKey) {
  // Correct field order as per Ozow documentation
  const fields = [
    'siteCode',
    'countryCode',
    'currencyCode',
    'amount',
    'transactionReference',
    'bankReference',
    'cancelUrl',
    'errorUrl',
    'successUrl',
    'notifyUrl',
    'isTest'
  ];

  let signatureString = fields
    .map(field => {
      const value = data[field];
      // Handle boolean values and numbers correctly
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      if (typeof value === 'number') return value.toFixed(2);
      return value;
    })
    .join('')
    .toLowerCase();

  signatureString += privateKey.toLowerCase();
  console.log('Signature String:', signatureString);
  
  return CryptoJS.SHA512(signatureString).toString(CryptoJS.enc.Hex);
}