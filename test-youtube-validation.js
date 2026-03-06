const https = require('https');

async function validateYouTubeUrl(url, title) {
    if (!url || !url.includes('youtube.com/watch')) {
        return { isValid: false, reason: 'Invalid Format' };
    }

    // Use YouTube's oEmbed endpoint to check existence without an API key
    // Returns 200 for valid videos, 404 or 401 for invalid/private
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    return new Promise((resolve) => {
        https.get(oembedUrl, (res) => {
            if (res.statusCode === 200) {
                resolve({ isValid: true, status: res.statusCode });
            } else {
                resolve({ isValid: false, status: res.statusCode });
            }
        }).on('error', (e) => {
            resolve({ isValid: false, error: e.message });
        });
    });
}

async function test() {
    const cases = [
        { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", type: "Valid (Rick Roll)" },
        { url: "https://www.youtube.com/watch?v=Kb24RrHIbOuI", type: "Specifically Hallucinated (Likely Invalid)" }, // Random ID
        { url: "https://www.youtube.com/watch?v=INVALID_ID_123", type: "Definitely Invalid" }
    ];

    console.log("Testing YouTube Validation via oEmbed...\n");

    for (const testCase of cases) {
        console.log(`Checking: ${testCase.url} (${testCase.type})`);
        const result = await validateYouTubeUrl(testCase.url);
        console.log(`Result: ${result.isValid ? '✅ VALID' : '❌ INVALID'} (Status: ${result.status})`);

        if (!result.isValid) {
            const searchFallback = `https://www.youtube.com/results?search_query=${encodeURIComponent("Test Video Search")}`;
            console.log(`-> Fallback: ${searchFallback}\n`);
        } else {
            console.log("\n");
        }
    }
}

test();
