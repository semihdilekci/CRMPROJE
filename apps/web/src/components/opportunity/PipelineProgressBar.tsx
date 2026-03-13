'use client';

import {
  PIPELINE_STAGES,
  getStageBadgeColor,
  getStageLabel,
  getStageOrder,
  getNextStageInSequence,
  isTerminalStage,
} from '@crm/shared';
import { cn } from '@/lib/utils';

interface PipelineProgressBarProps {
  currentStage: string;
  onStageClick: (stage: string) => void;
  compact?: boolean;
  interactive?: boolean;
  /** Aşama geçmişinde girilmiş aşamalar. Verilirse yeşil gösterim buna göre yapılır. */
  completedStages?: string[];
}

export function PipelineProgressBar({
  currentStage,
  onStageClick,
  compact = false,
  interactive = true,
  completedStages,
}: PipelineProgressBarProps) {
  const currentOrder = getStageOrder(currentStage);
  const currentIsTerminal = isTerminalStage(currentStage);
  const completedSet = completedStages ? new Set(completedStages) : null;

  return (
    <div className={cn('w-full', compact ? 'py-1' : 'py-2')}>
      <div className="flex justify-center">
        <div className="flex w-full items-center">
          {PIPELINE_STAGES.map((stage, idx) => {
            const stageOrder = stage.order;
            const isCurrent = stage.value === currentStage;
            const isPrevious =
              completedSet !== null
                ? completedSet.has(stage.value) && !isCurrent
                : currentStage === 'olumsuz'
                  ? stageOrder < 6
                  : stageOrder < currentOrder;
            const isCompleted = isCurrent || isPrevious;

            const nextStageValue = getNextStageInSequence(currentStage);
            const isClickable =
              interactive &&
              !isCurrent &&
              !currentIsTerminal &&
              nextStageValue !== null &&
              stage.value === nextStageValue;

            const color =
              stage.terminal && currentIsTerminal && isCurrent
                ? getStageBadgeColor(stage.value)
                : isCompleted
                  ? '#4ADE80'
                  : '#6B7280';

            const circleClass = cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold backdrop-blur-sm',
              isClickable && 'cursor-pointer transition-colors hover:border-violet-400/60',
              isCurrent && 'ring-2 ring-violet-400/30',
              !isClickable && !isCurrent && 'cursor-not-allowed opacity-80',
            );

            const nextStage = PIPELINE_STAGES[idx + 1];
            const nextCompleted =
              nextStage && completedSet !== null
                ? completedSet.has(nextStage.value) || nextStage.value === currentStage
                : nextStage && nextStage.order <= currentOrder;
            const isLineGreen = isCompleted && nextCompleted;

            const lineClass = cn(
              'h-[2px] min-w-[12px] flex-1 rounded-full',
              isLineGreen ? 'bg-green-500' : 'bg-white/20',
            );

            const isLast = idx === PIPELINE_STAGES.length - 1;
            return (
              <div key={stage.value} className={cn('flex flex-col', isLast ? 'shrink-0' : 'min-w-0 flex-1')}>
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
                    {isCurrent ? '✓' : idx + 1}
                  </button>

                  {idx !== PIPELINE_STAGES.length - 1 && <div className={lineClass} />}
                </div>

              {!compact && (
                <div className="mt-2 min-w-0 text-center">
                  <p
                    className={cn(
                      'truncate text-[12px] font-medium',
                      isCurrent ? 'text-white' : 'text-white/60',
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
      </div>

      {currentStage === 'satisa_donustu' && !compact && (
        <p className="mt-2 text-[12px] font-semibold text-green-500">
          Satışa dönüştü
        </p>
      )}

      {currentStage === 'olumsuz' && !compact && (
        <p className="mt-2 text-[12px] font-semibold text-red-400">
          Olumsuz sonuçlandı
        </p>
      )}
    </div>
  );
}

