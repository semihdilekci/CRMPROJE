'use client';

import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { DEFAULT_AMBIENT_BLOB_CONFIG, type AmbientBlobConfig } from '@crm/shared';
import { useDisplayConfig } from '@/hooks/use-display-config';

const BASE_SEGMENT_DURATION_MIN_MS = 18_000;
const BASE_SEGMENT_DURATION_MAX_MS = 40_000;
const BASE_BLOB_SIZE_VMIN = 75;
const BASE_BLUR_PX = 72;
const BASE_PULSE_PERIOD_MS = 10_000;

type Point = { x: number; y: number };

type SegmentState = {
  p0: Point;
  p1: Point;
  p2: Point;
  startMs: number;
  durationMs: number;
};

/** Tema (mor–turkuaz–slate + accent tonları) ile uyumlu radial gradientler */
const BLOB_BACKGROUNDS: string[] = [
  'radial-gradient(circle, rgba(139, 92, 246, 0.52) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(6, 182, 212, 0.42) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(51, 65, 85, 0.5) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(34, 211, 238, 0.38) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(99, 102, 241, 0.48) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(74, 222, 128, 0.32) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(192, 132, 252, 0.4) 0%, transparent 62%)',
  'radial-gradient(circle, rgba(14, 165, 233, 0.38) 0%, transparent 62%)',
];

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function quadBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function len(ax: number, ay: number): number {
  return Math.hypot(ax, ay) || 1;
}

function randomControlPoint(p0: Point, p2: Point, w: number, h: number): Point {
  const mx = (p0.x + p2.x) / 2;
  const my = (p0.y + p2.y) / 2;
  const dx = p2.x - p0.x;
  const dy = p2.y - p0.y;
  const nx = -dy / len(dx, dy);
  const ny = dx / len(dx, dy);
  const arcAmp = Math.min(w, h) * (0.08 + Math.random() * 0.14);
  const sign = Math.random() < 0.5 ? -1 : 1;
  return {
    x: mx + nx * arcAmp * sign,
    y: my + ny * arcAmp * sign,
  };
}

function randomPointInBounds(w: number, h: number, pad: number): Point {
  return {
    x: pad + Math.random() * Math.max(1, w - 2 * pad),
    y: pad + Math.random() * Math.max(1, h - 2 * pad),
  };
}

function initialCenterForIndex(i: number, n: number, w: number, h: number): Point {
  const t = (i / Math.max(1, n)) * Math.PI * 2;
  const r = 0.36 * Math.min(w, h);
  const cx = w / 2 + Math.cos(t + i * 0.65) * r * (0.88 + (i % 3) * 0.04);
  const cy = h / 2 + Math.sin(t + i * 0.55) * r * (0.88 + (i % 2) * 0.06);
  return {
    x: Math.min(w * 0.92, Math.max(w * 0.08, cx)),
    y: Math.min(h * 0.92, Math.max(h * 0.08, cy)),
  };
}

function nextSegment(p0: Point, w: number, h: number, speed: number): Omit<SegmentState, 'startMs'> {
  const pad = Math.min(w, h) * 0.06;
  const p2 = randomPointInBounds(w, h, pad);
  const p1 = randomControlPoint(p0, p2, w, h);
  const base =
    BASE_SEGMENT_DURATION_MIN_MS +
    Math.random() * (BASE_SEGMENT_DURATION_MAX_MS - BASE_SEGMENT_DURATION_MIN_MS);
  const durationMs = Math.max(4000, base / Math.max(0.25, speed));
  return { p0, p1, p2, durationMs };
}

function createSegment(
  p0: Point,
  w: number,
  h: number,
  startMs: number,
  speed: number,
): SegmentState {
  const n = nextSegment(p0, w, h, speed);
  return { p0: n.p0, p1: n.p1, p2: n.p2, durationMs: n.durationMs, startMs };
}

