// FILE: server.js (Corrected)
// This is your backend. It creates a server that serves your website
// and provides a secure proxy to the Gemini API.

import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static('public'));
// Middleware to parse JSON bodies from incoming requests
app.use(express.json());

// The System Prompt that defines EDITH's personality and instructions
const SYSTEM_PROMPT = "You are EDITH (Enhanced Defense Intelligence Terminal Hub), an AI assistant. Your responses must be professional, concise, and optimized for a web display. Provide helpful, direct answers, maintaining a professional tone suitable for a high-tech assistant.";

// API Proxy Endpoint
// The frontend will send requests to '/api/gemini' instead of the actual Gemini API.
app.post('/api/gemini', async (req, res) => {
  const { query } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  const enhancedPrompt = `${SYSTEM_PROMPT}\n\nUser Query: ${query}`;

  const payload = {
    contents: [{ parts: [{ text: enhancedPrompt }] }],
    generationConfig: {
      maxOutputTokens: 800,
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

// ** THE FIX IS HERE **
// Add a 404 Not Found handler for any routes that don't match.
// This should be placed after all your other routes.
app.use((req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Start the server
app.listen(port, () => {
  console.log(`EDITH server running at http://localhost:${port}`);
});
