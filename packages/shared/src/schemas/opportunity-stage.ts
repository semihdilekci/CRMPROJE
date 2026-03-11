import { z } from 'zod';
import { PIPELINE_STAGE_VALUES, LOSS_REASON_VALUES } from '../constants/pipeline';

export const stageTransitionSchema = z
  .object({
    stage: z.enum(PIPELINE_STAGE_VALUES as unknown as [string, ...string[]]),
    note: z.string().nullable().optional(),
    lossReason: z
      .enum(LOSS_REASON_VALUES as unknown as [string, ...string[]])
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.stage === 'olumsuz') {
        return data.lossReason != null && data.lossReason !== '';
      }
      return true;
    },
    { message: 'Olumsuz aşamada kayıp nedeni zorunludur', path: ['lossReason'] },
  );

export type StageTransitionInput = z.infer<typeof stageTransitionSchema>;
