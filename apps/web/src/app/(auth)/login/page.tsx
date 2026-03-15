'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
    return 'Sunucuya bağlanılamıyor. API çalışıyor mu kontrol edin.';
  if (axiosErr?.message) return axiosErr.message;
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyMfa } = useAuthStore();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.requiresMfa) {
        setTempToken(result.tempToken);
        setStep('otp');
        setOtpCode('');
      } else {
        router.replace('/fairs');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.length !== 6) return;
    setLoading(true);

    try {
      await verifyMfa(tempToken, otpCode);
      router.replace('/fairs');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setError('');
    setOtpCode('');
    setTempToken('');
  };

  const credentialsValid = email.length > 0 && password.length >= 6;
  const otpValid = otpCode.length === 6;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[400px] rounded-2xl border border-white/20 backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Fuar CRM</h1>
          <p className="mt-2 text-[14px] text-white/60">
            {step === 'credentials'
              ? 'Yönetim paneline giriş yapın'
              : 'Telefonunuza gelen 6 haneli kodu girin'}
          </p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
            <Input
              label="E-Posta"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Parola"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>
            )}

            <Button type="submit" disabled={!credentialsValid || loading} className="mt-2 w-full py-3">
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <MfaCodeInput
              value={otpCode}
              onChange={setOtpCode}
              error={error || undefined}
              disabled={loading}
              onComplete={(code) => setOtpCode(code)}
            />

            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={handleBackToCredentials}
                disabled={loading}
              >
                Geri
              </Button>
              <Button type="submit" className="flex-1" disabled={!otpValid || loading}>
                {loading ? 'Doğrulanıyor...' : 'Doğrula'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
