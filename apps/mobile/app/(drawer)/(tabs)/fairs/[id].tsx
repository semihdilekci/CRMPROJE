import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { FairDetailHeader } from '@/components/fair/FairDetailHeader';
import { FairStats } from '@/components/fair/FairStats';
import { FilterDrawer } from '@/components/fair/FilterDrawer';
import { OpportunityCard } from '@/components/opportunity/OpportunityCard';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingView } from '@/components/ui/LoadingView';
import { useFairDetail } from '@/hooks/use-fairs';
import { isNetworkError } from '@/lib/error-utils';
import { useOpportunityFormStore } from '@/stores/opportunity-form-store';
import { useStageTransitionStore } from '@/stores/stage-transition-store';
import { useFairOpportunityFocusStore } from '@/stores/fair-opportunity-focus-store';
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

function normalizeParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default function FairDetailScreen() {
  const params = useLocalSearchParams<{ id: string; opportunityId?: string | string[] }>();
  const globalParams = useGlobalSearchParams();
  const id = normalizeParam(params.id) ?? '';
  const opportunityIdFromQuery = normalizeParam(params.opportunityId) ?? normalizeParam(
    (globalParams as Record<string, string | string[] | undefined>).opportunityId
  );
  const router = useRouter();
  const { data: fair, isLoading, error, refetch } = useFairDetail(id ?? null);

  const [search, setSearch] = useState('');
  const [selectedRates, setSelectedRates] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [filterDrawerExpanded, setFilterDrawerExpanded] = useState(false);
  /** Aynı fuar+fırsat için tekrar tekrar filtre yazmayı önler; id / query değişince sıfırlanır. */
  const lastAppliedFocusKeyRef = useRef<string | null>(null);
  const openOpportunityForm = useOpportunityFormStore((s) => s.open);
  const openStageTransition = useStageTransitionStore((s) => s.open);

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

  /** Yeni deep link veya farklı fuar için aynı oturumda tekrar uygulanabilsin. */
  useEffect(() => {
    lastAppliedFocusKeyRef.current = null;
  }, [id, opportunityIdFromQuery]);

  const applyOpportunityFiltersFromDeepLink = useCallback(() => {
    if (!fair?.id || !id || fair.id !== id) return;

    const pending = useFairOpportunityFocusStore.getState().pending;
    const fromStore =
      pending?.fairId === id && pending.opportunityId ? pending.opportunityId : null;
    const opportunityId = fromStore ?? opportunityIdFromQuery;
    if (!opportunityId) return;

    const focusKey = `${fair.id}:${opportunityId}`;
    if (lastAppliedFocusKeyRef.current === focusKey) return;

    const opp = fair.opportunities.find((o) => o.id === opportunityId);
    if (!opp) return;

    if (fromStore) {
      useFairOpportunityFocusStore.getState().consume(id);
    }
    lastAppliedFocusKeyRef.current = focusKey;
    const company = opp.customer?.company?.trim() ?? '';
    const personName = opp.customer?.name?.trim() ?? '';
    setSearch(company || personName);
    setSelectedRates(opp.conversionRate ? [opp.conversionRate] : []);
    setStageFilter(opp.currentStage ?? null);
    setFilterDrawerExpanded(true);
  }, [fair, id, opportunityIdFromQuery]);

  useFocusEffect(
    useCallback(() => {
      applyOpportunityFiltersFromDeepLink();
    }, [applyOpportunityFiltersFromDeepLink])
  );

  useEffect(() => {
    applyOpportunityFiltersFromDeepLink();
  }, [applyOpportunityFiltersFromDeepLink]);

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
            <LoadingView message="Fuar detayı yükleniyor..." />
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
        <View className="flex-1">
          <ErrorState
            message="Fuar detayı yüklenirken hata oluştu"
            onRetry={() => refetch()}
            isNetworkError={isNetworkError(error)}
          />
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
