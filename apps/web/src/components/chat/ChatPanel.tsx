'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { useChatQuery } from '@/hooks/use-chat';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import type { ChartData, TableData, AIProvider } from '@crm/shared';

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
  charts?: ChartData[];
  tables?: TableData[];
  exportId?: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<AIProvider>('claude');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatQuery = useChatQuery();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSubmit = async () => {
    const msg = input.trim();
    if (!msg || chatQuery.isPending) return;

    const userMessage: MessageItem = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const recentMessages = [...messages, userMessage]
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await chatQuery.mutateAsync({
        message: msg,
        messages: recentMessages,
        provider,
      });

      const assistantMessage: MessageItem = {
        role: 'assistant',
        content: result.text,
        charts: result.charts,
        tables: result.tables,
        exportId: result.exportId,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.',
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/50 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[20px] font-semibold text-text">
              AI Analiz Asistanı
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Fuar ve müşteri verilerinizi sorarak analiz edin.
            </p>
          </div>
          <Select
            label="Model"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            className="w-[200px]"
          >
            <option value="claude">Claude (Bulut)</option>
            <option value="ollama">Ollama Qwen (Yerel)</option>
          </Select>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto flex max-w-[960px] flex-col gap-6">
          {messages.length === 0 && (
            <div className="py-12 text-center text-muted">
              <p className="text-[14px]">
                Bir soru yazın. Örn: &quot;Fuarlarımın fırsat dağılımı nasıl?&quot;
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <ChatMessage
              key={i}
              role={m.role}
              content={m.content}
              charts={m.charts}
              tables={m.tables}
              exportId={m.exportId}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-[720px] gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Analiz etmek istediğiniz soruyu yazın..."
            className="min-h-[80px] max-h-[160px] resize-y"
            rows={2}
            disabled={chatQuery.isPending}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || chatQuery.isPending}
            className="self-end"
          >
            {chatQuery.isPending ? 'Analiz ediliyor...' : 'Gönder'}
          </Button>
        </div>
      </div>
    </div>
  );
}
