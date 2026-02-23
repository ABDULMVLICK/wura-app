const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_API_KEY;
const BASE_URL = "http://localhost:3000";

// Load Google Service Info parsing to setup admin
const projectConfigPath = './google-services.json';
let projectId = 'wura-35d21'; // from default if known
try {
  const config = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
  projectId = config.project_info.project_id;
} catch (e) { }

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: projectId,
    credential: admin.credential.applicationDefault()
  });
}

async function runTest() {
  console.log("=== STARTING INTEGRATION TEST ===");
  try {
    const mockUid = `test-sender-${Date.now()}`;
    const customToken = await admin.auth().createCustomToken(mockUid, { phone_number: "+22500000000" });
    const res = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, { token: customToken, returnSecureToken: true });

    // Test Sender
    const headers = { Authorization: `Bearer ${res.data.idToken}` };
    console.log("\n-> Testing /users/register/sender...");
    const senderRes = await axios.post(`${BASE_URL}/users/register/sender`, { firstName: "Test", lastName: "Sender", country: "CIV" }, { headers });
    console.log("Sender Response:", senderRes.status, senderRes.data.firstName);

    // Test Receiver
    const mockUid2 = `test-receiver-${Date.now()}`;
    const customToken2 = await admin.auth().createCustomToken(mockUid2, { email: "receiver@wura.app" });
    const res2 = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, { token: customToken2, returnSecureToken: true });
    const idToken2 = res2.data.idToken;
    console.log("\n-> Testing /users/register/receiver...");
    const receiverRes = await axios.post(`${BASE_URL}/users/register/receiver`, { firstName: "Test", lastName: "Receiver" }, { headers: { Authorization: `Bearer ${idToken2}` } });
    console.log("Receiver Response:", receiverRes.status, receiverRes.data.receiver.wuraId);

    // Test Transaction
    const txRes = await axios.post(`${BASE_URL}/transactions`, { receiverWuraId: receiverRes.data.receiver.wuraId, amountFiatIn: 10000, amountUsdtBridged: 15.5, amountFiatOutExpected: 15 }, { headers });
    console.log("\n-> Testing /transactions...");
    console.log("Transaction Response:", txRes.status, txRes.data.referenceId);

    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("TEST FAILED:", error.response ? error.response.data : error.message);
  }
}

runTest();
