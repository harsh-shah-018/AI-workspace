import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import api from '../api';
import { Plus, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import PresenceBar from '../components/PresenceBar';
import Block from '../components/Block';


export default function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { joinRoom, leaveRoom, room, blocks, user, socket } = useWorkspaceStore();
  
  const [aiStreamAction, setAiStreamAction] = useState(null);
  const [aiStreamText, setAiStreamText] = useState('');

  useEffect(() => {
    const fetchAndJoin = async () => {
      try {
        const { data } = await api.get(`/rooms/${id}`);
        await joinRoom(data, user);
      } catch (err) {
        alert('Could not join room');
        navigate('/dashboard');
      }
    };
    if (user) fetchAndJoin();
    
    return () => leaveRoom();
  }, [id, user]);

  const addBlock = () => {
    if (!socket || !room) return;
    const position = blocks.length > 0 ? blocks[blocks.length - 1].position + 1 : 0;
    const newBlock = { id: uuidv4(), content: '', position, action: 'create' };
    
    // Optimistic cache is managed by Zustand but let's simply emit it for now
    // Actually Zustand logic we have handles socket event incoming, 
    // to make it truly optimistic immediately:
    useWorkspaceStore.setState(state => ({
      blocks: [...state.blocks, { ...newBlock, updatedBy: user.id }]
    }));
    socket.emit('block_update', { roomId: room.id, block: newBlock });
  };

  const deleteBlock = (blockId) => {
    if (!socket || !room) return;
    useWorkspaceStore.setState(state => ({
      blocks: state.blocks.filter(b => b.id !== blockId)
    }));
    socket.emit('block_update', { roomId: room.id, block: { id: blockId, action: 'delete' } });
  }

  if (!room) return <div style={{ padding: '2rem' }}>Loading Workspace...</div>;

  return (
    <div className="workspace-layout">
      {/* Editor Area */}
      <div className="editor-area">
        <div className="editor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              style={{ background: 'transparent', border: '1px solid var(--border)', width: 'auto', padding: '0.4rem 0.8rem' }}
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft size={16} />
            </button>
            <h2 style={{ margin: 0 }}>{room.name}</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Code: {room.code}</span>
          </div>
          <PresenceBar />
        </div>

        <div className="block-list">
          {blocks.map(block => (
            <Block 
              key={block.id} 
              block={block} 
              onAiStreamStart={(action) => {
                setAiStreamAction(action);
                setAiStreamText('');
              }}
              onAiStreamUpdate={(textChunk) => {
                // handle stream text concatenating with preserved whitespace using function update
                setAiStreamText(prev => prev + textChunk);
              }}
              onAiStreamEnd={() => {
                // Do something on end if needed, maybe just leave it there
              }}
              onDelete={deleteBlock}
            />
          ))}
          
          <button 
            className="btn-primary" 
            style={{ width: 'auto', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px dashed var(--border)' }}
            onClick={addBlock}
          >
            <Plus size={16} /> Add Block
          </button>
        </div>
      </div>

      {/* AI Panel */}
      <div className="ai-sidebar">
        <h3>AI Assistant</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select an action on a block to see AI suggestions.</p>

        {aiStreamAction && (
          <div className="ai-stream-preview">
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Action: {aiStreamAction}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {aiStreamText || 'Thinking...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
