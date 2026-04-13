import React, { useRef, useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Sparkles, Languages, Type, Trash2, GripVertical } from 'lucide-react';
import api from '../api';

export default function Block({ block, onAiStreamStart, onAiStreamUpdate, onAiStreamEnd, onDelete }) {
  const { updateBlock } = useWorkspaceStore();
  const textareaRef = useRef(null);

  // Resize textarea automatically to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [block.content]);

  const handleChange = (e) => {
    updateBlock(block.id, e.target.value);
  };

  const handleAiAction = async (action) => {
    if (!block.content) return;
    onAiStreamStart(action);
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-workspace-backend-wb9j.onrender.com/api';
      const response = await fetch(`${apiUrl}/ai/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, text: block.content, blockId: block.id })
      });

      if (!response.ok) {
        if (response.status === 429) {
          alert("Rate limit exceeded. Maximum 10 calls per minute.");
        } else {
          alert("AI Action Failed.");
        }
        onAiStreamEnd();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value);
        const events = chunkStr.split('\\n\\n').filter(Boolean);
        
        for (const ev of events) {
          if (ev.startsWith('data: ')) {
            const dataStr = ev.replace('data: ', '');
            if (dataStr === '[DONE]') {
              onAiStreamEnd();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) onAiStreamUpdate(parsed.chunk);
              if (parsed.error) alert(parsed.error);
            } catch (e) {
               // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      onAiStreamEnd();
    }
  };

  return (
    <div className="block-container">
      <div className="block-drag-handle">
        <GripVertical size={16} />
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <div className="block-toolbar">
          <button className="toolbar-btn" title="Summarise" onClick={() => handleAiAction('summarise')}>
            <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} /> Summarise
          </button>
          <button className="toolbar-btn" title="Rewrite" onClick={() => handleAiAction('rewrite')}>
            <Type size={14} style={{ display: 'inline', marginRight: 4 }} /> Rewrite
          </button>
          <button className="toolbar-btn" title="Translate to Hindi" onClick={() => handleAiAction('translate to Hindi')}>
            <Languages size={14} style={{ display: 'inline', marginRight: 4 }} /> Hindi
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="block-input"
          value={block.content}
          onChange={handleChange}
          placeholder="Start typing..."
          rows={1}
        />
      </div>

      <button onClick={() => onDelete(block.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5 }}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
