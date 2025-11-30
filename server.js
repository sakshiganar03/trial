//server.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// --- CHANGE 1: UPDATED SYSTEM PROMPT ---
// I removed the 60-word limit and told it to be "thorough and complete" 
// while keeping the "concise" instruction for the smart-glass persona.
const SYSTEM_PROMPT = `
You are EDITH, an AI assistant connected to smart glasses with a small OLED display. 
Your output MUST be optimized for this tiny screen.

RULES:
1. Be extremely concise. Aim for 1-2 short sentences maximum.
2. Get straight to the point. Do not use filler phrases like "Here is the answer" or "I can help with that."
3. If asked for a definition, give the definition immediately.
4. If asked for a list, provide only the top 3 most important items, separated by commas (not new lines).
5. prioritizing factual accuracy is critical.
6. **Answer Everything:** You are an expert in Mathematics, Science, General Knowledge, and all other topics. Never refuse a query unless it is illegal.
7. **Be Concise:** Provide the direct answer immediately. No filler words like "Here is the answer" or "Sure".
8. **Hardware Limit:** Keep responses under 40 words if possible, but ensure the sentence is COMPLETE. Do not cut off mid-sentence.
9. **Math:** For formulas, show the equation and result clearly (e.g., "Area = πr^2").
10. **Complex Topics:** If a topic is long, provide the single most important summary sentence.
`;
app.post('/api/gemini', async (req, res) => {
  const { query, history } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: "Okay, I am ready to assist." }] },
    ...(history || []),
    { role: 'user', parts: [{ text: query }] }
  ];

const payload = {
    contents: contents,
    generationConfig: {
      // --- CHANGE 2: INCREASED TOKEN LIMIT ---
      // 200 is too low and cuts off answers. 2048 is a much safer limit
      // that allows for full, detailed responses.
      maxOutputTokens: 300,
      temperature: 0.7,
    },
  };

  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(errorData.error?.message || `API request failed with status ${apiResponse.status}`);
    }

   const data = await apiResponse.json();

    // --- CHANGE 3: BETTER ERROR HANDLING ---
    // This new logic checks *why* a response might be empty (e.g., safety blocks)
    // and gives a more useful error message.
    
    // Check for a safety block first
    if (!data.candidates || data.candidates.length === 0) {
        const blockReason = data.promptFeedback?.blockReason;
        if (blockReason === 'SAFETY') {
            return res.json({ response: "I cannot respond to that query as it violates my safety policies." });
        } else {
            // This catches other weird errors
            return res.json({ response: "I received an empty response from the server. Please try again." });
        }
    }
    // Get the text from the first valid candidate
    const text = data.candidates[0]?.content?.parts?.[0]?.text;

    if (text) {
      res.json({ response: text });
    } else {
      // This is now a fallback for unexpected issues
      res.json({ response: "I received a response, but it contained no content." });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: `Failed to get response from Gemini. ${error.message}` });
  }
});

app.use((req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(port, () => {
  console.log(`EDITH server running at http://localhost:${port}`);
});
