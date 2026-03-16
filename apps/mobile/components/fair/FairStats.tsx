import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  CONVERSION_RATES,
  CONVERSION_RATE_LABELS,
  CONVERSION_RATE_COLORS,
} from '@crm/shared';
import { GradientView } from '@/components/ui/GradientView';
import { theme } from '@/constants/theme';
import type { OpportunityWithDetails } from '@crm/shared';

interface FairStatsProps {
  opportunities: OpportunityWithDetails[];
  selectedRates: string[];
  onRateToggle: (rate: string | null) => void;
}

/** Hex color with alpha (0-1). */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function FairStats({ opportunities, selectedRates, onRateToggle }: FairStatsProps) {
  const rateStats = CONVERSION_RATES.map((rate) => {
    const count = opportunities.filter((o) => o.conversionRate === rate).length;
    return {
      rate,
      label: CONVERSION_RATE_LABELS[rate],
      color: CONVERSION_RATE_COLORS[rate],
      count,
    };
  }).filter((s) => s.count > 0);

  const isAllSelected = selectedRates.length === 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        gap: 12,
      }}
      className="mb-4"
    >
      {isAllSelected ? (
        <View
          style={{
            borderWidth: 2,
            borderColor: 'rgba(139, 92, 246, 0.5)',
            borderRadius: 14,
            padding: 2,
          }}
        >
          <Pressable
            onPress={() => onRateToggle(null)}
            className="rounded-xl overflow-hidden"
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
              minWidth: 100,
              borderWidth: 2,
              borderColor: 'rgba(139, 92, 246, 0.6)',
              borderRadius: 12,
              overflow: 'hidden',
              ...(Platform.OS === 'ios' && {
                shadowColor: '#8b5cf6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              }),
              ...(Platform.OS === 'android' && { elevation: 6 }),
            })}
          >
            <GradientView
              direction="horizontal"
              colors={theme.gradients.primary}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                minWidth: 100,
                borderRadius: 10,
              }}
            >
              <Text className="text-white text-2xl font-bold">{opportunities.length}</Text>
              <Text className="text-white/80 text-[12px]">Toplam Fırsat</Text>
            </GradientView>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => onRateToggle(null)}
          className="rounded-xl overflow-hidden"
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            minWidth: 100,
            borderWidth: 2,
            borderColor: theme.colors.glassBorder,
            borderRadius: 12,
            overflow: 'hidden',
          })}
        >
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <GradientView
            colors={theme.gradients.glass}
            direction="diagonal"
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              minWidth: 100,
              borderRadius: 10,
            }}
          >
            <Text className="text-white text-2xl font-bold">{opportunities.length}</Text>
            <Text className="text-white/80 text-[12px]">Toplam Fırsat</Text>
          </GradientView>
        </Pressable>
      )}
      {rateStats.map((stat) => {
        const isSelected = selectedRates.includes(stat.rate);
        const pressable = (
          <Pressable
            onPress={() => onRateToggle(stat.rate)}
            className="rounded-xl overflow-hidden"
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
              minWidth: 100,
              borderWidth: 2,
              borderColor: isSelected ? stat.color : withAlpha(stat.color, 0.3),
              borderRadius: 12,
              ...(isSelected && Platform.OS === 'ios' && {
                shadowColor: stat.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 6,
              }),
              ...(isSelected && Platform.OS === 'android' && { elevation: 6 }),
            })}
          >
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
            <GradientView
              colors={theme.gradients.glass}
              direction="diagonal"
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                minWidth: 100,
                borderRadius: 10,
              }}
            >
              <Text className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.count}
              </Text>
              <Text className="text-white/60 text-[12px]">{stat.label}</Text>
            </GradientView>
          </Pressable>
        );
        return isSelected ? (
          <View
            key={stat.rate}
            style={{
              borderWidth: 2,
              borderColor: withAlpha(stat.color, 0.5),
              borderRadius: 14,
              padding: 2,
            }}
          >
            {pressable}
          </View>
        ) : (
          <React.Fragment key={stat.rate}>{pressable}</React.Fragment>
        );
      })}
    </ScrollView>
  );
}
