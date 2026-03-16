import { Tabs, usePathname } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { GradientView } from '@/components/ui/GradientView';
import { FairTabIcon } from '@/components/ui/FairTabIcon';
import { ChartTabIcon } from '@/components/ui/ChartTabIcon';
import { useFairFormStore } from '@/stores/fair-form-store';
import { useOpportunityFormStore } from '@/stores/opportunity-form-store';

function AddButton(props: React.ComponentProps<typeof Pressable>) {
  const pathname = usePathname();
  const openFairForm = useFairFormStore((s) => s.open);
  const openOpportunityForm = useOpportunityFormStore((s) => s.open);

  const handlePress = () => {
    const fairDetailMatch = pathname?.match(/\/fairs\/([^/]+)/);
    if (fairDetailMatch) {
      openOpportunityForm(fairDetailMatch[1]);
    } else {
      openFairForm();
    }
  };

  return (
    <Pressable {...props} onPress={handlePress}>
      {props.children}
    </Pressable>
  );
}

function TabBarIconOnly({
  icon: Icon,
  focused,
}: {
  icon: React.ComponentType<{ focused?: boolean }>;
  focused?: boolean;
}) {
  return (
    <View className="items-center justify-center flex-1">
      <Icon focused={focused} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(2, 6, 23, 0.95)',
          borderTopColor: 'rgba(255,255,255,0.1)',
          height: 64,
        },
        tabBarItemStyle: { paddingVertical: 8 },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
      }}
    >
      <Tabs.Screen
        name="fairs"
        options={{
          title: 'Fuarlar',
          tabBarIcon: ({ focused }) => (
            <TabBarIconOnly icon={FairTabIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Ekle',
          tabBarIcon: () => (
            <View
              className="items-center justify-center"
              style={{
                marginTop: -16,
                shadowColor: '#8b5cf6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <GradientView
                direction="horizontal"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="text-white font-bold" style={{ fontSize: 28 }}>+</Text>
              </GradientView>
            </View>
          ),
          tabBarButton: (props) => <AddButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Analiz',
          tabBarIcon: ({ focused }) => (
            <TabBarIconOnly icon={ChartTabIcon} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
