const fetch = require('node-fetch');
const KEY = "tpk_98bd239110c511f191e717946c2b76f5";
const TX_ID = "hwR-Cw3a2";

(async () => {
  console.log(`Testing Kkiapay with x-sandbox...`);
  const res = await fetch(`https://api.kkiapay.me/api/v1/transactions/status?transactionId=${TX_ID}`, {
    headers: { 'Accept': 'application/json', 'x-api-key': KEY, 'x-sandbox': 'true' }
  });
  console.log(`=> Status: ${res.status}`);
  const data = await res.json();
  console.log(`=> Data: ${JSON.stringify(data).substring(0, 100)}`);
})();