export function AmbientArcBlobs() {
  const { data: displayConfig } = useDisplayConfig();
  const config: AmbientBlobConfig = displayConfig?.ambientBlobs ?? DEFAULT_AMBIENT_BLOB_CONFIG;

  const cfgRef = useRef(config);
  useLayoutEffect(() => {
    cfgRef.current = config;
  });

  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const segRef = useRef<SegmentState[] | null>(null);
  const rafRef = useRef<number>(0);
  const boundsRef = useRef({ w: 0, h: 0 });

  const updateBounds = useCallback(() => {
    boundsRef.current = { w: window.innerWidth, h: window.innerHeight };
  }, []);

  const applyStaticLayout = useCallback((w: number, h: number, cfg: AmbientBlobConfig) => {
    const n = cfg.blobCount;
    const halfBase = (Math.min(w, h) * BASE_BLOB_SIZE_VMIN * cfg.size) / 200;
    for (let i = 0; i < n; i++) {
      const el = blobRefs.current[i];
      if (!el) continue;
      const c = initialCenterForIndex(i, n, w, h);
      el.style.transform = `translate3d(${c.x - halfBase}px, ${c.y - halfBase}px, 0) scale(1)`;
      el.style.width = `${BASE_BLOB_SIZE_VMIN * cfg.size}vmin`;
      el.style.height = `${BASE_BLOB_SIZE_VMIN * cfg.size}vmin`;
      el.style.filter = `blur(${Math.round(BASE_BLUR_PX * Math.min(1.15, Math.sqrt(cfg.size)))}px)`;
    }
  }, []);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      return;
    }

    updateBounds();
    const { w, h } = boundsRef.current;
    if (w < 1 || h < 1) return;

    const cfg = cfgRef.current;
    const n = cfg.blobCount;
    const speed = cfg.speed;
    const now = performance.now();
    const initialCenters = Array.from({ length: n }, (_, i) => initialCenterForIndex(i, n, w, h));
    segRef.current = initialCenters.map((p0) => createSegment(p0, w, h, now, speed));

    const tick = (tMs: number) => {
      if (document.visibilityState === 'hidden') {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const { w: bw, h: bh } = boundsRef.current;
      let segs = segRef.current;
      const live = cfgRef.current;
      if (!segs || bw < 1 || bh < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const nBlobs = live.blobCount;
      if (segs.length !== nBlobs) {
        const tNow = performance.now();
        const centers = Array.from({ length: nBlobs }, (_, j) =>
          initialCenterForIndex(j, nBlobs, bw, bh),
        );
        segRef.current = centers.map((p0) => createSegment(p0, bw, bh, tNow, live.speed));
        segs = segRef.current;
      }

      const halfBase = (Math.min(bw, bh) * BASE_BLOB_SIZE_VMIN * live.size) / 200;
      const pulsePeriod = BASE_PULSE_PERIOD_MS / Math.max(0.25, live.speed);
      const pulse =
        1 + live.pulseAmount * Math.sin((2 * Math.PI * tMs) / pulsePeriod);
      const blurPx = Math.round(BASE_BLUR_PX * Math.min(1.15, Math.sqrt(live.size)));

      const activeSegs = segRef.current;
      if (!activeSegs || activeSegs.length !== nBlobs) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      for (let i = 0; i < nBlobs; i++) {
        let s = activeSegs[i];
        let elapsed = tMs - s.startMs;
        while (elapsed >= s.durationMs) {
          const next = nextSegment(s.p2, bw, bh, live.speed);
          s = {
            p0: s.p2,
            p1: next.p1,
            p2: next.p2,
            startMs: s.startMs + s.durationMs,
            durationMs: next.durationMs,
          };
          activeSegs[i] = s;
          elapsed = tMs - s.startMs;
        }
        const u = Math.min(1, Math.max(0, elapsed / s.durationMs));
        const te = easeInOutCubic(u);
        const pos = quadBezier(s.p0, s.p1, s.p2, te);
        const el = blobRefs.current[i];
        if (el) {
          const hAdj = halfBase * pulse;
          el.style.transform = `translate3d(${pos.x - hAdj}px, ${pos.y - hAdj}px, 0) scale(${pulse})`;
          el.style.width = `${BASE_BLOB_SIZE_VMIN * live.size}vmin`;
          el.style.height = `${BASE_BLOB_SIZE_VMIN * live.size}vmin`;
          el.style.filter = `blur(${blurPx}px)`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const onResize = () => {
      const prevW = boundsRef.current.w;
      const prevH = boundsRef.current.h;
      updateBounds();
      const nw = boundsRef.current.w;
      const nh = boundsRef.current.h;
      if (!segRef.current || nw < 1 || nh < 1 || prevW < 1 || prevH < 1) return;
      const rx = nw / prevW;
      const ry = nh / prevH;
      const tNow = performance.now();
      const live = cfgRef.current;
      for (let i = 0; i < segRef.current.length; i++) {
        const s = segRef.current[i];
        segRef.current[i] = {
          p0: { x: s.p0.x * rx, y: s.p0.y * ry },
          p1: { x: s.p1.x * rx, y: s.p1.y * ry },
          p2: { x: s.p2.x * rx, y: s.p2.y * ry },
          durationMs: s.durationMs,
          startMs: tNow,
        };
      }
      if (segRef.current.length !== live.blobCount) {
        const n2 = live.blobCount;
        const centers = Array.from({ length: n2 }, (_, j) =>
          initialCenterForIndex(j, n2, nw, nh),
        );
        segRef.current = centers.map((p0) => createSegment(p0, nw, nh, tNow, live.speed));
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        updateBounds();
      }
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [config.blobCount, updateBounds, applyStaticLayout]);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      return;
    }
    updateBounds();
    const { w, h } = boundsRef.current;
    applyStaticLayout(w, h, cfgRef.current);
  }, [config.blobCount, config.size, updateBounds, applyStaticLayout]);

  const n = config.blobCount;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            blobRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 will-change-transform rounded-full"
          style={{
            width: `${BASE_BLOB_SIZE_VMIN * config.size}vmin`,
            height: `${BASE_BLOB_SIZE_VMIN * config.size}vmin`,
            filter: `blur(${Math.round(BASE_BLUR_PX * Math.min(1.15, Math.sqrt(config.size)))}px)`,
            background: BLOB_BACKGROUNDS[i % BLOB_BACKGROUNDS.length],
          }}
        />
      ))}
    </div>
  );
}
