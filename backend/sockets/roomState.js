const prisma = require('../prisma');

module.exports = (io, socket) => {
  // Join a room
  socket.on('join_room', async ({ roomId, user }) => {
    socket.join(roomId);
    socket.data.user = user;
    socket.data.roomId = roomId;

    // Broadcast presence update
    const sockets = await io.in(roomId).fetchSockets();
    const activeUsers = sockets.map(s => s.data.user).filter(Boolean);
    io.to(roomId).emit('presence_update', activeUsers);
  });

  // Handle cursor movement
  socket.on('cursor_move', ({ roomId, position }) => {
    if (socket.data.user) {
      socket.to(roomId).emit('cursor_update', {
        userId: socket.data.user.id,
        user: socket.data.user,
        position
      });
    }
  });

  // Handle block updates (Optimistic UI sync)
  socket.on('block_update', async ({ roomId, block }) => {
    // block: { id, content, position, action: 'update' | 'create' | 'delete' }
    
    // Broadcast immediately so clients feel fast sync
    socket.to(roomId).emit('block_updated', { ...block, updatedBy: socket.data.user.id });

    // Persist to DB asynchronously
    try {
      if (block.action === 'create') {
        await prisma.block.create({
          data: {
            id: block.id, // Generate on frontend (uuid) and send
            roomId,
            content: block.content,
            position: block.position,
            updatedBy: socket.data.user.id
          }
        });
      } else if (block.action === 'update') {
        await prisma.block.update({
          where: { id: block.id },
          data: { content: block.content, position: block.position, updatedBy: socket.data.user.id }
        });
      } else if (block.action === 'delete') {
        await prisma.block.delete({ where: { id: block.id } });
      }
    } catch (err) {
      console.error('Error syncing block to DB:', err);
    }
  });

  socket.on('disconnect', async () => {
    if (socket.data.roomId) {
      const roomId = socket.data.roomId;
      const sockets = await io.in(roomId).fetchSockets();
      const activeUsers = sockets.map(s => s.data.user).filter(Boolean);
      io.to(roomId).emit('presence_update', activeUsers);
      io.to(roomId).emit('cursor_remove', { userId: socket.data.user?.id });
    }
  });
};
