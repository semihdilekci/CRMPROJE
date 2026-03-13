'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.replace('/fairs');
    } catch {
      setError('E-posta veya parola hatalı');
    } finally {
      setLoading(false);
    }
  };

  const isValid = email.length > 0 && password.length >= 6;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[400px] rounded-2xl border border-white/20 backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Fuar CRM</h1>
          <p className="mt-2 text-[14px] text-white/60">Yönetim paneline giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <Button type="submit" disabled={!isValid || loading} className="mt-2 w-full py-3">
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>
      </div>
    </div>
  );
}
