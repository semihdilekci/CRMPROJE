import type { FeedbackCategory } from '../schemas/feedback.schema';

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
}
