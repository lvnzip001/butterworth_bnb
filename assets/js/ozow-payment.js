// document.addEventListener('DOMContentLoaded', function() {
//   const payButton = document.getElementById('payWithOzow');
//   let paymentData;

//   // ======================
//   // 1. Signature Generation (MUST BE DEFINED FIRST)
//   // ======================
//   function generateOzowSignature(data, privateKey) {
//     const signatureString = [
//       data.siteCode,
//       data.countryCode,
//       data.currencyCode,
//       data.amount,
//       data.transactionReference,
//       data.bankReference,
//       data.cancelUrl,
//       data.errorUrl,
//       data.successUrl,
//       data.notifyUrl,
//       data.isTest
//     ].join('').toLowerCase() + privateKey.toLowerCase();

//     console.log('Signature String:', signatureString);
//     return CryptoJS.SHA512(signatureString).toString(CryptoJS.enc.Hex);
//   }

//   // ======================
//   // 2. Payment Handler
//   // ======================
//   payButton.addEventListener('click', async function() {
//     try {
//       // Payment Configuration
//       paymentData = {
//         siteCode: 'EFU-EFU-001',
//         countryCode: 'ZA',
//         currencyCode: 'ZAR',
//         amount: '0.01',
//         transactionReference: `TEST-${Date.now()}`,
//         bankReference: 'TEST-INV-12345',
//         cancelUrl: 'https://your-ngrok-url.ngrok-free.app/cancel.html',
//         errorUrl: 'https://your-ngrok-url.ngrok-free.app/error.html',
//         successUrl: 'https://your-ngrok-url.ngrok-free.app/success.html',
//         notifyUrl: 'https://your-ngrok-url.ngrok-free.app/notify.html',
//         isTest: true
//       };

//       // Generate Signature
//       const privateKey = 'b15f477b60dc4374991493b6a0d8f5a3';
//       paymentData.hashCheck = generateOzowSignature(paymentData, privateKey);

//       // API Request
//       const response = await fetch('https://stagingapi.ozow.com/PostPaymentRequest', {
//         method: 'POST',
//         headers: {
//           'Accept': 'application/json',
//           'ApiKey': '4951cd35ef734aa9b4d2c460ef8262fe',
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(paymentData)
//       });

//       console.log('Response:', response);

      

//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error('API Error:', errorData);
//       throw new Error(`API returned status ${response.status}: ${errorData.message || 'Unknown error'}`);
//     }
    
//     const result = await response.json();
//     window.location.href = result.paymentUrl;

//   });
// });

document.addEventListener('DOMContentLoaded', function() {
  const payButton = document.getElementById('payWithOzow');

  payButton.addEventListener('click', async function() {
      try {
          const paymentData = {
              amount: '0.01',
              transactionReference: `TEST-${Date.now()}`
          };
          console.log('Sending payment data:', paymentData);

          const response = await fetch('https://81af-165-0-43-43.ngrok-free.app/initiate-payment', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(paymentData)
          });

          console.log('Response:', response);

          if (!response.ok) {
              const errorData = await response.json(); // Get the error details from the server
              console.error('Server returned an error:', errorData);
              throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
          }

          const result = await response.json();
          console.log('Payment URL received:', result.paymentUrl);
          window.location.href = result.paymentUrl;
      } catch (error) {
          console.error('Payment initiation failed:', error.message);
          alert('An error occurred while initiating the payment. Check the console for details.');
      }
  });
});