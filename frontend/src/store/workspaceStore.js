import { create } from 'zustand';
import { io } from 'socket.io-client';

export const useWorkspaceStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  room: null,
  blocks: [],
  activeUsers: [],
  socket: null,

  setUser: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, room: null, blocks: [] });
  },

  joinRoom: async (room, user) => {
    // connect socket
    const socket = io('http://localhost:4000');
    
    socket.emit('join_room', { roomId: room.id, user });

    socket.on('presence_update', (users) => {
      set({ activeUsers: users });
    });

    socket.on('block_updated', (incomingBlock) => {
      const { blocks } = get();
      if (incomingBlock.action === 'delete') {
        set({ blocks: blocks.filter(b => b.id !== incomingBlock.id) });
      } else {
        const exists = blocks.find(b => b.id === incomingBlock.id);
        if (exists) {
          set({ blocks: blocks.map(b => b.id === incomingBlock.id ? incomingBlock : b) });
        } else {
          set({ blocks: [...blocks, incomingBlock].sort((a, b) => a.position - b.position) });
        }
      }
    });

    set({ room, blocks: room.blocks || [], socket });
  },

  leaveRoom: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ room: null, blocks: [], activeUsers: [], socket: null });
  },

  updateBlock: (id, content) => {
    const { blocks, socket, room } = get();
    const updatedBlocks = blocks.map(b => b.id === id ? { ...b, content } : b);
    set({ blocks: updatedBlocks });
    
    const block = updatedBlocks.find(b => b.id === id);
    if (socket && room) {
      socket.emit('block_update', { roomId: room.id, block: { ...block, action: 'update' } });
    }
  },

  // other actions can be added easily
}));
