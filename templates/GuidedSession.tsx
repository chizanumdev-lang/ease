import React, { useState } from 'react';

interface ChecklistItem {
  id: string;
  timestamp: string;
  label: string;
  completed: boolean;
}

export const GuidedSession: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', timestamp: '0:45', label: 'Initial Breath Awareness', completed: false },
    { id: '2', timestamp: '2:15', label: 'Deep Abdominal Inhale', completed: false },
    { id: '3', timestamp: '5:10', label: 'Scan Body for Tension', completed: false },
    { id: '4', timestamp: '8:30', label: 'Full Exhale Release', completed: false },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto p-4" style={{ backgroundColor: 'var(--ease-bg)', minHeight: '100vh' }}>
      {/* Video Placeholder */}
      <div className="ease-card p-0 overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
        <div className="w-full h-full flex items-center justify-center text-white opacity-50">
          <span className="text-sm font-medium">Video Player Placeholder</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--ease-text-primary)' }}>Mindful Renewal</h1>
        <p className="text-sm" style={{ color: 'var(--ease-text-secondary)' }}>Follow the timestamps below to stay in sync with the session.</p>
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="ease-card flex items-center gap-4 cursor-pointer transition-all hover:border-ease-blue"
            style={{ 
              borderColor: item.completed ? 'var(--ease-success)' : 'var(--ease-border)',
              opacity: item.completed ? 0.7 : 1
            }}
          >
            <div 
              className="flex items-center justify-center w-12 h-12 rounded-lg text-xs font-bold"
              style={{ 
                backgroundColor: item.completed ? 'var(--ease-success)' : 'var(--ease-blue-light)',
                color: item.completed ? 'white' : 'var(--ease-blue)'
              }}
            >
              {item.timestamp}
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium" style={{ color: 'var(--ease-text-primary)' }}>{item.label}</span>
            </div>
            <div 
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: item.completed ? 'var(--ease-success)' : 'var(--ease-border)' }}
            >
              {item.completed && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ease-success)' }} />}
            </div>
          </div>
        ))}
      </div>

      {/* Complete Button */}
      <button 
        className="ease-button-primary mt-4 w-full h-14 text-lg"
        disabled={items.some(i => !i.completed)}
        style={{ opacity: items.some(i => !i.completed) ? 0.5 : 1 }}
      >
        Complete Session
      </button>
    </div>
  );
};
