import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import type { Customer, CustomerContact } from '@crm/shared';
import { useCustomers } from '@/hooks/use-customers';
import { useCustomerContacts } from '@/hooks/use-customer-contacts';
import { useDebounce } from '@/hooks/use-debounce';
import { CustomerContactEditSheet } from '@/components/customer/CustomerContactEditSheet';

interface CustomerSelectInputProps {
  selectedCustomerId: string | null;
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onAddNew?: () => void;
  selectedContact: CustomerContact | null;
  onSelectContact: (contact: CustomerContact | null) => void;
}

export function CustomerSelectInput({
  selectedCustomerId,
  selectedCustomer,
  onSelect,
  onAddNew,
  selectedContact,
  onSelectContact,
}: CustomerSelectInputProps) {
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewContactSheet, setShowNewContactSheet] = useState(false);
  const debouncedSearch = useDebounce(searchText, 300);

  const { data: customers = [], isLoading: customersLoading } = useCustomers(
    debouncedSearch || undefined,
  );
  const { data: contacts = [], isLoading: contactsLoading } = useCustomerContacts(
    selectedCustomer ? selectedCustomer.id : null,
  );

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    onSelectContact(null);
    setSearchText('');
    setShowDropdown(false);
  };

  const handleClearAll = () => {
    onSelect(null);
    onSelectContact(null);
    setSearchText('');
    setShowDropdown(false);
  };

  // Aşama C: Hem firma hem temsilci seçilmiş
  if (selectedCustomerId && selectedCustomer && selectedContact) {
    return (
      <View>
        <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
          Müşteri
        </Text>
        <View className="rounded-xl border border-white/20 bg-white/5 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 min-w-0">
              <Text className="text-white font-semibold text-[14px]">
                {selectedCustomer.company}
              </Text>
              <Text className="text-white/60 text-[13px] mt-0.5">
                {selectedContact.name}
                {selectedContact.phone ? ` · ${selectedContact.phone}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={handleClearAll}
              className="ml-3 px-3 py-1.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-[#8b5cf6] font-medium text-[13px]">Değiştir</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Aşama B: Firma seçilmiş, temsilci seçilmemiş
  if (selectedCustomerId && selectedCustomer) {
    return (
      <View>
        <Text className="text-white/60 text-[12px] font-bold uppercase tracking-wider mb-1.5">
          Müşteri
        </Text>
        <View className="rounded-xl border border-white/20 bg-white/5 overflow-hidden">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
            <Text className="text-white font-semibold text-[14px] flex-1" numberOfLines={1}>
              {selectedCustomer.company}
            </Text>
            <Pressable
              onPress={handleClearAll}
              className="ml-3 px-2 py-1"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-[#8b5cf6] font-medium text-[12px]">Değiştir</Text>
            </Pressable>
          </View>

          <View className="px-4 pt-2 pb-1">
            <Text className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-1">
              Temsilci Seç
            </Text>
          </View>

          {contactsLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#8b5cf6" />
            </View>
          ) : (
            <>
              {contacts.map((contact) => (
                <Pressable
                  key={contact.id}
                  onPress={() => onSelectContact(contact)}
                  className="flex-row items-center px-4 py-2.5 border-t border-white/5"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                  })}
                >
                  <View className="flex-1">
                    <Text className="text-white text-[13px] font-semibold">{contact.name}</Text>
                    {contact.phone || contact.email ? (
                      <Text className="text-white/50 text-[11px] mt-0.5">
                        {[contact.phone, contact.email].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-white/30 text-[12px]">›</Text>
                </Pressable>
              ))}

              <Pressable
                onPress={() => onSelectContact(null)}
                className="flex-row items-center px-4 py-2.5 border-t border-amber-400/15 bg-amber-500/5"
              >
                <Text className="text-amber-300/80 text-[13px] flex-1">
                  Temsilcisiz devam et
                </Text>
                <Text className="text-amber-300/50 text-[11px]">Opsiyonel</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowNewContactSheet(true)}
                className="flex-row items-center px-4 py-2.5 border-t border-violet-500/15"
              >
                <Text className="text-violet-300 text-[13px] font-medium">+ Yeni Temsilci Ekle</Text>
              </Pressable>
            </>
          )}
        </View>

        <CustomerContactEditSheet
          visible={showNewContactSheet}
          customerId={selectedCustomer.id}
          customerCompany={selectedCustomer.company}
          initial={null}
          onClose={() => setShowNewContactSheet(false)}
          onContactSelected={(c) => {
            onSelectContact(c);
            setShowNewContactSheet(false);
          }}
        />
      </View>
    );
  }

  // Aşama A: Firma henüz seçilmemiş
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
            {customersLoading ? (
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
                  <Text className="text-white font-semibold text-[13px]">{c.company}</Text>
                  <Text className="text-white/60 text-[12px] mt-0.5">
                    {c.primaryContact?.name ?? ''}
                    {c.address ? ` · ${c.address}` : ''}
                  </Text>
                </Pressable>
              ))
            ) : debouncedSearch.length > 0 ? (
              <View className="px-4 py-3">
                <Text className="text-white/60 text-[13px]">Sonuç bulunamadı</Text>
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
          <Text className="text-[#8b5cf6] font-medium text-[13px]">+ Yeni Müşteri Ekle</Text>
        </Pressable>
      )}
    </View>
  );
}
