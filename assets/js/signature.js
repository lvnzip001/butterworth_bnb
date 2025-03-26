function generateOzowSignature(data, privateKey) {
  const fields = [
      'SiteCode',
      'CountryCode',
      'CurrencyCode',
      'Amount',
      'TransactionReference',
      'BankReference',
      'Customer.FirstName',
      'Customer.LastName',
      'Customer.Email',
      'Customer.MobileNumber',
      'CancelUrl',
      'ErrorUrl',
      'SuccessUrl',
      'NotifyUrl',
      'IsTest'
  ];
  let signatureString = '';
  fields.forEach(field => {
      signatureString += data[field];
  });
  signatureString += privateKey;
  signatureString = signatureString.toLowerCase();
  return CryptoJS.SHA512(signatureString).toString();
}