const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// GET messages between current user and a recipient
router.get('/:recipientId', authenticateToken, async (req, res) => {
  const { recipientId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, recipientId: parseInt(recipientId) },
          { senderId: parseInt(recipientId), recipientId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST send message to a recipient
router.post('/', authenticateToken, async (req, res) => {
  const { content, recipientId } = req.body;
  if (!content || !recipientId) {
    return res.status(400).json({ error: 'Content and recipient are required.' });
  }

  try {
    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        recipientId: parseInt(recipientId)
      }
    });
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;