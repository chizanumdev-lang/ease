import React, { useState } from 'react';

export const VocalPractice: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto p-6" style={{ backgroundColor: 'var(--ease-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ease-text-primary)' }}>Pronunciation Practice</h1>
        <p className="text-sm" style={{ color: 'var(--ease-text-secondary)' }}>Listen to the model, then record yourself to compare.</p>
      </div>

      {/* Waveform Area */}
      <div className="ease-card h-40 flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'var(--ease-surface)' }}>
        {/* Simulated Waveform Bars */}
        <div className="flex items-center gap-1">
          {[20, 40, 60, 30, 80, 50, 90, 40, 60, 30, 70, 40, 20].map((h, i) => (
            <div 
              key={i} 
              className="w-1.5 rounded-full transition-all duration-300"
              style={{ 
                height: `${h}%`, 
                backgroundColor: isRecording ? 'var(--ease-success)' : 'var(--ease-blue)',
                opacity: isRecording ? 1 : 0.4
              }} 
            />
          ))}
        </div>
        {isRecording && <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--ease-error)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ease-error)' }}>Recording</span>
        </div>}
      </div>

      {/* Target Phrase */}
      <div className="ease-card text-center italic py-8 border-dashed border-2" style={{ backgroundColor: 'var(--ease-blue-light)', borderColor: 'var(--ease-blue)' }}>
        <span className="text-xl font-serif text-ease-blue-dark">"Je voudrais un café, s'il vous plaît"</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <button className="ease-card flex flex-col items-center justify-center gap-2 py-6 hover:bg-ease-blue-light transition-colors">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ease-blue)', color: 'white' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <span className="text-sm font-semibold">Play Model</span>
        </button>

        <button 
          onClick={() => {
            setIsRecording(!isRecording);
            if (!isRecording) setHasRecorded(true);
          }}
          className="ease-card flex flex-col items-center justify-center gap-2 py-6 hover:bg-red-50 transition-colors"
          style={{ borderColor: isRecording ? 'var(--ease-error)' : 'var(--ease-border)' }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: isRecording ? 'var(--ease-error)' : 'var(--ease-text-primary)', color: 'white' }}>
            {isRecording ? <div className="w-4 h-4 rounded-sm bg-white" /> : <div className="w-4 h-4 rounded-full bg-white" />}
          </div>
          <span className="text-sm font-semibold">{isRecording ? 'Stop' : 'Record Self'}</span>
        </button>
      </div>

      {/* Feedback Area */}
      {hasRecorded && !isRecording && (
        <div className="ease-card animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ backgroundColor: 'var(--ease-mint-100)', borderColor: 'var(--ease-success)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-ease-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--ease-text-primary)' }}>Great Clarity!</p>
              <p className="text-xs" style={{ color: 'var(--ease-text-secondary)' }}>Your rhythm matches the model with 92% accuracy.</p>
            </div>
          </div>
        </div>
      )}

      {/* Done Button */}
      <button 
        className="ease-button-primary mt-auto w-full h-14"
        style={{ opacity: hasRecorded ? 1 : 0.5 }}
        disabled={!hasRecorded}
      >
        Save & Continue
      </button>
    </div>
  );
};
