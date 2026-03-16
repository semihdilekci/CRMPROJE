import { useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { FairDetailHeader } from '@/components/fair/FairDetailHeader';
import { FairStats } from '@/components/fair/FairStats';
import { FilterDrawer } from '@/components/fair/FilterDrawer';
import { OpportunityCard } from '@/components/opportunity/OpportunityCard';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useFairDetail } from '@/hooks/use-fairs';
import { useOpportunityFormStore } from '@/stores/opportunity-form-store';
import { useStageTransitionStore } from '@/stores/stage-transition-store';
import { useOfferStore } from '@/stores/offer-store';
import type { OpportunityWithDetails } from '@crm/shared';

function filterOpportunities(
  opportunities: OpportunityWithDetails[],
  search: string,
  selectedRates: string[],
  stageFilter: string | null
): OpportunityWithDetails[] {
  return opportunities.filter((o) => {
    const searchLower = search.trim().toLowerCase();
    if (searchLower) {
      const nameMatch = o.customer?.name?.toLowerCase().includes(searchLower);
      const companyMatch = o.customer?.company?.toLowerCase().includes(searchLower);
      if (!nameMatch && !companyMatch) return false;
    }
    if (selectedRates.length > 0 && (!o.conversionRate || !selectedRates.includes(o.conversionRate))) {
      return false;
    }
    if (stageFilter && o.currentStage !== stageFilter) return false;
    return true;
  });
}

export default function FairDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: fair, isLoading, error } = useFairDetail(id ?? null);

  const [search, setSearch] = useState('');
  const [selectedRates, setSelectedRates] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [filterDrawerExpanded, setFilterDrawerExpanded] = useState(false);
  const openOpportunityForm = useOpportunityFormStore((s) => s.open);
  const openStageTransition = useStageTransitionStore((s) => s.open);
  const openOfferSheet = useOfferStore((s) => s.open);

  const opportunities = fair?.opportunities ?? [];
  const filteredOpportunities = useMemo(
    () => filterOpportunities(opportunities, search, selectedRates, stageFilter),
    [opportunities, search, selectedRates, stageFilter]
  );
  const hasActiveFilters = !!search.trim() || selectedRates.length > 0 || !!stageFilter;

  const handleRateToggle = (rate: string | null) => {
    if (rate === null) {
      setSelectedRates([]);
      return;
    }
    setSelectedRates((prev) =>
      prev.includes(rate) ? prev.filter((r) => r !== rate) : [...prev, rate]
    );
  };

  if (isLoading || !fair) {
    return (
      <GradientBackground>
        <Header
          onBackPress={() => router.back()}
          title="Fuar Detay"
          showSearch={false}
        />
        <View className="flex-1 items-center justify-center">
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text className="text-white/60 mt-3">Yükleniyor...</Text>
            </>
          ) : (
            <Text className="text-white/60">Fuar bulunamadı</Text>
          )}
        </View>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <Header
          onBackPress={() => router.back()}
          title="Fuar Detay"
          showSearch={false}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[#F87171] text-center">
            Fuar detayı yüklenirken hata oluştu
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Header
        onBackPress={() => router.back()}
        title={fair.name}
        showSearch={false}
      />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <FairDetailHeader fair={fair} />
        <FairStats
          opportunities={opportunities}
          selectedRates={selectedRates}
          onRateToggle={handleRateToggle}
        />
        <FilterDrawer
          expanded={filterDrawerExpanded}
          onToggle={() => setFilterDrawerExpanded((e) => !e)}
          search={search}
          onSearchChange={setSearch}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
        />
        {filteredOpportunities.length > 0 ? (
          <View className="px-4">
            {filteredOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                fairId={fair.id}
                onEdit={() => openOpportunityForm(fair.id, opp)}
                onStageChange={() => openStageTransition(opp, fair.id)}
                onOfferDownload={() => openOfferSheet(opp, fair.id)}
              />
            ))}
            <Pressable
              onPress={() => openOpportunityForm(fair.id)}
              className="rounded-xl border-2 border-dashed border-white/20 p-4 mt-2 mb-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-white/60 text-[15px] font-medium text-center">
                + Yeni Fırsat Ekle
              </Text>
            </Pressable>
          </View>
        ) : hasActiveFilters ? (
          <View className="px-4 py-12 items-center">
            <Text className="text-white/60 text-sm text-center">
              Arama sonucu bulunamadı.
            </Text>
          </View>
        ) : (
          <View className="px-4 py-12 items-center">
            <Text className="text-[48px]">💼</Text>
            <Text className="text-white/60 text-sm text-center mt-3">
              Henüz fırsat eklenmemiş. Alt bardaki + butonu ile fırsat ekleyin.
            </Text>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}
