import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { Customer } from '@crm/shared';
import { Input } from '@/components/ui/Input';
import { useCustomers } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';

interface CustomerSelectInputProps {
  selectedCustomerId: string | null;
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onAddNew?: () => void;
}

export function CustomerSelectInput({
  selectedCustomerId,
  selectedCustomer,
  onSelect,
  onAddNew,
}: CustomerSelectInputProps) {
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchText, 300);
  const { data: customers = [], isLoading } = useCustomers(
    debouncedSearch || undefined
  );

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    setSearchText('');
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    onSelect(null);
    setSearchText('');
    setShowDropdown(false);
  };

  if (selectedCustomerId && selectedCustomer) {
    return (
      <View>
        <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
          Müşteri
        </Text>
        <View className="flex-row items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 py-3">
          <View className="flex-1 min-w-0">
            <Text className="text-white font-semibold text-[14px]">
              {selectedCustomer.company}
            </Text>
            <Text className="text-white/60 text-[13px] mt-0.5">
              {selectedCustomer.name}
              {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ''}
              {selectedCustomer.email ? ` · ${selectedCustomer.email}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={handleClearSelection}
            className="ml-3 px-3 py-1.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Text className="text-[#8b5cf6] font-medium text-[13px]">
              Değiştir
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
        Müşteri
      </Text>
      <TextInput
        placeholder="Müşteri adı veya firma ara..."
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className="rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-white text-[14px]"
      />

      {showDropdown && (searchText.length > 0 || customers.length > 0) && (
        <View className="mt-1 max-h-[200px] rounded-xl border border-white/20 bg-[#0D0D0D] overflow-hidden">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            className="max-h-[200px]"
          >
            {isLoading ? (
              <View className="px-4 py-3">
                <Text className="text-white/60 text-[13px]">Yükleniyor...</Text>
              </View>
            ) : customers.length > 0 ? (
              customers.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => handleSelectCustomer(c)}
                  className="px-4 py-2.5 border-b border-white/10"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                  })}
                >
                  <Text className="text-white font-semibold text-[13px]">
                    {c.company}
                  </Text>
                  <Text className="text-white/60 text-[12px] mt-0.5">
                    {c.name}
                    {c.phone ? ` · ${c.phone}` : ''}
                  </Text>
                </Pressable>
              ))
            ) : debouncedSearch.length > 0 ? (
              <View className="px-4 py-3">
                <Text className="text-white/60 text-[13px]">
                  Sonuç bulunamadı
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}

      {onAddNew && (
        <Pressable
          onPress={onAddNew}
          className="mt-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-[#8b5cf6] font-medium text-[13px]">
            + Yeni Müşteri Ekle
          </Text>
        </Pressable>
      )}
    </View>
  );
}
