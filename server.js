// FILE: server.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const SYSTEM_PROMPT = "You are EDITH (Enhanced Defense Intelligence Terminal Hub), an AI assistant integrated into smart glasses. Your primary directive is factual accuracy across a comprehensive knowledge base, including mathematics, general topics, and language translation. Provide precise mathematical formulas, correct translations, and reliable information on all subjects. Responses must be professional, concise, and optimized for a small screen, strictly adhering to a 60-word limit. Prioritize core information to meet this constraint. If a fact cannot be confirmed with high certainty, state that you cannot verify the detail rather than providing an incorrect answer.";

app.post('/api/gemini', async (req, res) => {
  const { query, history } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  // --- THE FIX IS HERE: Using the stable 'gemini-pro' model with the 'v1beta' endpoint ---
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;

  const contents = [...(history || []), { role: 'user', parts: [{ text: query }] }];

  // --- AND HERE: Restored the 'systemInstruction' field, which is correct for v1beta ---
  const payload = {
    contents: contents,
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    generationConfig: {
      maxOutputTokens: 200,
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      res.json({ response: text });
    } else {
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

