
const fetch = require('node-fetch'); // Assuming node-fetch is available, or use built-in fetch if Node 18+

async function testApi() {
    const baseUrl = 'http://localhost:3001/api/decks';

    // 1. Valid Deck Test
    // Need valid IDs. Let's assume some exist from cards.json or simple mock.
    // Actually validation requires real IDs. 
    // We can just test the "Invalid" cases without needing perfect valid data if we expect 400.

    console.log("Testing Invalid Deck (Empty)...");
    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "test_user",
                deck: {
                    name: "Invalid Deck",
                    leaderId: "INVALID",
                    deckIdList: []
                }
            })
        });
        const json = await res.json();
        console.log("Response:", res.status, json);
        if (res.status === 400 && json.error) console.log("PASS: Invalid Deck Rejected");
        else console.log("FAIL: Invalid Deck NOT Rejected correctly");
    } catch (e) {
        console.error("Error:", e);
    }
}

testApi();
