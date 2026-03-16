import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

/**
 * Figma'dan export edilen SVG orbların react-native-svg karşılığı.
 * radialGradient: merkezden kenara yumuşak geçiş (feGaussianBlur RN'de desteklenmediği için sadece gradient)
 */
const ORB_SIZE = 384;

const defaultStops = {
  violet: [
    { offset: 0, opacity: 0.4 },
    { offset: 0.5, opacity: 0.2 },
    { offset: 1, opacity: 0 },
  ],
  cyan: [
    { offset: 0, opacity: 0.4 },
    { offset: 0.5, opacity: 0.2 },
    { offset: 1, opacity: 0 },
  ],
  pink: [
    { offset: 0, opacity: 0.2 },
    { offset: 0.5, opacity: 0.1 },
    { offset: 1, opacity: 0 },
  ],
};

export function OrbViolet({ size = ORB_SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 384 384">
      <Defs>
        <RadialGradient id="violetGradient" cx="50%" cy="50%" r="50%">
          {defaultStops.violet.map((s, i) => (
            <Stop key={i} offset={String(s.offset)} stopColor="#8B5CF6" stopOpacity={s.opacity} />
          ))}
        </RadialGradient>
      </Defs>
      <Circle cx="192" cy="192" r="192" fill="url(#violetGradient)" />
    </Svg>
  );
}

export function OrbCyan({ size = ORB_SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 384 384">
      <Defs>
        <RadialGradient id="cyanGradient" cx="50%" cy="50%" r="50%">
          {defaultStops.cyan.map((s, i) => (
            <Stop key={i} offset={String(s.offset)} stopColor="#06B6D4" stopOpacity={s.opacity} />
          ))}
        </RadialGradient>
      </Defs>
      <Circle cx="192" cy="192" r="192" fill="url(#cyanGradient)" />
    </Svg>
  );
}

export function OrbPink({ size = ORB_SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 384 384">
      <Defs>
        <RadialGradient id="pinkGradient" cx="50%" cy="50%" r="50%">
          {defaultStops.pink.map((s, i) => (
            <Stop key={i} offset={String(s.offset)} stopColor="#EC4899" stopOpacity={s.opacity} />
          ))}
        </RadialGradient>
      </Defs>
      <Circle cx="192" cy="192" r="192" fill="url(#pinkGradient)" />
    </Svg>
  );
}
