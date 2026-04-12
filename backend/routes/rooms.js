const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();
router.use(authMiddleware);

// List user's rooms (owned and joined)
router.get('/', async (req, res) => {
  try {
    const memberships = await prisma.roomMember.findMany({
      where: { userId: req.user.userId },
      include: { room: true }
    });
    
    // Convert to simple array of rooms
    const rooms = memberships.map(m => m.room);
    
    // Also attach rooms they own if not listed
    const owned = await prisma.room.findMany({
      where: { ownerId: req.user.userId }
    });

    const allRoomsMap = new Map();
    [...rooms, ...owned].forEach(r => allRoomsMap.set(r.id, r));

    res.json(Array.from(allRoomsMap.values()));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new room
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name required' });

  try {
    const code = uuidv4().slice(0, 8); // 8-char code to join
    const room = await prisma.room.create({
      data: {
        name,
        code,
        ownerId: req.user.userId,
        members: {
          create: { userId: req.user.userId }
        },
        blocks: {
          create: [{ position: 0, content: '', updatedBy: req.user.userId }]
        }
      }
    });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a room by code
router.post('/join', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Room code required' });

  try {
    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Check if already member
    const existing = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: req.user.userId, roomId: room.id } }
    });

    if (!existing) {
      await prisma.roomMember.create({
        data: { userId: req.user.userId, roomId: room.id }
      });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room details & blocks
router.get('/:id', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        blocks: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!room) return res.status(404).json({ error: 'Room not found' });

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
