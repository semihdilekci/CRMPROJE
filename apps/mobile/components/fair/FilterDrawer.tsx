import { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated } from 'react-native';
import { ChevronDown, Search } from 'lucide-react-native';
import {
  PIPELINE_STAGES,
  getStageLabel,
} from '@crm/shared';
import { Input } from '@/components/ui/Input';

const STAGE_OPTIONS = [
  ...PIPELINE_STAGES.map((s) => ({ value: s.value, label: getStageLabel(s.value) })),
  { value: 'olumsuz', label: 'Olumsuz Sonuçlandı' },
];

interface FilterDrawerProps {
  expanded: boolean;
  onToggle: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  stageFilter: string | null;
  onStageFilterChange: (value: string | null) => void;
}

export function FilterDrawer({
  expanded,
  onToggle,
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
}: FilterDrawerProps) {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded, animatedHeight]);

  /** İçerik ~130–155px; 220px fazla boşluk bırakıyordu (aşama chip’leri ile kartlar arası). */
  const drawerHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  const rotateChevron = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View className="px-4 mb-2 overflow-hidden">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between border-b border-white/20 py-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <View className="flex-row items-center gap-2">
          <Search size={16} color="rgba(255,255,255,0.5)" />
          <Text className="text-white/60 text-[13px]">
            {expanded ? 'Filtreleri kapat' : 'Ara veya filtrele'}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
          <ChevronDown size={18} color="rgba(255,255,255,0.5)" />
        </Animated.View>
      </Pressable>

      <Animated.View style={{ height: drawerHeight, overflow: 'hidden' }}>
        <View className="pt-2 gap-2">
          <Input
            placeholder="İsim veya firma ara..."
            value={search}
            onChangeText={onSearchChange}
          />
          <View className="gap-2">
            <Text className="text-white/60 text-[11px] font-semibold uppercase tracking-wider">
              Aşama
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 16 }}
            >
              <Pressable
                onPress={() => onStageFilterChange(null)}
                className="rounded-lg px-3 py-2 border"
                style={{
                  backgroundColor: !stageFilter ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                  borderColor: !stageFilter ? 'rgba(139, 92, 246, 0.6)' : 'rgba(255,255,255,0.2)',
                }}
              >
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: !stageFilter ? '#c4b5fd' : 'rgba(255,255,255,0.8)' }}
                >
                  Tümü
                </Text>
              </Pressable>
              {STAGE_OPTIONS.map((s) => {
                const selected = stageFilter === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => onStageFilterChange(selected ? null : s.value)}
                    className="rounded-lg px-3 py-2 border"
                    style={{
                      backgroundColor: selected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                      borderColor: selected ? 'rgba(139, 92, 246, 0.6)' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <Text
                      className="text-[13px] font-medium"
                      style={{ color: selected ? '#c4b5fd' : 'rgba(255,255,255,0.8)' }}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
