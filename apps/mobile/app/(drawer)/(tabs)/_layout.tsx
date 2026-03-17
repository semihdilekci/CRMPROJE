import { Tabs, usePathname } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { GradientView } from '@/components/ui/GradientView';
import { FairTabIcon } from '@/components/ui/FairTabIcon';
import { ChartTabIcon } from '@/components/ui/ChartTabIcon';
import { useFairFormStore } from '@/stores/fair-form-store';
import { useOpportunityFormStore } from '@/stores/opportunity-form-store';

function AddButton(props: React.ComponentProps<typeof Pressable>) {
  const pathname = usePathname();
  const openFairForm = useFairFormStore((s) => s.open);
  const openOpportunityForm = useOpportunityFormStore((s) => s.open);

  const handlePress = () => {
    const fairDetailMatch = pathname?.match(/\/fairs\/([^/]+)/);
    if (fairDetailMatch) {
      openOpportunityForm(fairDetailMatch[1]);
    } else {
      openFairForm();
    }
  };

  return (
    <Pressable {...props} onPress={handlePress}>
      {props.children}
    </Pressable>
  );
}

function TabBarIconOnly({
  icon: Icon,
  focused,
}: {
  icon: React.ComponentType<{ focused?: boolean }>;
  focused?: boolean;
}) {
  return (
    <View className="items-center justify-center flex-1">
      <Icon focused={focused} />
    </View>
  );
}

const FAB_SIZE = 60; // 52 * 1.1 (%10 büyük)
const TAB_BAR_OVERFLOW_RATIO = 0.73; // %5 taşma

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 45 + insets.bottom;
  const overflowAmount = tabBarHeight * TAB_BAR_OVERFLOW_RATIO;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopColor: 'rgba(255,255,255,0.1)',
            height: tabBarHeight,
            paddingBottom: insets.bottom,
          },
          tabBarBackground: () => (
            <>
              <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(2, 6, 23, 0.5)' },
                ]}
              />
            </>
          ),
          tabBarItemStyle: { paddingVertical: 8 },
          tabBarActiveTintColor: '#8b5cf6',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        }}
      >
        <Tabs.Screen
          name="fairs"
          options={{
            title: 'Fuarlar',
            tabBarIcon: ({ focused }) => (
              <TabBarIconOnly icon={FairTabIcon} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Ekle',
            tabBarIcon: () => null,
            tabBarButton: (props) => {
              const { style, ref: _ref, ...rest } = props;
              return (
                <AddButton {...rest} style={[styles.addTabPlaceholder, style]} />
              );
            },
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'AI Analiz',
            tabBarIcon: ({ focused }) => (
              <TabBarIconOnly icon={ChartTabIcon} focused={focused} />
            ),
          }}
        />
      </Tabs>
      {/* FAB overlay — tab bar'ı %5 taşacak şekilde */}
      <View
        pointerEvents="box-none"
        style={[styles.fabOverlay, { bottom: tabBarHeight - overflowAmount }]}
      >
        <AddButton style={styles.fabButton}>
          <View style={styles.fabInner}>
            <GradientView
              direction="horizontal"
              style={styles.fabGradient}
            >
              <Text className="text-white font-semibold" style={{ fontSize: 25 }}>+</Text>
            </GradientView>
          </View>
        </AddButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addTabPlaceholder: {
    flex: 1,
    minWidth: FAB_SIZE,
  },
  fabOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
    zIndex: 10,
  },
  fabButton: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  fabInner: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 3.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGradient: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 3.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
