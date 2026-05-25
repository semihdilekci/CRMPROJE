'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useMyPermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth-store';

export default function ChatPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: permissions, isLoading } = useMyPermissions();

  const isAdmin = user?.role === 'admin';
  const hasAccess = isAdmin || permissions?.permissions.includes('ai_analyst');

  useEffect(() => {
    if (!isLoading && permissions && !hasAccess) {
      router.replace('/fairs');
    }
  }, [isLoading, permissions, hasAccess, router]);

  if (isLoading || (!hasAccess && !isAdmin)) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex min-h-0 flex-1 flex-col">
        <ChatPanel />
      </main>
    </div>
  );
}
