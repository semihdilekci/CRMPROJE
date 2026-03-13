'use client';

import { ChartRenderer } from './ChartRenderer';
import { TableRenderer } from './TableRenderer';
import { downloadChatExport } from '@/hooks/use-chat';
import { Button } from '@/components/ui/Button';
import type { ChartData, TableData } from '@crm/shared';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  charts?: ChartData[];
  tables?: TableData[];
  exportId?: string;
}

export function ChatMessage({
  role,
  content,
  charts,
  tables,
  exportId,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] ${
          isUser ? 'bg-violet-500/20' : 'backdrop-blur-xl bg-white/5'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>
      <div
        className={`flex w-full max-w-full flex-col gap-3 ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`rounded-xl px-4 py-3 ${
            isUser
              ? 'border border-accent/40 bg-accent/10'
              : 'border border-white/20 backdrop-blur-xl bg-white/5'
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-white">
            {content}
          </pre>
        </div>
        {!isUser && ((charts?.length ?? 0) > 0 || (tables?.length ?? 0) > 0) && (
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {charts?.map((chart, i) => (
              <div key={`chart-${i}`} className="min-w-0">
                <ChartRenderer chart={chart} />
              </div>
            ))}
            {tables?.map((table, i) => (
              <div
                key={`table-${i}`}
                className={`min-w-0 ${table.columns.length > 4 ? 'md:col-span-2' : ''} ${table.rows.length > 5 ? 'xl:col-span-3' : ''}`}
              >
                <TableRenderer table={table} />
              </div>
            ))}
          </div>
        )}
        {!isUser && exportId && (
          <Button
            variant="secondary"
            onClick={() => downloadChatExport(exportId)}
            className="flex items-center gap-2"
          >
            📥 Excel İndir
          </Button>
        )}
      </div>
    </div>
  );
}
