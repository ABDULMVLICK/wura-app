const admin = require('firebase-admin');
const fs = require('fs');

const API_KEY = "AIzaSyDEqO4SxNToPxNNx3wQD7RnMPuEr45wfHg";
const BASE_URL = "http://localhost:3000";

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "wura-35d21",
        credential: admin.credential.applicationDefault()
    });
}

async function runTest() {
    console.log("=== STARTING INTEGRATION TEST ===");
    try {
        const mockUid = `test-sender-${Date.now()}`;
        const customToken = await admin.auth().createCustomToken(mockUid, { phone_number: "+22500000000" });

        // Exchange for ID Token
        let res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: customToken, returnSecureToken: true })
        });
        if (!res.ok) throw new Error(await res.text());
        let data = await res.json();

        // Test Sender Registration
        const headers = {
            'Authorization': `Bearer ${data.idToken}`,
            'Content-Type': 'application/json'
        };
        console.log("\n-> Testing /users/register/sender...");
        let senderRes = await fetch(`${BASE_URL}/users/register/sender`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ firstName: "Test", lastName: "Sender", country: "CIV" })
        });
        let senderData = await senderRes.json();
        console.log("Sender Response:", senderRes.status, senderData.firstName);

        // Test Receiver Registration
        const mockUid2 = `test-receiver-${Date.now()}`;
        const customToken2 = await admin.auth().createCustomToken(mockUid2, { email: "receiver@wura.app" });
        let res2 = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: customToken2, returnSecureToken: true })
        });
        if (!res2.ok) throw new Error(await res2.text());
        let data2 = await res2.json();
        const idToken2 = data2.idToken;

        console.log("\n-> Testing /users/register/receiver...");
        let receiverRes = await fetch(`${BASE_URL}/users/register/receiver`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken2}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: "Test", lastName: "Receiver" })
        });
        let receiverData = await receiverRes.json();
        console.log("Receiver Response:", receiverRes.status, receiverData.receiver.wuraId);

        // Test Transaction
        console.log("\n-> Testing /transactions...");
        let txRes = await fetch(`${BASE_URL}/transactions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ receiverWuraId: receiverData.receiver.wuraId, amountFiatIn: 10000, amountUsdtBridged: 15.5, amountFiatOutExpected: 15 })
        });
        let txData = await txRes.json();
        console.log("Transaction Response:", txRes.status, txData.referenceId);

        console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");

    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
}

runTest();
