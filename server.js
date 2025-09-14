// FILE: server.js (Corrected with Conversation History)
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// ** THE SYSTEM PROMPT HAS BEEN UPDATED HERE **
const SYSTEM_PROMPT = "You are EDITH (Enhanced Defense Intelligence Terminal Hub), an AI assistant integrated into smart glasses. Your responses must be professional, concise, and optimized for a small screen, strictly adhering to a 60-word limit. Prioritize factual accuracy and draw from a comprehensive knowledge base covering geography, history, and technical topics. Be direct, helpful, and maintain a professional tone, providing correct and relevant information for all types of questions, both general and technical.";

app.post('/api/gemini', async (req, res) => {
  // --- CONVERSATION HISTORY LOGIC ---
  // We now expect 'query' for the new question and 'history' for past conversation
  const { query, history } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

  // Format the history for the Gemini API. It expects a specific structure.
  // The 'history' from your frontend should be an array of {role: 'user'/'model', parts: [{text: ...}]}
  const contents = [...(history || []), { role: 'user', parts: [{ text: query }] }];

  const payload = {
    contents: contents, // Send the full conversation history
    systemInstruction: { // The correct way to send a system prompt for conversations
      parts: [{ text: SYSTEM_PROMPT }]
    },
    generationConfig: {
      maxOutputTokens: 200, // Adjusted for the shorter response length
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
      res.json({ response: "I received a response, but it contained no content. Please try rephrasing your query." });
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
