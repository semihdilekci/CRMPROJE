import { useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

const PLATFORM_LABEL = Platform.OS === 'ios' ? 'Jailbreak' : 'Root';

/**
 * Jailbreak / root tespit edildiğinde gösterilen tam ekran blok.
 * Kullanıcı hiçbir aksiyona erişemez; uygulama kullanılamaz hâle gelir.
 * @see docs/phase-7-security-hardening.md §5 P1-B, §12
 */
export function JailbreakBlockScreen() {
  useEffect(() => {
    console.warn(
      `[CRM Mobile][sec7-08] ${PLATFORM_LABEL} tespit edildi — uygulama bloke edildi.`,
    );
  }, []);

  return (
    <LinearGradient
      colors={['#1a0a0a', '#0f0a0a', '#020617']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View
          style={{
            backgroundColor: 'rgba(248,113,113,0.08)',
            borderWidth: 1,
            borderColor: theme.colors.danger,
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>

          <Text
            style={{
              color: theme.colors.danger,
              fontSize: 18,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Güvenlik İhlali Tespit Edildi
          </Text>

          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 8,
            }}
          >
            Bu cihazda {PLATFORM_LABEL.toLowerCase()} tespit edildi.
          </Text>

          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Kurumsal güvenlik politikası gereği uygulama bu cihazda çalışamaz.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
