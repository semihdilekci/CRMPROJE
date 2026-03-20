import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { LoadingView } from '@/components/ui/LoadingView';
import { ErrorState } from '@/components/ui/ErrorState';
import { CustomerProfileScroll } from '@/components/customer/CustomerProfileScroll';
import { CustomerEditSheet } from '@/components/customer/CustomerEditSheet';
import {
  useCustomerProfile,
  useDeleteCustomer,
} from '@/hooks/use-customers';
import { isNetworkError } from '@/lib/error-utils';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [editVisible, setEditVisible] = useState(false);

  const { data: profile, isLoading, error, refetch } = useCustomerProfile(id ?? null);
  const deleteCustomer = useDeleteCustomer();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(drawer)/(tabs)/customers');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Müşteriyi Sil',
      'Bu müşteri ve ilişkili veriler silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer.mutateAsync(id);
              router.replace('/(drawer)/(tabs)/customers');
            } catch {
              Alert.alert('Hata', 'Müşteri silinemedi.');
            }
          },
        },
      ]
    );
  };

  if (!id) {
    return (
      <GradientBackground>
        <Header title="Müşteri" onBackPress={handleBack} showSearch={false} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white/60">Geçersiz müşteri</Text>
        </View>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <Header title="Müşteri" onBackPress={handleBack} showSearch={false} />
        <View className="flex-1">
          <ErrorState
            message="Profil yüklenirken hata oluştu"
            onRetry={() => refetch()}
            isNetworkError={isNetworkError(error)}
          />
        </View>
      </GradientBackground>
    );
  }

  if (isLoading || !profile) {
    return (
      <GradientBackground>
        <Header title="Müşteri" onBackPress={handleBack} showSearch={false} />
        <View className="flex-1">
          {isLoading ? (
            <LoadingView message="Profil yükleniyor..." />
          ) : (
            <Text className="text-white/60 text-center mt-8">Profil bulunamadı</Text>
          )}
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Header
        title={profile.customer.company}
        onBackPress={handleBack}
        showSearch={false}
      />
      <CustomerProfileScroll
        profile={profile}
        customerId={id}
        onEditPress={() => setEditVisible(true)}
        onDeletePress={handleDelete}
      />
      <CustomerEditSheet
        visible={editVisible}
        customerId={id}
        initial={{
          company: profile.customer.company,
          name: profile.customer.name,
          phone: profile.customer.phone ?? '',
          email: profile.customer.email ?? '',
          address: null,
        }}
        onClose={() => setEditVisible(false)}
      />
    </GradientBackground>
  );
}
