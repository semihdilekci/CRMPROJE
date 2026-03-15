import { Tabs } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

function TabBarIcon({ name, label }: { name: string; label: string }) {
  return (
    <View className="items-center justify-center">
      <Text className="text-[20px]">{name}</Text>
      <Text className="text-white/60 text-[10px] mt-0.5">{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(2, 6, 23, 0.95)',
          borderTopColor: 'rgba(255,255,255,0.1)',
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
      }}
    >
      <Tabs.Screen
        name="fairs"
        options={{
          title: 'Fuarlar',
          tabBarIcon: () => <TabBarIcon name="🏛" label="Fuarlar" />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Ekle',
          tabBarIcon: () => (
            <View className="w-14 h-14 -mt-6 rounded-2xl bg-[#8b5cf6] items-center justify-center">
              <Text className="text-white text-2xl font-bold">+</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Analiz',
          tabBarIcon: () => <TabBarIcon name="📊" label="AI Analiz" />,
        }}
      />
    </Tabs>
  );
}
