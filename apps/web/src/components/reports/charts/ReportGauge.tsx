'use client';

import { useEffect, useRef, useState } from 'react';

interface ReportGaugeProps {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: number;
  color?: string;
}

export function ReportGauge({
  value,
  max = 100,
  label,
  sublabel,
  size = 160,
  color = '#8b5cf6',
}: ReportGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const animRef = useRef<number>(0);

  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * animatedValue) / 100;

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(percent * eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [percent]);

  const getColor = () => {
    if (animatedValue >= 80) return '#4ade80';
    if (animatedValue >= 50) return color;
    if (animatedValue >= 30) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + 20}
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
        >
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={10}
            strokeLinecap="round"
          />
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none"
            stroke={getColor()}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: getColor() }}
          >
            %{Math.round(animatedValue)}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-white/80">{label}</div>
        {sublabel && <div className="text-[10px] text-white/40">{sublabel}</div>}
      </div>
    </div>
  );
}
