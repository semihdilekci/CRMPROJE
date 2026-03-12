'use client';

import {
  PIPELINE_STAGES,
  getStageBadgeColor,
  getStageLabel,
  getStageOrder,
  isTerminalStage,
} from '@crm/shared';
import { cn } from '@/lib/utils';

interface PipelineProgressBarProps {
  currentStage: string;
  onStageClick: (stage: string) => void;
  compact?: boolean;
}

export function PipelineProgressBar({
  currentStage,
  onStageClick,
  compact = false,
}: PipelineProgressBarProps) {
  const currentOrder = getStageOrder(currentStage);
  const currentIsTerminal = isTerminalStage(currentStage);

  return (
    <div className={cn('w-full', compact ? 'py-1' : 'py-2')}>
      <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-3')}>
        {PIPELINE_STAGES.map((stage, idx) => {
          const stageOrder = stage.order;
          const isCurrent = stage.value === currentStage;
          const isPast = stageOrder < currentOrder && !currentIsTerminal;
          const isFuture = stageOrder > currentOrder && !currentIsTerminal;

          const isClickable =
            !isCurrent && (stage.terminal || stageOrder > currentOrder) && !currentIsTerminal;

          const color = isCurrent
            ? getStageBadgeColor(stage.value)
            : isPast
              ? '#4ADE80'
              : stage.terminal && currentIsTerminal
                ? getStageBadgeColor(stage.value)
                : isFuture
                  ? '#6B7280'
                  : '#6B7280';

          const circleClass = cn(
            'flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-bold',
            isClickable && 'cursor-pointer transition-colors hover:border-accent',
            isCurrent && 'ring-2 ring-accent/30',
            !isClickable && !isCurrent && 'cursor-not-allowed opacity-80',
          );

          const lineClass = cn(
            'h-[2px] flex-1 rounded-full',
            isPast ? 'bg-green' : isCurrent ? 'bg-accent/60' : 'bg-border',
          );

          return (
            <div key={stage.value} className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center">
                <button
                  type="button"
                  className={circleClass}
                  style={{
                    borderColor: `${color}70`,
                    backgroundColor: `${color}20`,
                    color,
                  }}
                  onClick={() => isClickable && onStageClick(stage.value)}
                  title={getStageLabel(stage.value)}
                >
                  {isPast ? '✓' : idx + 1}
                </button>

                {idx !== PIPELINE_STAGES.length - 1 && <div className={lineClass} />}
              </div>

              {!compact && (
                <div className="mt-2 min-w-0 text-center">
                  <p
                    className={cn(
                      'truncate text-[12px] font-medium',
                      isCurrent ? 'text-text' : 'text-muted',
                    )}
                  >
                    {getStageLabel(stage.value)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {currentStage === 'satisa_donustu' && !compact && (
        <p className="mt-2 text-[12px] font-semibold text-green">
          Satışa dönüştü
        </p>
      )}

      {currentStage === 'olumsuz' && !compact && (
        <p className="mt-2 text-[12px] font-semibold text-danger">
          Olumsuz sonuçlandı
        </p>
      )}
    </div>
  );
}

