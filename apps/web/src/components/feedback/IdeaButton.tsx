'use client';

import { Lightbulb } from 'lucide-react';
import { forwardRef, useState } from 'react';

type IdeaButtonProps = {
  onClick?: () => void;
  'aria-expanded'?: boolean;
};

export const IdeaButton = forwardRef<HTMLButtonElement, IdeaButtonProps>(function IdeaButton(
  { onClick, 'aria-expanded': ariaExpanded },
  ref,
) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={ariaExpanded}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50"
      aria-label="Fikir ve Öneri"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 blur-xl opacity-30 transition-all duration-500 group-hover:opacity-60" />

      {/* 3D flip — yuvarlak yüzler */}
      <div
        className="relative h-16 w-16 overflow-hidden rounded-full md:h-20 md:w-20"
        style={{ perspective: '1000px' }}
      >
        <div
          className="w-full h-full transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isHovered ? 'rotateY(180deg) rotateX(10deg)' : 'rotateY(0deg) rotateX(0deg)',
          }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl shadow-violet-500/30 backdrop-blur-xl transition-all duration-300 group-hover:border-white/40"
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            <Lightbulb className="w-7 h-7 md:w-9 md:h-9 text-violet-400 group-hover:text-cyan-400 transition-colors duration-300" />
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 shadow-2xl shadow-cyan-500/40 backdrop-blur-xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <Lightbulb className="w-7 h-7 md:w-9 md:h-9 text-white" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <div
        className={`absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl whitespace-nowrap transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
        }`}
      >
        <span className="text-sm text-white/90">Fikir ve Öneri</span>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-t border-white/20" />
      </div>

      {/* Orbiting Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-1.5 h-1.5 bg-violet-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            top: '-5%',
            right: '50%',
            animation: 'orbit 3s linear infinite',
          }}
        />
        <div
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            bottom: '50%',
            left: '-5%',
            animation: 'orbit 3s linear infinite reverse',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            bottom: '-5%',
            right: '-5%',
            animation: 'orbit 3s linear infinite',
            animationDelay: '2s',
          }}
        />
      </div>

      <style>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(40px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(40px) rotate(-360deg);
          }
        }
      `}</style>
    </button>
  );
});
