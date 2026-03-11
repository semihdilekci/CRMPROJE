import type { PipelineStageValue, LossReasonValue } from '../constants/pipeline';

export type PipelineStage = PipelineStageValue;
export type LossReason = LossReasonValue;

export interface OpportunityStageLogChangedBy {
  id: string;
  name: string;
  email: string;
}

export interface OpportunityStageLog {
  id: string;
  opportunityId: string;
  stage: string;
  note: string | null;
  lossReason: string | null;
  createdAt: string;
  changedBy: OpportunityStageLogChangedBy;
}
