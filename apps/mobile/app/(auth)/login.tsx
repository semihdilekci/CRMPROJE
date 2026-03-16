import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@crm/shared';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MfaCodeInput } from '@/components/auth/MfaCodeInput';

function getErrorMessage(err: unknown): string {
  const axiosErr = err as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
    code?: string;
  };
  const status = axiosErr?.response?.status;
  const message = axiosErr?.response?.data?.message;

  if (status === 429) return 'Çok fazla deneme. Lütfen birkaç dakika bekleyin.';
  if (status === 401 && message) return message;
  if (message) return message;
  if (axiosErr?.code === 'ERR_NETWORK')
    return 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
  if (axiosErr?.message) return axiosErr.message;
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, verifyMfa } = useAuthStore();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const email = watch('email');
  const password = watch('password');
  const credentialsValid = !!email && password.length >= 6;
  const otpValid = otpCode.length === 6;

  const handleCredentialsSubmit = async (data: LoginDto) => {
    setSubmitError('');
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.requiresMfa) {
        setTempToken(result.tempToken);
        setStep('otp');
        setOtpCode('');
      } else {
        router.replace('/(drawer)/(tabs)/fairs');
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setSubmitError('');
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      await verifyMfa(tempToken, otpCode);
      router.replace('/(drawer)/(tabs)/fairs');
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setSubmitError('');
    setOtpCode('');
    setTempToken('');
  };

  const content = (
    <View className="flex-1 bg-[#020617] items-center justify-center px-6">
      <View className="w-full max-w-[400px] rounded-2xl border border-white/20 bg-white/5 p-6">
        <View className="mb-6 items-center">
          <Text className="text-white text-2xl font-semibold">Fuar CRM</Text>
          <Text className="text-white/60 text-[14px] mt-2 text-center">
            {step === 'credentials'
              ? 'Yönetim paneline giriş yapın'
              : 'Telefonunuza gelen 6 haneli kodu girin'}
          </Text>
        </View>

        {step === 'credentials' ? (
          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="E-Posta"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="ornek@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Parola"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="password"
                  error={errors.password?.message}
                />
              )}
            />

            {submitError ? (
              <View className="rounded-lg bg-[#F87171]/20 border border-[#F87171]/40 px-3 py-2">
                <Text className="text-[13px] text-[#F87171]">{submitError}</Text>
              </View>
            ) : null}

            <Button
              onPress={handleSubmit(handleCredentialsSubmit)}
              disabled={!credentialsValid || loading}
              className="mt-2 w-full py-3"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </View>
        ) : (
          <View className="gap-4">
            <MfaCodeInput
              value={otpCode}
              onChange={setOtpCode}
              error={submitError || undefined}
              disabled={loading}
              onComplete={(code) => setOtpCode(code)}
            />

            {submitError ? (
              <View className="rounded-lg bg-[#F87171]/20 border border-[#F87171]/40 px-3 py-2">
                <Text className="text-[13px] text-[#F87171]">{submitError}</Text>
              </View>
            ) : null}

            <View className="flex-row gap-3">
              <Button
                variant="secondary"
                onPress={handleBackToCredentials}
                disabled={loading}
                className="flex-1"
              >
                Geri
              </Button>
              <Button
                onPress={handleOtpSubmit}
                disabled={!otpValid || loading}
                className="flex-1"
              >
                {loading ? 'Doğrulanıyor...' : 'Doğrula'}
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
