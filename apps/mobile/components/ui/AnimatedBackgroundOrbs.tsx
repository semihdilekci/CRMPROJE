import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { OrbViolet, OrbCyan, OrbPink } from './OrbSvg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Figma SVG: 384x384, Web konumları: top-1/4 -left-48, bottom-1/4 -right-48, top-1/2 left-1/2
const ORB_SIZE = 384;
const ORB_OFFSET = 192;

const ORBS = [
  {
    Orb: OrbViolet,
    top: SCREEN_HEIGHT * 0.25 - ORB_SIZE / 2,
    left: -ORB_OFFSET,
    delay: 0,
  },
  {
    Orb: OrbCyan,
    top: SCREEN_HEIGHT * 0.75 - ORB_SIZE / 2,
    left: SCREEN_WIDTH - ORB_SIZE + ORB_OFFSET,
    delay: 1000,
  },
  {
    Orb: OrbPink,
    top: SCREEN_HEIGHT * 0.5 - ORB_SIZE / 2,
    left: SCREEN_WIDTH * 0.5 - ORB_SIZE / 2,
    delay: 2000,
  },
];

function AnimatedOrb({
  Orb,
  top,
  left,
  delay,
}: (typeof ORBS)[0]) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orbWrapper,
        {
          left,
          top,
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
  return (
    <View style={styles.container} pointerEvents="none">
      {ORBS.map((orb, i) => (
        <AnimatedOrb key={i} {...orb} />
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
