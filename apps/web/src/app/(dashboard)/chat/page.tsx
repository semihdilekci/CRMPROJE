'use client';

import { TopBar } from '@/components/layout/TopBar';
import { ChatPanel } from '@/components/chat/ChatPanel';

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <main className="flex min-h-0 flex-1 flex-col">
        <ChatPanel />
      </main>
    </div>
  );
}
