const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const authMiddleware = require('../middlewares/auth');
const prisma = require('../prisma');

const router = express.Router();

// Simple in-memory rate limiting: max 10 calls per user per minute
const rateLimits = new Map();

const checkRateLimit = (userId) => {
  const now = Date.now();
  const windowStart = now - 60000;
  
  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, []);
  }

  const calls = rateLimits.get(userId);
  // Filter out calls outside the 1-minute window
  const recentCalls = calls.filter(time => time > windowStart);
  
  if (recentCalls.length >= 10) {
    return false;
  }
  
  recentCalls.push(now);
  rateLimits.set(userId, recentCalls);
  return true;
};

// Instead of setting max 10 calls per user per minute on generic level we do it on /action
router.post('/action', authMiddleware, async (req, res) => {
  const { action, text, blockId } = req.body;
  const userId = req.user.userId;

  if (!action || !text || !blockId) {
    return res.status(400).json({ error: 'Action, text, and blockId are required' });
  }

  if (!checkRateLimit(userId)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Maximum 10 calls per minute.' });
  }

  const allowedActions = ['summarise', 'rewrite', 'translate to Hindi'];
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  let prompt = '';
  if (action === 'summarise') {
    prompt = `Summarise the following text concisely:\n\n${text}`;
  } else if (action === 'rewrite') {
    prompt = `Rewrite the following text to improve clarity and flow:\n\n${text}`;
  } else if (action === 'translate to Hindi') {
    prompt = `Translate the following text to Hindi:\n\n${text}`;
  }

  // Set headers for SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const apiKey = process.env.GEMINI_API_KEY;
  let fullResponse = '';

  if (!apiKey) {
    // Dummy streaming response if no API key
    const dummyWords = `This is a mocked ${action} for the text: "${text}". Please add GEMINI_API_KEY to test real AI.`.split(' ');
    
    let i = 0;
    const interval = setInterval(async () => {
      if (i < dummyWords.length) {
        const word = dummyWords[i] + ' ';
        fullResponse += word;
        res.write(`data: ${JSON.stringify({ chunk: word })}\n\n`);
        i++;
      } else {
        clearInterval(interval);
        res.write('data: [DONE]\n\n');
        res.end();
        await prisma.aiHistory.create({
          data: { blockId, action, response: fullResponse.trim() }
        });
      }
    }, 100);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullResponse += chunk.text;
        res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();

    // Save to history
    await prisma.aiHistory.create({
      data: { blockId, action, response: fullResponse.trim() }
    });
  } catch (err) {
    console.error('AI Error:', err);
    res.write(`data: ${JSON.stringify({ error: 'An error occurred during AI generation.' })}\n\n`);
    res.end();
  }
});

// Get AI history for a block
router.get('/history/:blockId', authMiddleware, async (req, res) => {
  try {
    const history = await prisma.aiHistory.findMany({
      where: { blockId: req.params.blockId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
