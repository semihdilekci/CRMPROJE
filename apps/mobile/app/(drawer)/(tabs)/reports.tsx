import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { REPORT_CATALOG } from '@crm/shared';
import type { ApiSuccessResponse, ExecutiveSummaryResponse } from '@crm/shared';
import api from '@/lib/api';

function formatValue(value: number, format?: string): string {
  switch (format) {
    case 'currency':
      if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `₺${(value / 1_000).toFixed(0)}K`;
      return `₺${value.toLocaleString('tr-TR')}`;
    case 'percent':
      return `%${value.toFixed(1)}`;
    default:
      return value.toLocaleString('tr-TR');
  }
}

const KPIS_CONFIG = [
  { key: 'activeFairs', label: 'Aktif Fuar', format: 'number', icon: '🏛', color: '#a78bfa' },
  { key: 'openOpportunities', label: 'Açık Fırsat', format: 'number', icon: '🔄', color: '#22d3ee' },
  { key: 'pipelineValue', label: 'Pipeline Değeri', format: 'currency', icon: '💰', color: '#fb923c' },
  { key: 'wonRevenue', label: 'Kazanılan Gelir', format: 'currency', icon: '✅', color: '#4ade80' },
  { key: 'conversionRate', label: 'Dönüşüm Oranı', format: 'percent', icon: '📈', color: '#fbbf24' },
  { key: 'totalCustomers', label: 'Toplam Müşteri', format: 'number', icon: '👥', color: '#22d3ee' },
] as const;

function MiniKpiCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-3.5">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">{label}</Text>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text style={{ color, fontWeight: '700', fontSize: 20 }}>{value}</Text>
    </View>
  );
}

function ExecutiveSummaryMini() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'executive-summary-mobile'],
    queryFn: async () => {
      const { data: resp } = await api.get<ApiSuccessResponse<ExecutiveSummaryResponse>>('/reports/executive-summary');
      return resp.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator color="#8b5cf6" />
        <Text className="text-white/40 text-xs mt-2">Dashboard yükleniyor...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="items-center py-8">
        <Text className="text-white/30 text-sm">Veri bulunamadı</Text>
      </View>
    );
  }

  const kpis = data.kpis;

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        {KPIS_CONFIG.slice(0, 2).map((cfg) => (
          <MiniKpiCard
            key={cfg.key}
            label={cfg.label}
            value={formatValue(kpis[cfg.key] as number, cfg.format)}
            icon={cfg.icon}
            color={cfg.color}
          />
        ))}
      </View>
      <View className="flex-row gap-3">
        {KPIS_CONFIG.slice(2, 4).map((cfg) => (
          <MiniKpiCard
            key={cfg.key}
            label={cfg.label}
            value={formatValue(kpis[cfg.key] as number, cfg.format)}
            icon={cfg.icon}
            color={cfg.color}
          />
        ))}
      </View>
      <View className="flex-row gap-3">
        {KPIS_CONFIG.slice(4, 6).map((cfg) => (
          <MiniKpiCard
            key={cfg.key}
            label={cfg.label}
            value={formatValue(kpis[cfg.key] as number, cfg.format)}
            icon={cfg.icon}
            color={cfg.color}
          />
        ))}
      </View>

      {/* Top Fairs mini leaderboard */}
      {data.topFairs.length > 0 && (
        <View className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
          <Text className="text-white text-[13px] font-semibold mb-3">En Aktif 5 Fuar</Text>
          {data.topFairs.map((fair, i) => (
            <View key={fair.id} className="flex-row items-center justify-between py-1.5 border-b border-white/5 last:border-b-0">
              <View className="flex-row items-center gap-2">
                <Text className="text-violet-400 text-xs font-bold w-5">#{i + 1}</Text>
                <Text className="text-white/70 text-xs" numberOfLines={1}>{fair.name}</Text>
              </View>
              <Text className="text-white/50 text-[11px]">{fair.openOpportunities} fırsat</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type ViewMode = 'dashboard' | 'catalog';

export default function ReportsScreen() {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  return (
    <GradientBackground>
      <Header
        showSearch={false}
        title="Raporlar"
        onMenuPress={() => {
          (navigation as { openDrawer?: () => void }).openDrawer?.();
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab selector */}
        <View className="flex-row rounded-xl border border-white/10 bg-white/5 p-1 mb-5">
          <Pressable
            onPress={() => setViewMode('dashboard')}
            className={`flex-1 rounded-lg py-2 ${viewMode === 'dashboard' ? 'bg-violet-500/20' : ''}`}
          >
            <Text className={`text-center text-xs font-semibold ${viewMode === 'dashboard' ? 'text-violet-400' : 'text-white/50'}`}>
              Dashboard
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('catalog')}
            className={`flex-1 rounded-lg py-2 ${viewMode === 'catalog' ? 'bg-violet-500/20' : ''}`}
          >
            <Text className={`text-center text-xs font-semibold ${viewMode === 'catalog' ? 'text-violet-400' : 'text-white/50'}`}>
              Tüm Raporlar
            </Text>
          </Pressable>
        </View>

        {viewMode === 'dashboard' ? (
          <View>
            <Text className="text-white text-lg font-bold mb-1" style={{ fontFamily: 'System' }}>
              Genel Durum
            </Text>
            <Text className="text-white/40 text-xs mb-4">Yönetici özeti — anlık operasyon metrikleri</Text>
            <ExecutiveSummaryMini />
          </View>
        ) : (
          <View className="gap-6">
            {REPORT_CATALOG.map((category) => (
              <View key={category.id}>
                <Text className="text-white text-base font-semibold mb-1">{category.title}</Text>
                <Text className="text-white/40 text-[11px] mb-3">{category.description}</Text>
                <View className="gap-2.5">
                  {category.reports.map((report) => (
                    <View
                      key={report.slug}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5"
                    >
                      <View className="flex-row items-center gap-3">
                        <Text style={{ fontSize: 20 }}>{report.icon}</Text>
                        <View className="flex-1">
                          <Text className="text-white text-[13px] font-semibold">{report.name}</Text>
                          <Text className="text-white/40 text-[11px] mt-0.5" numberOfLines={2}>{report.description}</Text>
                        </View>
                        <View className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5">
                          <Text className="text-violet-400 text-[10px] font-medium">Web</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <View className="items-center py-4">
              <Text className="text-white/30 text-[11px] text-center">
                Detaylı dashboard görünümleri web uygulamasından erişilebilir
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}
