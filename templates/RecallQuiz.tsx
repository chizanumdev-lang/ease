import React, { useState } from 'react';

export const RecallQuiz: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const quizData = [
    { front: "Abundance", back: "A very large quantity of something.", category: "Vocabulary" },
    { front: "Resilience", back: "The capacity to recover quickly from difficulties.", category: "Soft Skills" }
  ];

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto p-6" style={{ backgroundColor: 'var(--ease-bg)', minHeight: '100vh' }}>
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ease-text-secondary)' }}>Step {currentStep + 1} of 10</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s, i) => (
            <div key={i} className="w-6 h-1 rounded-full" style={{ backgroundColor: i <= currentStep ? 'var(--ease-blue)' : 'var(--ease-border)' }} />
          ))}
        </div>
      </div>

      {/* Card Container */}
      <div 
        className="relative perspective-1000" 
        style={{ height: '400px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`w-full h-full ease-card flex flex-col items-center justify-center text-center p-12 transition-all duration-500 transform-gpu cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ 
            backfaceVisibility: 'hidden',
            backgroundColor: isFlipped ? 'var(--ease-blue-light)' : 'var(--ease-surface)',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          {!isFlipped && (
            <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
              <span className="text-xs font-bold px-3 py-1 rounded-full w-fit mx-auto" style={{ backgroundColor: 'var(--ease-blue-light)', color: 'var(--ease-blue)' }}>
                {quizData[currentStep].category}
              </span>
              <h2 className="text-4xl font-serif text-ease-text-primary">{quizData[currentStep].front}</h2>
              <p className="text-sm mt-8" style={{ color: 'var(--ease-text-secondary)' }}>Tap to reveal definition</p>
            </div>
          )}

          {/* Back (Mirrored to show correctly when flipped) */}
          {isFlipped && (
            <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300" style={{ transform: 'rotateY(180deg)' }}>
              <p className="text-2xl leading-relaxed text-ease-blue-dark font-medium">
                {quizData[currentStep].back}
              </p>
              <div className="h-px w-12 bg-ease-blue mx-auto opacity-30 my-4" />
              <p className="text-sm" style={{ color: 'var(--ease-text-secondary)' }}>Did you know this?</p>
            </div>
          )}
        </div>
      </div>

      {/* Rating Controls (Shown after flip) */}
      <div className={`grid grid-cols-3 gap-3 transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button className="flex flex-col items-center gap-2 p-4 ease-card hover:bg-red-50 transition-colors">
          <span className="text-xl">😟</span>
          <span className="text-xs font-bold uppercase tracking-tighter">Hard</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 ease-card hover:bg-blue-50 transition-colors">
          <span className="text-xl">🙂</span>
          <span className="text-xs font-bold uppercase tracking-tighter">Good</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 ease-card hover:bg-green-50 transition-colors">
          <span className="text-xl">🤩</span>
          <span className="text-xs font-bold uppercase tracking-tighter">Easy</span>
        </button>
      </div>
    </div>
  );
};
