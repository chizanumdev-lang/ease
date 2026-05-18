// Comparison of Old vs New extractJson Sanitization

function oldExtractJson(text) {
    if (!text) return null;
    try {
        const cleaned = text.replace(/^```json\s*/i, '')
                           .replace(/^```\s*/i, '')
                           .replace(/\s*```$/i, '')
                           .trim();
        
        try {
            return JSON.parse(cleaned);
        } catch {
            // Ignore
        }

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            let jsonString = jsonMatch[0];
            
            // Old global replace of control characters
            jsonString = jsonString.replace(/[\u0000-\u001F]/g, (match) => {
                if (match === '\n') return '\\n';
                if (match === '\r') return '\\r';
                if (match === '\t') return '\\t';
                return ''; 
            });

            try {
                return JSON.parse(jsonString);
            } catch (innerErr) {
                console.warn('❌ OLD extractJson: JSON parse failed after sanitization:', innerErr.message);
                return null;
            }
        }
        return null;
    } catch (err) {
        console.warn('❌ OLD extractJson: JSON extraction failed:', err.message);
        return null;
    }
}

function newExtractJson(text) {
    if (!text) return null;
    try {
        const cleaned = text.replace(/^```json\s*/i, '')
                           .replace(/^```\s*/i, '')
                           .replace(/\s*```$/i, '')
                           .trim();
        
        try {
            return JSON.parse(cleaned);
        } catch {
            // Ignore
        }

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            let jsonString = jsonMatch[0];
            
            // New localized replace of control characters inside double quotes
            jsonString = jsonString.replace(/"([^"\\]|\\.)*"/g, (match) => {
                return match.replace(/[\u0000-\u001F]/g, (ctrl) => {
                    if (ctrl === '\n') return '\\n';
                    if (ctrl === '\r') return '\\r';
                    if (ctrl === '\t') return '\\t';
                    return ''; 
                });
            });

            try {
                return JSON.parse(jsonString);
            } catch (innerErr) {
                console.warn('❌ NEW extractJson: JSON parse failed after sanitization:', innerErr.message);
                return null;
            }
        }
        return null;
    } catch (err) {
        console.warn('❌ NEW extractJson: JSON extraction failed:', err.message);
        return null;
    }
}

// Test case simulating LLM output with a preamble and formatted JSON
const llmOutput = `Here is your preview plan:
{
  "title": "Learn Japanese in 30 Days",
  "category": "Skill",
  "description": "Unlock Japanese language and culture in just 30 days!\\nGood luck!"
}`;

console.log('--- RUNNING TEST WITH LLM OUTPUT ---');
console.log('1. Testing with OLD extractJson...');
const oldResult = oldExtractJson(llmOutput);
console.log('Old Result parsed successfully:', !!oldResult);

console.log('\n2. Testing with NEW extractJson...');
const newResult = newExtractJson(llmOutput);
console.log('New Result parsed successfully:', !!newResult);
if (newResult) {
    console.log('Parsed Object:', JSON.stringify(newResult, null, 2));
}
