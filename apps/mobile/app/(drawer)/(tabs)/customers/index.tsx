import { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import type { CustomerListSortBy } from '@crm/shared';
import { Header } from '@/components/layout/Header';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingView } from '@/components/ui/LoadingView';
import { Input } from '@/components/ui/Input';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { CustomerListCard } from '@/components/customer/CustomerListCard';
import { useCustomerList } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';
import { isNetworkError } from '@/lib/error-utils';

const SORT_OPTIONS: DropdownOption<CustomerListSortBy>[] = [
  { value: 'lastContact', label: 'Son Temas' },
  { value: 'company', label: 'Firma Adı' },
  { value: 'opportunityCount', label: 'Fırsat Sayısı' },
];

export default function CustomersListScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<CustomerListSortBy>('lastContact');
  const debouncedSearch = useDebounce(search, 300);

  const { data: customers, isLoading, error, refetch } = useCustomerList(
    debouncedSearch || undefined,
    sortBy
  );

  const stats = useMemo(() => {
    const list = customers ?? [];
    const uniqueCompanies = new Set(list.map((c) => c.company.trim().toLowerCase())).size;
    return { total: list.length, uniqueCompanies };
  }, [customers]);

  const list = customers ?? [];

  const renderEmpty = () => (
    <View className="items-center justify-center px-8 py-16">
      <Text className="text-5xl mb-4">👤</Text>
      <Text className="text-white text-xl font-semibold text-center">Müşteri bulunamadı</Text>
      <Text className="text-white/60 text-center mt-2">
        Arama kriterlerinizi değiştirin veya yeni müşteriyi fuar ekranından ekleyin
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <GradientBackground>
        <Header
          showSearch={false}
          title="Müşteriler"
          onMenuPress={() => {
            (navigation as { openDrawer?: () => void }).openDrawer?.();
          }}
        />
        <LoadingView message="Müşteriler yükleniyor..." />
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <Header
          showSearch={false}
          title="Müşteriler"
          onMenuPress={() => {
            (navigation as { openDrawer?: () => void }).openDrawer?.();
          }}
        />
        <View className="flex-1">
          <ErrorState
            message="Müşteriler yüklenirken hata oluştu"
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
        showSearch={false}
        title="Müşteriler"
        onMenuPress={() => {
          (navigation as { openDrawer?: () => void }).openDrawer?.();
        }}
      />
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="pb-3 gap-3">
          <Text className="text-white/60 text-sm">
            {stats.total} müşteri · {stats.uniqueCompanies} farklı firma
          </Text>
          <Input
            placeholder="Müşteri veya firma ara..."
            value={search}
            onChangeText={setSearch}
          />
          <Dropdown<CustomerListSortBy>
            value={sortBy}
            options={SORT_OPTIONS}
            onSelect={setSortBy}
            placeholder="Sıralama"
          />
        </View>

        {list.length === 0 ? (
          renderEmpty()
        ) : (
          list.map((item, index) => (
            <View key={item.id} style={{ marginBottom: index < list.length - 1 ? 12 : 0 }}>
              <CustomerListCard
                customer={item}
                onPress={() => router.push(`/(drawer)/(tabs)/customers/${item.id}`)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </GradientBackground>
  );
}
