import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  AccessibilityInfo,
  AppState,
  type AppStateStatus,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { OrbViolet, OrbCyan, OrbPink } from './OrbSvg';

const ORB_SIZE = 450;
const ORB_OFFSET = 192;

/** Orb hızı: her Bezier segmentinin süresi (ms). Küçült = daha hızlı. */
const ORB_SEGMENT_DURATION_MIN_MS = 18_000;
const ORB_SEGMENT_DURATION_MAX_MS = 40_000;

type Point = { x: number; y: number };

function bezierScalar(p0: number, p1: number, p2: number, t: number): number {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
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
  return { x: mx + nx * arcAmp * sign, y: my + ny * arcAmp * sign };
}

function randomPointInBounds(w: number, h: number, pad: number): Point {
  return {
    x: pad + Math.random() * Math.max(1, w - 2 * pad),
    y: pad + Math.random() * Math.max(1, h - 2 * pad),
  };
}

type OrbConfig = {
  Orb: React.ComponentType<{ size?: number }>;
  anchorLeft: number;
  anchorTop: number;
  startDelayMs: number;
};

function AnimatedArcOrb({
  Orb,
  anchorLeft,
  anchorTop,
  startDelayMs,
  width,
  height,
  reduceMotion,
  appActiveRef,
  pauseNonce,
  resumeNonce,
}: OrbConfig & {
  width: number;
  height: number;
  reduceMotion: boolean;
  appActiveRef: React.MutableRefObject<boolean>;
  pauseNonce: number;
  resumeNonce: number;
}) {
  const anchorX = anchorLeft + ORB_SIZE / 2;
  const anchorY = anchorTop + ORB_SIZE / 2;

  const p0x = useSharedValue(anchorX);
  const p0y = useSharedValue(anchorY);
  const p1x = useSharedValue(anchorX);
  const p1y = useSharedValue(anchorY);
  const p2x = useSharedValue(anchorX);
  const p2y = useSharedValue(anchorY);
  const progress = useSharedValue(0);

  const mountedRef = useRef(true);
  /** Worklet içinde ref okunmaz; güncel scheduleSegment burada tutulur (yalnızca JS thread). */
  const scheduleSegmentRef = useRef<(from: Point | null) => void>(() => {});

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resumeFromSnapshot = useCallback(() => {
    if (!mountedRef.current || reduceMotion || width < 8 || height < 8) return;
    const t = progress.value;
    let cx: number;
    let cy: number;
    if (t <= 0.001) {
      cx = p0x.value;
      cy = p0y.value;
    } else if (t >= 0.999) {
      cx = p2x.value;
      cy = p2y.value;
    } else {
      cx = bezierScalar(p0x.value, p1x.value, p2x.value, t);
      cy = bezierScalar(p0y.value, p1y.value, p2y.value, t);
    }
    cancelAnimation(progress);
    scheduleSegmentRef.current({ x: cx, y: cy });
  }, [reduceMotion, width, height, progress, p0x, p0y, p1x, p1y, p2x, p2y]);

  const onSegmentAnimationFinished = useCallback((endX: number, endY: number) => {
    if (!mountedRef.current || !appActiveRef.current) return;
    scheduleSegmentRef.current({ x: endX, y: endY });
  }, []);

  const scheduleSegment = useCallback(
    (fromP0: Point | null) => {
      if (!mountedRef.current || reduceMotion || !appActiveRef.current) return;

      const w = width;
      const h = height;
      if (w < 8 || h < 8) return;

      const pad = Math.min(w, h) * 0.06;
      const p0 = fromP0 ?? { x: anchorX, y: anchorY };
      const p2 = randomPointInBounds(w, h, pad);
      const p1 = randomControlPoint(p0, p2, w, h);
      const duration =
        ORB_SEGMENT_DURATION_MIN_MS +
        Math.random() * (ORB_SEGMENT_DURATION_MAX_MS - ORB_SEGMENT_DURATION_MIN_MS);

      p0x.value = p0.x;
      p0y.value = p0.y;
      p1x.value = p1.x;
      p1y.value = p1.y;
      p2x.value = p2.x;
      p2y.value = p2.y;
      progress.value = 0;
      progress.value = withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (!finished) return;
        const nx = p2x.value;
        const ny = p2y.value;
        runOnJS(onSegmentAnimationFinished)(nx, ny);
      });
    },
    [
      anchorX,
      anchorY,
      width,
      height,
      reduceMotion,
      p0x,
      p0y,
      p1x,
      p1y,
      p2x,
      p2y,
      progress,
      onSegmentAnimationFinished,
    ],
  );

  useEffect(() => {
    scheduleSegmentRef.current = scheduleSegment;
  }, [scheduleSegment]);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(progress);
      return;
    }
    const t = setTimeout(() => {
      if (appActiveRef.current) scheduleSegment(null);
    }, startDelayMs);
    return () => clearTimeout(t);
  }, [reduceMotion, startDelayMs, scheduleSegment, progress, appActiveRef]);

  useEffect(() => {
    if (pauseNonce === 0) return;
    cancelAnimation(progress);
  }, [pauseNonce, progress]);

  useEffect(() => {
    if (resumeNonce === 0) return;
    if (!appActiveRef.current) return;
    resumeFromSnapshot();
  }, [resumeNonce, appActiveRef, resumeFromSnapshot]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const u = 1 - t;
    const cx = u * u * p0x.value + 2 * u * t * p1x.value + t * t * p2x.value;
    const cy = u * u * p0y.value + 2 * u * t * p1y.value + t * t * p2y.value;
    return {
      transform: [{ translateX: cx - anchorX }, { translateY: cy - anchorY }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.orbWrapper,
        {
          left: anchorLeft,
          top: anchorTop,
          width: ORB_SIZE,
          height: ORB_SIZE,
        },
        animatedStyle,
      ]}
    >
      <Orb size={ORB_SIZE} />
    </Animated.View>
  );
}

export function AnimatedBackgroundOrbs() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pauseNonce, setPauseNonce] = useState(0);
  const [resumeNonce, setResumeNonce] = useState(0);
  const appActiveRef = useRef(AppState.currentState === 'active');
  const appStatePrevRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const prev = appStatePrevRef.current;
      appStatePrevRef.current = next;
      appActiveRef.current = next === 'active';
      if (next !== 'active' && prev === 'active') {
        setPauseNonce((n) => n + 1);
      }
      if (next === 'active' && prev !== 'active') {
        setResumeNonce((n) => n + 1);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const orbs: OrbConfig[] = [
    {
      Orb: OrbViolet,
      anchorLeft: -ORB_OFFSET,
      anchorTop: SCREEN_HEIGHT * 0.25 - ORB_SIZE / 2,
      startDelayMs: 0,
    },
    {
      Orb: OrbCyan,
      anchorLeft: SCREEN_WIDTH - ORB_SIZE + ORB_OFFSET,
      anchorTop: SCREEN_HEIGHT * 0.75 - ORB_SIZE / 2,
      startDelayMs: 800,
    },
    {
      Orb: OrbPink,
      anchorLeft: SCREEN_WIDTH * 0.9 - ORB_SIZE / 2,
      anchorTop: SCREEN_HEIGHT * 0.4 - ORB_SIZE / 2,
      startDelayMs: 1600,
    },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {orbs.map((orb, i) => (
        <AnimatedArcOrb
          key={i}
          {...orb}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          reduceMotion={reduceMotion}
          appActiveRef={appActiveRef}
          pauseNonce={pauseNonce}
          resumeNonce={resumeNonce}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orbWrapper: {
    position: 'absolute',
  },
});
