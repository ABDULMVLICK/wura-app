const fetch = require('node-fetch');

const KEY = "tpk_98bd239110c511f191e717946c2b76f5";
const TX_ID = "hwR-Cw3a2";

const urls = [
  `https://api.kkiapay.me/api/v1/transactions/${TX_ID}`,
  `https://api.kkiapay.me/api/v1/transactions/status?transactionId=${TX_ID}`,
  `https://sandbox-api.kkiapay.me/api/v1/transactions/${TX_ID}`,
  `https://sandbox-kkiapay.me/api/v1/transactions/${TX_ID}`
];

(async () => {
  for (const url of urls) {
    console.log(`Testing ${url}...`);
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json', 'x-api-key': KEY }});
      console.log(`  => Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`  => Success! ${JSON.stringify(data).substring(0, 50)}...`);
        break;
      }
    } catch (e) {
      console.log(`  => Error: ${e.message}`);
    }
  }
})();
