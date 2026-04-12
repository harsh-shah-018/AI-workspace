import React from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function PresenceBar() {
  const { activeUsers } = useWorkspaceStore();

  // Filter out duplicates just in case one user has multiple tabs
  const uniqueUsers = Array.from(new Set(activeUsers.map(u => u.id)))
    .map(id => activeUsers.find(u => u.id === id));

  return (
    <div className="presence-bar">
      {uniqueUsers.map(u => (
        <div key={u.id} className="avatar" data-name={u.name} title={u.name}>
          {u.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
