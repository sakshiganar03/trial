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

  // --- THE FIX IS HERE: Using the universally available 'chat-bison-001' model ---
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage?key=${geminiApiKey}`;

  // Format the history and prompt for the chat-bison model
  const messages = history ? history.map(turn => ({
      author: turn.role === 'user' ? '0' : '1',
      content: turn.parts[0].text
  })) : [];
  messages.push({ author: '0', content: query });

  // --- AND HERE: The payload is adjusted for the chat-bison model's required format ---
  const payload = {
    prompt: {
        context: SYSTEM_PROMPT,
        messages: messages,
    },
    temperature: 0.7,
    candidateCount: 1,
  };

  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error?.message || `API request failed with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    // The response structure is slightly different for this model
    const text = data.candidates?.[0]?.content;

    if (text) {
      res.json({ response: text });
    } else {
      // Check for a safety-related block reason
      const blockReason = data.filters?.[0]?.reason;
      if (blockReason) {
        res.json({ response: `I cannot answer that. Response was blocked due to: ${blockReason}` });
      } else {
        res.json({ response: "I received a response, but it contained no content." });
      }
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
