import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useWorkspaceStore } from '../store/workspaceStore';
import { LogOut, Plus, LogIn } from 'lucide-react';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const { user, logout } = useWorkspaceStore();
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName) return;
    try {
      const { data } = await api.post('/rooms', { name: newRoomName });
      navigate(`/room/${data.id}`);
    } catch (err) {
      alert('Failed to create room');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      const { data } = await api.post('/rooms/join', { code: joinCode });
      navigate(`/room/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join room');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h2>Welcome, {user?.name}</h2>
        <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border)' }} onClick={() => { logout(); navigate('/auth'); }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card" style={{ margin: 0, maxWidth: 'none' }}>
          <h3>Create a New Room</h3>
          <form onSubmit={handleCreateRoom} style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <input 
              className="input-field" 
              placeholder="Room Name" 
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Create
            </button>
          </form>
        </div>

        <div className="card" style={{ margin: 0, maxWidth: 'none' }}>
          <h3>Join a Room</h3>
          <form onSubmit={handleJoinRoom} style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <input 
              className="input-field" 
              placeholder="Room Code (8 chars)" 
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981' }}>
              <LogIn size={16} /> Join
            </button>
          </form>
        </div>
      </div>

      <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Your Workspaces</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {rooms.map(room => (
          <div 
            key={room.id} 
            className="card" 
            style={{ margin: 0, cursor: 'pointer', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
            onClick={() => navigate(`/room/${room.id}`)}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <h4>{room.name}</h4>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Code: {room.code}</p>
          </div>
        ))}
        {rooms.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No workspaces yet. Create or join one above.</p>}
      </div>
    </div>
  );
}
