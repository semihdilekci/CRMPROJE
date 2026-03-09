export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ValidationDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: ValidationDetail[];
}
