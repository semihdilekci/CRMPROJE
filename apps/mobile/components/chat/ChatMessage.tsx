import { View, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { downloadChatExport } from '@/hooks/use-chat';
import type { ChartData, TableData } from '@crm/shared';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  charts?: ChartData[];
  tables?: TableData[];
  exportId?: string;
}

function ChartDataView({ chart }: { chart: ChartData }) {
  const { title, labels, data, description } = chart;
  const isSimpleData = Array.isArray(data);

  const rows: { label: string; value: number }[] = isSimpleData
    ? (data as number[]).map((val, i) => ({
        label: labels[i] ?? '-',
        value: val,
      }))
    : (() => {
        const obj = data as { [key: string]: number[] };
        const keys = Object.keys(obj);
        const len = keys.length ? (obj[keys[0]]?.length ?? 0) : 0;
        return Array.from({ length: len }, (_, i) => ({
          label: labels[i] ?? keys.join(', '),
          value: keys.reduce((sum, k) => sum + (obj[k]?.[i] ?? 0), 0),
        }));
      })();

  return (
    <View className="rounded-xl border border-white/20 bg-white/5 p-4 mb-3">
      <Text className="text-white font-semibold text-[15px] mb-2">{title}</Text>
      <View className="gap-1.5">
        {rows.map((r, i) => (
          <View key={i} className="flex-row justify-between">
            <Text className="text-white/70 text-[13px]" numberOfLines={1}>
              {r.label}
            </Text>
            <Text className="text-white text-[13px]">{String(r.value)}</Text>
          </View>
        ))}
      </View>
      {description && (
        <Text className="text-white/50 text-[12px] italic mt-2">{description}</Text>
      )}
    </View>
  );
}

function TableDataView({ table }: { table: TableData }) {
  const { columns, rows } = table;

  return (
    <View className="rounded-xl border border-white/20 bg-white/5 overflow-hidden mb-3">
      <View className="flex-row border-b border-white/20 bg-white/5">
        {columns.map((col, i) => (
          <View key={i} className="flex-1 px-3 py-2.5">
            <Text className="text-white font-semibold text-[13px]" numberOfLines={1}>
              {col}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View
          key={ri}
          className={`flex-row ${ri % 2 === 1 ? 'bg-white/5' : ''}`}
        >
          {row.map((cell, ci) => (
            <View key={ci} className="flex-1 px-3 py-2">
              <Text
                className="text-white/60 text-[12px]"
                numberOfLines={2}
              >
                {String(cell)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
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
    <View className={`flex-row gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <View
        className={`h-8 w-8 rounded-full items-center justify-center ${
          isUser ? 'bg-violet-500/20' : 'bg-white/5'
        }`}
      >
        <Text className="text-[16px]">{isUser ? '👤' : '🤖'}</Text>
      </View>
      <View
        className={`flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <View
          className={`rounded-xl px-4 py-3 max-w-[90%] ${
            isUser
              ? 'border border-violet-500/40 bg-violet-500/10'
              : 'border border-white/20 bg-white/5'
          }`}
        >
          <Text className="text-white text-[14px] leading-relaxed">
            {content}
          </Text>
        </View>
        {!isUser && ((charts?.length ?? 0) > 0 || (tables?.length ?? 0) > 0) && (
          <View className="mt-3 w-full">
            {charts?.map((chart, i) => (
              <ChartDataView key={`chart-${i}`} chart={chart} />
            ))}
            {tables?.map((table, i) => (
              <TableDataView key={`table-${i}`} table={table} />
            ))}
          </View>
        )}
        {!isUser && exportId && (
          <Button
            variant="secondary"
            onPress={() => downloadChatExport(exportId)}
            className="mt-2"
          >
            📥 Excel İndir
          </Button>
        )}
      </View>
    </View>
  );
}
