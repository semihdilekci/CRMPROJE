'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage } from './ChatMessage';
import { useChatQuery } from '@/hooks/use-chat';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import type { ChartData, TableData, OllamaModel } from '@crm/shared';

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
  charts?: ChartData[];
  tables?: TableData[];
  exportId?: string;
}

export function ChatPanel() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<'ollama' | 'claude' | 'gemini'>('ollama');
  const [ollamaModel, setOllamaModel] = useState<OllamaModel>('qwen2.5-coder:7b');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatQuery = useChatQuery();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages.length, chatQuery.isPending]);

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
        ...(provider === 'ollama' && { ollamaModel }),
      });

      const assistantMessage: MessageItem = {
        role: 'assistant',
        content: result.text,
        charts: result.charts,
        tables: result.tables,
        exportId: result.exportId,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      const apiMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      if (status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
          },
        ]);
        await logout();
        router.replace('/login');
        return;
      }

      const errorText =
        apiMessage && typeof apiMessage === 'string'
          ? apiMessage
          : 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorText },
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
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">
              AI Analiz Asistanı
            </h1>
            <p className="mt-1 text-[13px] text-white/60">
              Fuar ve müşteri verilerinizi sorarak analiz edin.
            </p>
          </div>
          <Select
            label="Model"
            value={provider === 'ollama' ? ollamaModel : provider}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'claude') {
                setProvider('claude');
              } else if (v === 'gemini') {
                setProvider('gemini');
              } else {
                setProvider('ollama');
                setOllamaModel(v as OllamaModel);
              }
            }}
            className="w-[220px]"
          >
            <option value="claude">Claude (Bulut)</option>
            <option value="gemini">Gemini (Bulut)</option>
            <option value="qwen2.5-coder:7b">Ollama Qwen 7B (Yerel)</option>
            <option value="qwen2.5-coder:14b">Ollama Qwen 14B (Yerel)</option>
          </Select>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
          {messages.length === 0 && !chatQuery.isPending && (
            <div className="py-12 text-center text-white/60">
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
          {chatQuery.isPending && (
            <div className="flex items-center justify-center gap-2 py-6">
              <span className="animate-pulse text-[14px] text-white/60">
                Analiz Hazırlanıyor
              </span>
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4">
        <div className="mx-auto flex w-full max-w-[960px] items-end gap-3">
          <div className="min-w-0 flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Analiz etmek istediğiniz soruyu yazın..."
              className="min-h-[80px] max-h-[160px] w-full resize-y"
              rows={2}
              disabled={chatQuery.isPending}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || chatQuery.isPending}
            className="shrink-0"
          >
            {chatQuery.isPending ? 'Analiz ediliyor...' : 'Gönder'}
          </Button>
        </div>
      </div>
    </div>
  );
}
