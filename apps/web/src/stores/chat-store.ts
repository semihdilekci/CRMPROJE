import { create } from 'zustand';
import type { ChartData, TableData } from '@crm/shared';

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
  charts?: ChartData[];
  tables?: TableData[];
  exportId?: string;
}

interface ChatState {
  messages: ChatMessageItem[];
  addMessage: (message: ChatMessageItem) => void;
  setMessages: (messages: ChatMessageItem[]) => void;
  clearMessages: () => void;
}

/**
 * Chat mesajları bellekte tutulur.
 * - Sayfa geçişlerinde korunur (AI Analiz → Fuarlar → AI Analiz)
 * - Sayfa yenilendiğinde (F5) temizlenir
 * - Bellek yükü: ~50 mesaj + chart/table verisi ≈ 100–500 KB (ihmal edilebilir)
 */
export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
}));
